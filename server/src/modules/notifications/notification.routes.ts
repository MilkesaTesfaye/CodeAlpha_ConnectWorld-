import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import * as notificationController from './notification.controller';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// GET /api/notifications
router.get('/', notificationController.getNotifications);

// GET /api/notifications/unread-count
router.get('/unread-count', notificationController.getUnreadCount);

// PATCH /api/notifications/:id/read
router.patch('/:id/read', notificationController.markAsRead);

// POST /api/notifications/read-all
router.post('/read-all', notificationController.markAllAsRead);

// DELETE /api/notifications/:id
router.delete('/:id', notificationController.deleteNotification);

export default router;
