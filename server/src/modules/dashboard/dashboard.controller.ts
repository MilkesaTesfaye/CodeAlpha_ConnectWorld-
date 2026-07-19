import { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service';

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for the authenticated user.
 */
export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await dashboardService.getDashboardStats(req.user!.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}
