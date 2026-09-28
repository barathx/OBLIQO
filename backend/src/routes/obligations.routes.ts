import { Router } from 'express';
import { ObligationsController } from '../controllers/obligations.controller.js';
import {
  validate,
  createObligationSchema,
  updateObligationSchema,
  queryObligationsSchema,
} from '../middleware/validation.middleware.js';

const router = Router();

// GET /api/obligations/summary
router.get('/summary', ObligationsController.getSummary);

// GET /api/obligations/attention
router.get('/attention', ObligationsController.getAttentionRequired);

// GET /api/obligations
router.get('/', validate(queryObligationsSchema, 'query'), ObligationsController.getObligations);

// GET /api/obligations/:id
router.get('/:id', ObligationsController.getObligationById);

// POST /api/obligations
router.post('/', validate(createObligationSchema, 'body'), ObligationsController.createObligation);

// PATCH /api/obligations/:id
router.patch('/:id', validate(updateObligationSchema, 'body'), ObligationsController.updateObligation);

// POST /api/obligations/:id/complete
router.post('/:id/complete', ObligationsController.completeObligation);

// POST /api/obligations/:id/reminder
router.post('/:id/reminder', ObligationsController.scheduleReminder);

// POST /api/obligations/:id/archive
router.post('/:id/archive', ObligationsController.archiveObligation);

// DELETE /api/obligations/:id (soft archive)
router.delete('/:id', ObligationsController.deleteObligation);

export default router;
