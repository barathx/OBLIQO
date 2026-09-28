import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller.js';

const router = Router();

// GET /api/activity
router.get('/', ActivityController.getActivity);

export default router;
