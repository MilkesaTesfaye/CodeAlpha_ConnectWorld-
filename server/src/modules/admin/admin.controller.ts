import { Request, Response, NextFunction } from 'express';
import * as adminService from './admin.service';
import { UserRole } from '@prisma/client';

/**
 * GET /api/admin/dashboard
 * Get admin dashboard statistics.
 */
export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await adminService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/users
 * Get all users (paginated, searchable).
 */
export async function getAllUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const search = req.query.search as string | undefined;
    const result = await adminService.getAllUsers(page, limit, search);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/admin/users/:userId/role
 * Update a user's role.
 */
export async function updateUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    await adminService.updateUserRole(req.user!.id, String(req.params.userId), req.body.role as UserRole);
    res.json({ success: true, message: 'User role updated' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/users/:userId/ban
 * Ban a user.
 */
export async function banUser(req: Request, res: Response, next: NextFunction) {
  try {
    await adminService.toggleBan(req.user!.id, String(req.params.userId), true, req.body.reason);
    res.json({ success: true, message: 'User banned' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/users/:userId/unban
 * Unban a user.
 */
export async function unbanUser(req: Request, res: Response, next: NextFunction) {
  try {
    await adminService.toggleBan(req.user!.id, String(req.params.userId), false);
    res.json({ success: true, message: 'User unbanned' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/audit-logs
 * Get audit logs (paginated).
 */
export async function getAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const result = await adminService.getAuditLogs(page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/broadcast
 * Send a broadcast notification.
 */
export async function sendBroadcast(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await adminService.sendBroadcast(req.user!.id, req.body.title, req.body.message);
    res.json({ success: true, message: 'Broadcast sent', data: result });
  } catch (error) {
    next(error);
  }
}
