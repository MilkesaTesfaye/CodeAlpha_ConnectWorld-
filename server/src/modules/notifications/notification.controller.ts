import { Request, Response, NextFunction } from 'express';
import * as notificationService from './notification.service';

/**
 * GET /api/notifications
 * Get notifications for the authenticated user.
 */
export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const result = await notificationService.getNotifications(req.user!.id, page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read.
 */
export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const notification = await notificationService.markAsRead(String(req.params.id), req.user!.id);
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read.
 */
export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    await notificationService.markAllAsRead(req.user!.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/notifications/unread-count
 * Get unread notification count.
 */
export async function getUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const count = await notificationService.getUnreadCount(req.user!.id);
    res.json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/notifications/:id
 * Delete a notification.
 */
export async function deleteNotification(req: Request, res: Response, next: NextFunction) {
  try {
    await notificationService.deleteNotification(String(req.params.id), req.user!.id);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
}
