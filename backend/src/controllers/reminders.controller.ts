import { Request, Response, NextFunction } from 'express';
import { prisma, ObligationsService } from '../services/obligations.service.js';
import { ReminderService } from '../services/reminder.service.js';
import { ReminderStatus } from '@prisma/client';

export class RemindersController {
  /**
   * GET /api/reminders
   */
  static async getReminders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demoUser = await ObligationsService.getOrCreateDemoUser();
      const { obligationId, status } = req.query;

      const where: Record<string, unknown> = { userId: demoUser.id };
      if (obligationId) where.obligationId = obligationId as string;
      if (status) where.status = status as ReminderStatus;

      const reminders = await prisma.reminder.findMany({
        where,
        orderBy: { remindAt: 'asc' },
        include: { obligation: true },
      });

      res.status(200).json({ success: true, data: reminders });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reminders/:id
   */
  static async getReminderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demoUser = await ObligationsService.getOrCreateDemoUser();
      const { id } = req.params;

      const reminder = await prisma.reminder.findFirst({
        where: { id, userId: demoUser.id },
        include: { obligation: true },
      });

      if (!reminder) {
        res.status(404).json({ success: false, message: 'Reminder not found' });
        return;
      }

      res.status(200).json({ success: true, data: reminder });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/reminders
   */
  static async createReminder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demoUser = await ObligationsService.getOrCreateDemoUser();
      const { obligationId, remindAt, daysBefore } = req.body;

      if (!obligationId) {
        res.status(400).json({ success: false, message: 'obligationId is required' });
        return;
      }

      const obligation = await ObligationsService.getObligationById(obligationId, demoUser.id);
      if (!obligation) {
        res.status(404).json({ success: false, message: 'Obligation not found' });
        return;
      }

      let reminderTime: Date;
      if (remindAt) {
        reminderTime = new Date(remindAt);
      } else if (obligation.deadline && daysBefore !== undefined) {
        reminderTime = ReminderService.calculateRemindAt(new Date(obligation.deadline), Number(daysBefore));
      } else {
        reminderTime = new Date();
      }

      const reminder = await prisma.reminder.create({
        data: {
          userId: demoUser.id,
          obligationId,
          remindAt: reminderTime,
          daysBefore: daysBefore !== undefined ? Number(daysBefore) : undefined,
          status: ReminderStatus.PENDING,
        },
      });

      res.status(201).json({ success: true, message: 'Reminder created successfully', data: reminder });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/reminders/:id
   */
  static async updateReminder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demoUser = await ObligationsService.getOrCreateDemoUser();
      const { id } = req.params;
      const { status, remindAt, daysBefore } = req.body;

      const existing = await prisma.reminder.findFirst({
        where: { id, userId: demoUser.id },
      });

      if (!existing) {
        res.status(404).json({ success: false, message: 'Reminder not found' });
        return;
      }

      const dataToUpdate: Record<string, unknown> = {};
      if (status) dataToUpdate.status = status;
      if (remindAt) dataToUpdate.remindAt = new Date(remindAt);
      if (daysBefore !== undefined) dataToUpdate.daysBefore = Number(daysBefore);

      const updated = await prisma.reminder.update({
        where: { id },
        data: dataToUpdate,
      });

      res.status(200).json({ success: true, message: 'Reminder updated successfully', data: updated });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/reminders/:id
   */
  static async deleteReminder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demoUser = await ObligationsService.getOrCreateDemoUser();
      const { id } = req.params;

      const existing = await prisma.reminder.findFirst({
        where: { id, userId: demoUser.id },
      });

      if (!existing) {
        res.status(404).json({ success: false, message: 'Reminder not found' });
        return;
      }

      await prisma.reminder.delete({ where: { id } });

      res.status(200).json({ success: true, message: 'Reminder deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
