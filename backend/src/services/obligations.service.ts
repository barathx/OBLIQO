import { PrismaClient, Obligation, Priority, ObligationStatus, ActivityType, NotificationType } from '@prisma/client';
import {
  CreateObligationInput,
  UpdateObligationInput,
  ObligationQueryFilters,
  PaginatedData,
  ObligationSummary,
} from '../types/index.js';

export const prisma = new PrismaClient();

export class ObligationsService {
  /**
   * Database connectivity check for health endpoint
   */
  static async checkDatabaseConnection(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Helper to retrieve or create the default demo user for Phase 2
   */
  static async getOrCreateDemoUser() {
    return await prisma.user.upsert({
      where: { email: 'demo@obliqo.ai' },
      update: {},
      create: {
        email: 'demo@obliqo.ai',
        name: 'Alex Morgan',
      },
    });
  }

  /**
   * Deterministic priority calculation fallback
   */
  static calculatePriority(suppliedPriority?: Priority): Priority {
    if (suppliedPriority && Object.values(Priority).includes(suppliedPriority)) {
      return suppliedPriority;
    }
    return Priority.MEDIUM;
  }

  /**
   * Create obligation with duplicate detection and Prisma transaction
   */
  static async createObligation(input: CreateObligationInput, userId: string) {
    const priority = this.calculatePriority(input.priority);

    // 1. Source message relationship check
    if (input.sourceMessageId) {
      const sourceMsg = await prisma.sourceMessage.findFirst({
        where: { id: input.sourceMessageId, userId },
      });

      if (!sourceMsg) {
        throw new Error('Source message not found or does not belong to user');
      }

      // Check if source message already produced an obligation
      const existingMsgObligation = await prisma.obligation.findUnique({
        where: { sourceMessageId: input.sourceMessageId },
      });

      if (existingMsgObligation) {
        return {
          isDuplicate: true,
          obligation: existingMsgObligation,
        };
      }
    }

    // 2. Duplicate detection check
    const deadlineDate = input.deadline ? new Date(input.deadline) : null;
    const existingDuplicate = await prisma.obligation.findFirst({
      where: {
        userId,
        title: { equals: input.title, mode: 'insensitive' },
        category: input.category,
        status: ObligationStatus.PENDING,
        ...(deadlineDate ? { deadline: deadlineDate } : {}),
        ...(input.amount !== undefined ? { amount: input.amount } : {}),
      },
    });

    if (existingDuplicate) {
      return {
        isDuplicate: true,
        obligation: existingDuplicate,
      };
    }

    // 3. Create obligation + ActivityEvent + Notification in transaction
    const result = await prisma.$transaction(async (tx) => {
      const newObligation = await tx.obligation.create({
        data: {
          userId,
          title: input.title,
          description: input.description,
          category: input.category,
          amount: input.amount,
          currency: input.currency || 'INR',
          deadline: deadlineDate,
          priority,
          recurrence: input.recurrence,
          source: input.source,
          sourceMessageId: input.sourceMessageId,
          status: ObligationStatus.PENDING,
        },
      });

      await tx.activityEvent.create({
        data: {
          userId,
          obligationId: newObligation.id,
          type: ActivityType.OBLIGATION_DETECTED,
          title: 'Obligation Detected',
          description: `Obligation "${newObligation.title}" was registered into Obliqo intelligence pool.`,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          obligationId: newObligation.id,
          type: NotificationType.OBLIGATION_DETECTED,
          title: 'New obligation detected',
          message: `${newObligation.title} was added to your obligations.`,
        },
      });

      return newObligation;
    });

    if (!result.isDuplicate && result.id) {
      const { ReminderService } = await import('./reminder.service.js');
      await ReminderService.generateDefaultRemindersForObligation(result);
    }

    return {
      isDuplicate: false,
      obligation: result,
    };
  }

  /**
   * Get paginated obligations with search, filters, deadline range, sorting
   */
  static async getObligations(
    userId: string,
    filters: ObligationQueryFilters
  ): Promise<PaginatedData<Obligation>> {
    const {
      page,
      limit,
      search,
      status,
      priority,
      category,
      source,
      deadlineFrom,
      deadlineTo,
      due,
      sortBy,
      sortOrder,
    } = filters;

    const where: Record<string, unknown> = { userId };

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Exact enum filters
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (source) where.source = source;

    // Date range filters
    const deadlineFilter: Record<string, unknown> = {};
    if (deadlineFrom) deadlineFilter.gte = new Date(deadlineFrom);
    if (deadlineTo) deadlineFilter.lte = new Date(deadlineTo);

    // Relative due date filter
    if (due) {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      if (due === 'today') {
        deadlineFilter.gte = startOfToday;
        deadlineFilter.lte = endOfToday;
      } else if (due === 'week') {
        const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
        deadlineFilter.gte = startOfToday;
        deadlineFilter.lte = endOfWeek;
      } else if (due === 'month') {
        const endOfMonth = new Date(startOfToday.getTime() + 30 * 24 * 60 * 60 * 1000 - 1);
        deadlineFilter.gte = startOfToday;
        deadlineFilter.lte = endOfMonth;
      } else if (due === 'overdue') {
        deadlineFilter.lt = startOfToday;
        where.status = ObligationStatus.PENDING;
      }
    }

    if (Object.keys(deadlineFilter).length > 0) {
      where.deadline = deadlineFilter;
    }

    // Pagination bounds
    const skip = (page - 1) * limit;

    // Safe whitelisted sorting
    const allowedSortFields = ['deadline', 'amount', 'priority', 'createdAt', 'updatedAt', 'title'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'deadline';
    const safeSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

    const [obligations, total] = await Promise.all([
      prisma.obligation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [safeSortBy]: safeSortOrder },
        include: {
          sourceMessage: true,
        },
      }),
      prisma.obligation.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      obligations,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get complete obligation detail by ID including relations
   */
  static async getObligationById(id: string, userId: string): Promise<Obligation | null> {
    return await prisma.obligation.findFirst({
      where: { id, userId },
      include: {
        sourceMessage: true,
        activityEvents: {
          orderBy: { createdAt: 'desc' },
        },
        reminders: true,
        futureFund: true,
        shieldCommitment: true,
      },
    });
  }

  /**
   * Partial update obligation with activity log
   */
  static async updateObligation(id: string, userId: string, input: UpdateObligationInput) {
    const existing = await prisma.obligation.findFirst({ where: { id, userId } });
    if (!existing) return null;

    const dataToUpdate: Record<string, unknown> = {};
    if (input.title !== undefined) dataToUpdate.title = input.title;
    if (input.description !== undefined) dataToUpdate.description = input.description;
    if (input.category !== undefined) dataToUpdate.category = input.category;
    if (input.amount !== undefined) dataToUpdate.amount = input.amount;
    if (input.currency !== undefined) dataToUpdate.currency = input.currency;
    if (input.deadline !== undefined) dataToUpdate.deadline = input.deadline ? new Date(input.deadline) : null;
    if (input.priority !== undefined) dataToUpdate.priority = input.priority;
    if (input.recurrence !== undefined) dataToUpdate.recurrence = input.recurrence;
    if (input.status !== undefined) dataToUpdate.status = input.status;
    if (input.source !== undefined) dataToUpdate.source = input.source;

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.obligation.update({
        where: { id },
        data: dataToUpdate,
      });

      await tx.activityEvent.create({
        data: {
          userId,
          obligationId: id,
          type: ActivityType.OBLIGATION_UPDATED,
          title: 'Obligation Updated',
          description: `Obligation "${updated.title}" details were updated.`,
        },
      });

      return updated;
    });
  }

  /**
   * Idempotent completion of an obligation
   */
  static async completeObligation(id: string, userId: string) {
    const existing = await prisma.obligation.findFirst({ where: { id, userId } });
    if (!existing) return null;

    // Idempotent: if already completed, return without creating duplicate activity events
    if (existing.status === ObligationStatus.COMPLETED) {
      return existing;
    }

    const completedResult = await prisma.$transaction(async (tx) => {
      const completed = await tx.obligation.update({
        where: { id },
        data: {
          status: ObligationStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      await tx.activityEvent.create({
        data: {
          userId,
          obligationId: id,
          type: ActivityType.OBLIGATION_COMPLETED,
          title: 'Obligation Completed',
          description: `Obligation "${completed.title}" was marked as completed.`,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          obligationId: id,
          type: NotificationType.COMPLETED,
          title: 'Obligation Completed',
          message: `Obligation "${completed.title}" has been completed.`,
        },
      });

      return completed;
    });

    const { ReminderService } = await import('./reminder.service.js');
    await ReminderService.handleObligationCompletion(id);

    return completedResult;
  }

  /**
   * Soft archive obligation (replaces hard delete)
   */
  static async archiveObligation(id: string, userId: string) {
    const existing = await prisma.obligation.findFirst({ where: { id, userId } });
    if (!existing) return null;

    if (existing.status === ObligationStatus.ARCHIVED) {
      return existing;
    }

    const res = await prisma.$transaction(async (tx) => {
      const archived = await tx.obligation.update({
        where: { id },
        data: {
          status: ObligationStatus.ARCHIVED,
        },
      });

      await tx.activityEvent.create({
        data: {
          userId,
          obligationId: id,
          type: ActivityType.OBLIGATION_ARCHIVED,
          title: 'Obligation Archived',
          description: `Obligation "${archived.title}" was archived.`,
        },
      });

      return archived;
    });

    const { ReminderService } = await import('./reminder.service.js');
    await ReminderService.handleObligationCancellation(id);

    return res;
  }

  /**
   * Overview & Dashboard summary service helper
   */
  static async getSummary(userId: string): Promise<ObligationSummary> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

    const [dueToday, dueThisWeek, upcomingObligations] = await Promise.all([
      prisma.obligation.count({
        where: {
          userId,
          status: ObligationStatus.PENDING,
          deadline: { gte: startOfToday, lte: endOfToday },
        },
      }),
      prisma.obligation.count({
        where: {
          userId,
          status: ObligationStatus.PENDING,
          deadline: { gte: startOfToday, lte: endOfWeek },
        },
      }),
      prisma.obligation.findMany({
        where: {
          userId,
          status: ObligationStatus.PENDING,
          deadline: { gte: startOfToday },
        },
        select: { amount: true },
      }),
    ]);

    const upcomingAmount = upcomingObligations.reduce((sum, item) => {
      return sum + (item.amount ? Number(item.amount) : 0);
    }, 0);

    return {
      dueToday,
      dueThisWeek,
      upcoming: upcomingObligations.length,
      upcomingAmount,
    };
  }

  /**
   * Get obligations requiring immediate user attention
   */
  static async getAttentionRequired(userId: string): Promise<Obligation[]> {
    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    return await prisma.obligation.findMany({
      where: {
        userId,
        status: ObligationStatus.PENDING,
        OR: [
          { priority: { in: [Priority.CRITICAL, Priority.HIGH] } },
          { deadline: { lte: endOfToday } },
        ],
      },
      orderBy: { priority: 'desc' },
      include: { sourceMessage: true },
    });
  }
}
