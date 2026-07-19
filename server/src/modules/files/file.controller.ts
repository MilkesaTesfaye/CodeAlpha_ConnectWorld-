import { Request, Response, NextFunction } from 'express';
import * as fileService from './file.service';
import { AppError } from '../../middleware/error.middleware';

/**
 * POST /api/files/upload
 * Upload a file.
 * Expects multipart/form-data with a 'file' field.
 * Optional fields: meetingId
 */
export async function uploadFile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new AppError('No file provided', 400, 'NO_FILE');
    }

    // Build input from Multer file metadata + optional body fields
    const input = {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      meetingId: req.body.meetingId || undefined,
    };

    const result = await fileService.uploadFile(req.user!.id, input, req.file.buffer);
    res.status(201).json({ success: true, message: 'File uploaded', data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/files/meeting/:meetingId
 * Get files for a meeting.
 */
export async function getMeetingFiles(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const result = await fileService.getMeetingFiles(String(req.params.meetingId), page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/files
 * Get files uploaded by the authenticated user.
 */
export async function getUserFiles(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const result = await fileService.getUserFiles(req.user!.id, page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/files/:fileId
 * Get a single file by ID.
 */
export async function getFileById(req: Request, res: Response, next: NextFunction) {
  try {
    const file = await fileService.getFileById(String(req.params.fileId));
    res.json({ success: true, data: file });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/files/:fileId
 * Delete a file.
 */
export async function deleteFile(req: Request, res: Response, next: NextFunction) {
  try {
    await fileService.deleteFile(String(req.params.fileId), req.user!.id);
    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    next(error);
  }
}
