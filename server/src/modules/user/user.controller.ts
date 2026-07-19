import { Request, Response, NextFunction } from 'express';
import * as userService from './user.service';
import { AppError } from '../../middleware/error.middleware';

// ─── Profile ─────────────────────────────────────────────────────────────────

/**
 * GET /api/users/profile
 * Get the authenticated user's full profile with settings.
 */
export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await userService.getProfile(req.user!.id);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/users/profile
 * Update the authenticated user's profile fields.
 */
export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await userService.updateProfile(req.user!.id, req.body);
    res.json({ success: true, message: 'Profile updated', data: profile });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/users/avatar
 * Upload a new avatar image (multipart/form-data).
 */
export async function uploadAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new AppError('No image file provided', 400, 'NO_FILE');
    }

    const profile = await userService.uploadAvatar(req.user!.id, req.file.buffer);
    res.json({ success: true, message: 'Avatar updated', data: profile });
  } catch (error) {
    next(error);
  }
}

// ─── Settings ────────────────────────────────────────────────────────────────

/**
 * GET /api/users/settings
 * Get the authenticated user's settings.
 */
export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await userService.getSettings(req.user!.id);
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/users/settings
 * Update the authenticated user's settings.
 */
export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await userService.updateSettings(req.user!.id, req.body);
    res.json({ success: true, message: 'Settings updated', data: settings });
  } catch (error) {
    next(error);
  }
}

// ─── Devices ─────────────────────────────────────────────────────────────────

/**
 * GET /api/users/devices
 * Get all devices for the authenticated user.
 */
export async function getDevices(req: Request, res: Response, next: NextFunction) {
  try {
    const devices = await userService.getDevices(req.user!.id);
    res.json({ success: true, data: devices });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/users/devices/:deviceId/trust
 * Toggle trusted status for a device.
 */
export async function trustDevice(req: Request, res: Response, next: NextFunction) {
  try {
    const { isTrusted } = req.body;
    const device = await userService.trustDevice(req.user!.id, String(req.params.deviceId), isTrusted);
    res.json({ success: true, message: isTrusted ? 'Device trusted' : 'Device untrusted', data: device });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/users/devices/:deviceId
 * Remove a device and revoke its sessions.
 */
export async function removeDevice(req: Request, res: Response, next: NextFunction) {
  try {
    await userService.removeDevice(req.user!.id, String(req.params.deviceId));
    res.json({ success: true, message: 'Device removed' });
  } catch (error) {
    next(error);
  }
}

// ─── Activity ────────────────────────────────────────────────────────────────

/**
 * GET /api/users/activity
 * Get recent activity for the authenticated user.
 */
export async function getActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const activities = await userService.getActivity(req.user!.id, limit);
    res.json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
}
