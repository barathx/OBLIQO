import {
  PrismaClient,
  Obligation,
  Priority,
  ObligationStatus,
  ReminderStatus,
  NotificationType,
  ActivityType,
} from '@prisma/client';
import { logger } from '../utils/logger.js';
import { prisma } from './obligations.service.js';

export class ReminderService {
  /**
   * Determine days before rules based on priority.
   */
  static getDaysBeforeRules(priority: Priority): number[] {
    switch (priority) {
      case Priority.CRITICAL:
      case Priority.HIGH:
        return [7, 3, 1, 0];
      case Priority.MEDIUM:
        return [3, 1, 0];
      case Priority.LOW:
      default:
        return [1, 0];
    }
  }

  /**
   * Calculate remindAt timestamp given a deadline date and daysBefore.
   * Defaults to 09:00:00 local time on the target date.
   */
  static calculateRemindAt(deadline: Date, daysBefore: number): Date {
    const target = new Date(deadline.getTime() - daysBefore * 24 * 60 * 60 * 1000);
    target.setHours(9, 0, 0, 0);
    return target;
  }

  /**
   * Generate default reminders for a single active obligation based on its priority and deadline.
   * Idempotent: Skips reminders that already exist.
   */
  static async generateDefaultRemindersForObligation(obligation: Obligation): Promise<void> {
    if (obligation.status !== ObligationStatus.PENDING || !obligation.deadline) {
      return;
    }

    const rules = this.getDaysBeforeRules(obligation.priority);
    const deadlineDate = new Date(obligation.deadline);

    for (const daysBefore of rules) {
      const remindAt = this.calculateRemindAt(deadlineDate, daysBefore);

      // Check if reminder already exists for this obligation and daysBefore
      const existing = await prisma.reminder.findFirst({
        where: {
          obligationId: obligation.id,
          daysBefore,
        },
      });

      if (!existing) {
        await prisma.reminder.create({
          data: {
            userId: obligation.userId,
            obligationId: obligation.id,
            remindAt,
            daysBefore,
            status: ReminderStatus.PENDING,
          },
        });
        logger.info(`[REMINDER] Reminder created for ${obligation.title} (${daysBefore} days before)`);
      }
    }
  }

  /**
   * Scan all pending obligations and ensure reminders exist.
   */
  static async generateRemindersForActiveObligations(): Promise<void> {
    const activeObligations = await prisma.obligation.findMany({
      where: {
        status: ObligationStatus.PENDING,
        deadline: { not: null },
      },
    });

    for (const obligation of activeObligations) {
      await this.generateDefaultRemindersForObligation(obligation);
    }
  }

  /**
   * Process all pending reminders where remindAt <= current time.
   * Atomically triggers notifications and updates reminder status to SENT.
   */
  static async processDueReminders(): Promise<void> {
    const now = new Date();

    const dueReminders = await prisma.reminder.findMany({
      where: {
        status: ReminderStatus.PENDING,
        remindAt: { lte: now },
      },
      include: {
        obligation: true,
      },
    });

    for (const reminder of dueReminders) {
      // If obligation missing, completed, or archived, mark reminder CANCELLED
      if (!reminder.obligation || reminder.obligation.status !== ObligationStatus.PENDING) {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: ReminderStatus.CANCELLED },
        });
        logger.info(`[REMINDER] Skipped completed or non-pending obligation: ${reminder.obligationId}`);
        continue;
      }

      const daysBefore = reminder.daysBefore ?? 0;
      const title = reminder.obligation.title;
      const message =
        daysBefore === 0
          ? `Your ${title} is due today.`
          : `Your ${title} is due in ${daysBefore} ${daysBefore === 1 ? 'day' : 'days'}.`;

      const notificationType =
        daysBefore === 0 ? NotificationType.REMINDER : NotificationType.DEADLINE_APPROACHING;

      // Idempotency check: verify notification not already created for this reminder trigger
      const existingNotif = await prisma.notification.findFirst({
        where: {
          obligationId: reminder.obligationId,
          type: notificationType,
          message,
        },
      });

      if (!existingNotif) {
        await prisma.$transaction(async (tx) => {
          await tx.reminder.update({
            where: { id: reminder.id },
            data: { status: ReminderStatus.SENT },
          });

          await tx.notification.create({
            data: {
              userId: reminder.userId,
              obligationId: reminder.obligationId,
              title,
              message,
              type: notificationType,
              isRead: false,
            },
          });

          await tx.activityEvent.create({
            data: {
              userId: reminder.userId,
              obligationId: reminder.obligationId,
              type: ActivityType.REMINDER_CREATED,
              title: 'Reminder Triggered',
              description: message,
            },
          });
        });

        logger.info(`[REMINDER] Reminder triggered for ${title}`);
        logger.info(`[NOTIFICATION] Created notification for ${title}`);
      } else {
        // Just update reminder to SENT to avoid stuck PENDING
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: ReminderStatus.SENT },
        });
        logger.info(`[REMINDER] Duplicate notification prevented for ${title}`);
      }
    }
  }

  /**
   * Check for overdue obligations and generate overdue notifications.
   */
  static async processOverdueObligations(): Promise<void> {
    const now = new Date();

    const overdueObligations = await prisma.obligation.findMany({
      where: {
        status: ObligationStatus.PENDING,
        deadline: { lte: now },
      },
    });

    for (const obligation of overdueObligations) {
      // Check if overdue notification already created
      const existingOverdueNotif = await prisma.notification.findFirst({
        where: {
          obligationId: obligation.id,
          message: { contains: 'overdue' },
        },
      });

      if (!existingOverdueNotif) {
        const message = `${obligation.title} is overdue.`;
        await prisma.notification.create({
          data: {
            userId: obligation.userId,
            obligationId: obligation.id,
            title: `${obligation.title} Overdue`,
            message,
            type: NotificationType.DEADLINE_APPROACHING,
            isRead: false,
          },
        });
        logger.info(`[NOTIFICATION] Created overdue notification for ${obligation.title}`);
      }
    }
  }

  /**
   * Handle obligation completion: cancel pending reminders and schedule next occurrence if recurring.
   */
  static async handleObligationCompletion(obligationId: string): Promise<void> {
    // 1. Cancel pending reminders
    await prisma.reminder.updateMany({
      where: { obligationId, status: ReminderStatus.PENDING },
      data: { status: ReminderStatus.CANCELLED },
    });
    logger.info(`[REMINDER] Skipped completed obligation ${obligationId}`);

    // 2. Handle recurring obligations
    const obligation = await prisma.obligation.findUnique({
      where: { id: obligationId },
    });

    if (obligation && obligation.deadline && obligation.recurrence !== 'NONE') {
      const currentDeadline = new Date(obligation.deadline);
      const nextDeadline = new Date(currentDeadline);

      switch (obligation.recurrence) {
        case 'DAILY':
          nextDeadline.setDate(nextDeadline.getDate() + 1);
          break;
        case 'WEEKLY':
          nextDeadline.setDate(nextDeadline.getDate() + 7);
          break;
        case 'MONTHLY':
        case 'CUSTOM':
          nextDeadline.setMonth(nextDeadline.getMonth() + 1);
          break;
        case 'YEARLY':
          nextDeadline.setFullYear(nextDeadline.getFullYear() + 1);
          break;
      }

      // Check if duplicate next recurring obligation exists
      const existingNext = await prisma.obligation.findFirst({
        where: {
          userId: obligation.userId,
          title: obligation.title,
          deadline: nextDeadline,
          status: ObligationStatus.PENDING,
        },
      });

      if (!existingNext) {
        const nextObligation = await prisma.obligation.create({
          data: {
            userId: obligation.userId,
            title: obligation.title,
            description: obligation.description,
            category: obligation.category,
            amount: obligation.amount,
            currency: obligation.currency,
            deadline: nextDeadline,
            priority: obligation.priority,
            recurrence: obligation.recurrence,
            source: obligation.source,
            status: ObligationStatus.PENDING,
          },
        });

        await this.generateDefaultRemindersForObligation(nextObligation);
        logger.info(`[REMINDER] Created next recurring obligation ${nextObligation.id} for ${nextObligation.title}`);
      }
    }
  }

  /**
   * Handle obligation cancellation / archival: cancel pending reminders.
   */
  static async handleObligationCancellation(obligationId: string): Promise<void> {
    await prisma.reminder.updateMany({
      where: { obligationId, status: ReminderStatus.PENDING },
      data: { status: ReminderStatus.CANCELLED },
    });
    logger.info(`[REMINDER] Skipped cancelled obligation ${obligationId}`);
  }
}
