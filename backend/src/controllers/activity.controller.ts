import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/obligations.service.js';
import { ObligationsService } from '../services/obligations.service.js';

export class ActivityController {
  /**
   * GET /api/activity
   */
  static async getActivity(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demoUser = await ObligationsService.getOrCreateDemoUser();
      const events = await prisma.activityEvent.findMany({
        where: { userId: demoUser.id },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      res.status(200).json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }
}
