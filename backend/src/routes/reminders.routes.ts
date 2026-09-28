import { Router } from 'express';
import { RemindersController } from '../controllers/reminders.controller.js';

const router = Router();

// GET /api/reminders
router.get('/', RemindersController.getReminders);

// GET /api/reminders/:id
router.get('/:id', RemindersController.getReminderById);

// POST /api/reminders
router.post('/', RemindersController.createReminder);

// PATCH /api/reminders/:id
router.patch('/:id', RemindersController.updateReminder);

// DELETE /api/reminders/:id
router.delete('/:id', RemindersController.deleteReminder);

export default router;
