import { Request, Response, NextFunction } from 'express';
import { ObligationsService } from '../services/obligations.service.js';
import { ObligationQueryFilters } from '../types/index.js';

export class ObligationsController {
  /**
   * GET /api/obligations
   */
  static async getObligations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demoUser = await ObligationsService.getOrCreateDemoUser();
      const filters = req.query as unknown as ObligationQueryFilters;

      const result = await ObligationsService.getObligations(demoUser.id, filters);

      res.status(200).json({
        success: true,
        data: {
          obligations: result.obligations,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/obligations/summary
   */
  static async getSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demoUser = await ObligationsService.getOrCreateDemoUser();
      const summary = await ObligationsService.getSummary(demoUser.id);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/obligations/attention
   */
  static async getAttentionRequired(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demoUser = await ObligationsService.getOrCreateDemoUser();
      const obligations = await ObligationsService.getAttentionRequired(demoUser.id);

      res.status(200).json({
        success: true,
        data: obligations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/obligations/:id
   */
  static async getObligationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demoUser = await ObligationsService.getOrCreateDemoUser();
      const { id } = req.params;

      const obligation = await ObligationsService.getObligationById(id, demoUser.id);

      if (!obligation) {
        res.status(404).json({
          success: false,
          message: `Obligation with ID '${id}' not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: obligation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/obligations
   */
  static async createObligation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demoUser = await ObligationsService.getOrCreateDemoUser();
      const result = await ObligationsService.createObligation(req.body, demoUser.id);

      if (result.isDuplicate) {
        res.status(200).json({
          success: true,
          message: 'Duplicate obligation detected',
          duplicate: true,
          data: result.obligation,
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Obligation created successfully',
        data: result.obligation,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Source message not found')) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * PATCH /api/obligations/:id
   */
  static async updateObligation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demoUser = await ObligationsService.getOrCreateDemoUser();
      const { id } = req.params;

      const updated = await ObligationsService.updateObligation(id, demoUser.id, req.body);

      if (!updated) {
        res.status(404).json({
          success: false,
          message: `Obligation with ID '${id}' not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Obligation updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/obligations/:id/complete
   */
  static async completeObligation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demoUser = await ObligationsService.getOrCreateDemoUser();
      const { id } = req.params;

      const completed = await ObligationsService.completeObligation(id, demoUser.id);

      if (!completed) {
        res.status(404).json({
          success: false,
          message: `Obligation with ID '${id}' not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Obligation completed successfully',
        data: completed,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/obligations/:id/archive (Soft Archive)
   */
  static async archiveObligation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demoUser = await ObligationsService.getOrCreateDemoUser();
      const { id } = req.params;

      const archived = await ObligationsService.archiveObligation(id, demoUser.id);

      if (!archived) {
        res.status(404).json({
          success: false,
          message: `Obligation with ID '${id}' not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Obligation archived successfully',
        data: archived,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/obligations/:id -> Soft Archive fallback
   */
  static async deleteObligation(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Soft archive rather than physical delete as required by Section 3
    return ObligationsController.archiveObligation(req, res, next);
  }

  /**
   * POST /api/obligations/:id/reminder
   * Body: { daysBefore: number }
   */
  static async scheduleReminder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demoUser = await ObligationsService.getOrCreateDemoUser();
      const { id } = req.params;
      const { daysBefore = 1 } = req.body as { daysBefore?: number };

      const { prisma } = await import('../services/obligations.service.js');
      const { ActivityType } = await import('@prisma/client');

      const obligation = await ObligationsService.getObligationById(id, demoUser.id);
      if (!obligation) {
        res.status(404).json({ success: false, message: `Obligation with ID '${id}' not found` });
        return;
      }

      // Calculate remindAt: deadline minus daysBefore days
      const deadline = (obligation as { deadline?: Date | null }).deadline;
      const remindAt = deadline
        ? new Date(new Date(deadline).getTime() - daysBefore * 24 * 60 * 60 * 1000)
        : new Date();

      const reminder = await prisma.reminder.create({
        data: {
          userId: demoUser.id,
          obligationId: id,
          remindAt,
          daysBefore,
        },
      });

      await prisma.activityEvent.create({
        data: {
          userId: demoUser.id,
          obligationId: id,
          type: ActivityType.REMINDER_CREATED,
          title: 'Reminder Scheduled',
          description: `Reminder set ${daysBefore} ${daysBefore === 1 ? 'day' : 'days'} before the deadline.`,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Reminder scheduled successfully',
        data: reminder,
      });
    } catch (error) {
      next(error);
    }
  }
}

