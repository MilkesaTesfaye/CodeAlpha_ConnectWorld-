import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { uploadAvatar } from '../../middleware/upload.middleware';
import * as userController from './user.controller';
import {
  updateProfileSchema,
  updateSettingsSchema,
  trustDeviceSchema,
} from './user.validation';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// ─── Profile ─────────────────────────────────────────────────────────────────

// GET /api/users/profile
router.get('/profile', userController.getProfile);

// PUT /api/users/profile
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);

// POST /api/users/avatar (multipart/form-data)
router.post('/avatar', uploadAvatar, userController.uploadAvatar);

// ─── Settings ────────────────────────────────────────────────────────────────

// GET /api/users/settings
router.get('/settings', userController.getSettings);

// PUT /api/users/settings
router.put('/settings', validate(updateSettingsSchema), userController.updateSettings);

// ─── Devices ─────────────────────────────────────────────────────────────────

// GET /api/users/devices
router.get('/devices', userController.getDevices);

// PATCH /api/users/devices/:deviceId/trust
router.patch('/devices/:deviceId/trust', validate(trustDeviceSchema), userController.trustDevice);

// DELETE /api/users/devices/:deviceId
router.delete('/devices/:deviceId', userController.removeDevice);

// ─── Activity ────────────────────────────────────────────────────────────────

// GET /api/users/activity
router.get('/activity', userController.getActivity);

export default router;
