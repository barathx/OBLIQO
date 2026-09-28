import { Router } from 'express';
import { AIController } from '../controllers/ai.controller.js';
import {
  validate,
  extractObligationTextSchema,
  createObligationFromTextSchema,
} from '../middleware/validation.middleware.js';

const router = Router();

// POST /api/ai/extract-obligation
router.post(
  '/extract-obligation',
  validate(extractObligationTextSchema, 'body'),
  AIController.extractObligation
);

// POST /api/ai/create-obligation
router.post(
  '/create-obligation',
  validate(createObligationFromTextSchema, 'body'),
  AIController.createObligationFromText
);

export default router;
