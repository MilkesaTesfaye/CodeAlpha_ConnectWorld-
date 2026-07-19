import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import * as dashboardController from './dashboard.controller';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// GET /api/dashboard/stats
router.get('/stats', dashboardController.getDashboardStats);

export default router;
