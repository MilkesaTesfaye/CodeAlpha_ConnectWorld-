import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import * as analyticsController from './analytics.controller';
import { UserRole } from '@prisma/client';

const router = Router();

// All analytics routes require authentication + moderator+ role
router.use(authenticate);
router.use(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR));

// GET /api/analytics/meetings
router.get('/meetings', analyticsController.getMeetingAnalytics);

// GET /api/analytics/users
router.get('/users', analyticsController.getUserActivityAnalytics);

// GET /api/analytics/files
router.get('/files', analyticsController.getFileAnalytics);

export default router;
