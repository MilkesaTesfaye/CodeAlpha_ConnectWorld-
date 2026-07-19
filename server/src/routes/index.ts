/**
 * Centralized route aggregator.
 * Imports all module routes and exports a single router for /api.
 */
import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/user/user.routes';
import meetingRoutes from '../modules/meeting/meeting.routes';
import chatRoutes from '../modules/chat/chat.routes';
import fileRoutes from '../modules/files/file.routes';
import notificationRoutes from '../modules/notifications/notification.routes';
import adminRoutes from '../modules/admin/admin.routes';
import whiteboardRoutes from '../modules/whiteboard/whiteboard.routes';
import analyticsRoutes from '../modules/analytics/analytics.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/meetings', meetingRoutes);
router.use('/chat', chatRoutes);
router.use('/files', fileRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/whiteboard', whiteboardRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
