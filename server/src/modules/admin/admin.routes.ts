import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as adminController from './admin.controller';
import { updateRoleSchema, banUserSchema, broadcastSchema } from './admin.validation';
import { UserRole } from '@prisma/client';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN));

// GET /api/admin/dashboard
router.get('/dashboard', adminController.getDashboardStats);

// GET /api/admin/users
router.get('/users', adminController.getAllUsers);

// PATCH /api/admin/users/:userId/role
router.patch('/users/:userId/role', validate(updateRoleSchema), adminController.updateUserRole);

// POST /api/admin/users/:userId/ban
router.post('/users/:userId/ban', validate(banUserSchema), adminController.banUser);

// POST /api/admin/users/:userId/unban
router.post('/users/:userId/unban', adminController.unbanUser);

// GET /api/admin/audit-logs
router.get('/audit-logs', adminController.getAuditLogs);

// POST /api/admin/broadcast
router.post('/broadcast', validate(broadcastSchema), adminController.sendBroadcast);

export default router;
