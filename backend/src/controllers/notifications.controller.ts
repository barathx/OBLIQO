import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/obligations.service.js';
import { ObligationsService } from '../services/obligations.service.js';

export class NotificationsController {
  /**
   * GET /api/notifications
   */
  static async getNotifications(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demoUser = await ObligationsService.getOrCreateDemoUser();
      const notifications = await prisma.notification.findMany({
        where: { userId: demoUser.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      res.status(200).json({ success: true, data: notifications });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/unread
   */
  static async getUnreadNotifications(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demoUser = await ObligationsService.getOrCreateDemoUser();
      const unreadNotifications = await prisma.notification.findMany({
        where: { userId: demoUser.id, isRead: false },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ success: true, data: unreadNotifications });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   */
  static async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demoUser = await ObligationsService.getOrCreateDemoUser();
      const { id } = req.params;

      const notification = await prisma.notification.findFirst({
        where: { id, userId: demoUser.id },
      });

      if (!notification) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/read-all
   */
  static async markAllRead(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demoUser = await ObligationsService.getOrCreateDemoUser();

      await prisma.notification.updateMany({
        where: { userId: demoUser.id, isRead: false },
        data: { isRead: true },
      });

      res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }
}
