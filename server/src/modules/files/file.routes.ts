import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as fileController from './file.controller';
import { uploadFileSchema } from './file.validation';
import { UserRole } from '@prisma/client';

const router = Router();

// Generic file upload middleware (100MB limit, any MIME type)
const uploadFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
}).single('file');

// All file routes require authentication + non-GUEST role
router.use(authenticate);
router.use(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR, UserRole.USER));

// POST /api/files/upload
router.post('/upload', uploadFile, fileController.uploadFile);

// GET /api/files — user's own files across all meetings (must be before /:fileId)
router.get('/', fileController.getUserFiles);

// GET /api/files/meeting/:meetingId
router.get('/meeting/:meetingId', fileController.getMeetingFiles);

// GET /api/files/:fileId
router.get('/:fileId', fileController.getFileById);

// DELETE /api/files/:fileId
router.delete('/:fileId', fileController.deleteFile);

export default router;
