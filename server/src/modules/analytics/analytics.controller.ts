import { Request, Response, NextFunction } from 'express';
import * as analyticsService from './analytics.service';

/**
 * GET /api/analytics/meetings
 * Get meeting analytics for the authenticated user.
 */
export async function getMeetingAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const days = Math.min(365, Math.max(1, parseInt(req.query.days as string) || 30));
    const data = await analyticsService.getMeetingAnalytics(req.user!.id, days);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/analytics/users
 * Get user activity analytics.
 */
export async function getUserActivityAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const days = Math.min(365, Math.max(1, parseInt(req.query.days as string) || 30));
    const data = await analyticsService.getUserActivityAnalytics(days);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/analytics/files
 * Get file storage analytics.
 */
export async function getFileAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getFileAnalytics();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
