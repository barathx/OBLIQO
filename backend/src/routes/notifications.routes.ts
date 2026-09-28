import { Router } from 'express';
import { NotificationsController } from '../controllers/notifications.controller.js';

const router = Router();

// GET /api/notifications
router.get('/', NotificationsController.getNotifications);

// GET /api/notifications/unread
router.get('/unread', NotificationsController.getUnreadNotifications);

// PATCH /api/notifications/read-all
router.patch('/read-all', NotificationsController.markAllRead);

// PATCH /api/notifications/:id/read
router.patch('/:id/read', NotificationsController.markRead);

export default router;
