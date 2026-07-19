import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { uploadToCloudinary, deleteFromCloudinary } from '../../middleware/upload.middleware';
import { logAudit } from '../../utils/audit';
import { AuditAction } from '@prisma/client';
import type { UploadFileInput } from './file.validation';

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'application/pdf',
  'text/plain', 'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'video/mp4', 'video/webm', 'video/ogg',
  'audio/mpeg', 'audio/wav', 'audio/ogg',
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Upload a file.
 */
export async function uploadFile(userId: string, input: UploadFileInput, buffer: Buffer) {
  if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
    throw new AppError('File type not allowed', 400, 'INVALID_FILE_TYPE');
  }

  if (input.size > MAX_FILE_SIZE) {
    throw new AppError('File exceeds maximum size of 100MB', 400, 'FILE_TOO_LARGE');
  }

  // Verify meeting exists if meetingId provided
  if (input.meetingId) {
    const meeting = await prisma.meeting.findFirst({
      where: {
        OR: [{ id: input.meetingId }, { meetingId: input.meetingId }],
        deletedAt: null,
      },
    });
    if (!meeting) {
      throw new AppError('Meeting not found', 404, 'MEETING_NOT_FOUND');
    }
  }

  const folder = input.meetingId ? `connectworld/meetings/${input.meetingId}` : 'connectworld/files';

  const { url, publicId } = await uploadToCloudinary(buffer, folder);

  const file = await prisma.file.create({
    data: {
      meetingId: input.meetingId || null,
      uploaderId: userId,
      originalName: input.originalName,
      fileName: `${Date.now()}-${input.originalName}`,
      mimeType: input.mimeType,
      size: input.size,
      url,
      publicId,
      folder,
    },
    include: {
      uploader: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });

  await logAudit({
    userId,
    action: AuditAction.FILE_UPLOAD,
    resource: 'file',
    resourceId: file.id,
    details: { originalName: input.originalName, mimeType: input.mimeType, size: input.size },
  });

  return file;
}

/**
 * Get files for a meeting with pagination.
 */
export async function getMeetingFiles(meetingId: string, page = 1, limit = 20) {
  const meeting = await prisma.meeting.findFirst({
    where: {
      OR: [{ id: meetingId }, { meetingId }],
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!meeting) {
    throw new AppError('Meeting not found', 404, 'MEETING_NOT_FOUND');
  }

  const skip = (page - 1) * limit;

  const [files, total] = await Promise.all([
    prisma.file.findMany({
      where: { meetingId: meeting.id, isDeleted: false },
      include: {
        uploader: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.file.count({ where: { meetingId: meeting.id, isDeleted: false } }),
  ]);

  return {
    data: files,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Get files uploaded by a specific user across all meetings.
 */
export async function getUserFiles(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [files, total] = await Promise.all([
    prisma.file.findMany({
      where: { uploaderId: userId, isDeleted: false },
      include: {
        uploader: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.file.count({ where: { uploaderId: userId, isDeleted: false } }),
  ]);

  return {
    data: files,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Get a single file by ID.
 */
export async function getFileById(fileId: string) {
  const file = await prisma.file.findFirst({
    where: { id: fileId, isDeleted: false },
    include: {
      uploader: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });

  if (!file) {
    throw new AppError('File not found', 404, 'FILE_NOT_FOUND');
  }

  return file;
}

/**
 * Soft-delete a file.
 */
export async function deleteFile(fileId: string, userId: string) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });

  if (!file) {
    throw new AppError('File not found', 404, 'FILE_NOT_FOUND');
  }

  if (file.uploaderId !== userId) {
    throw new AppError('Cannot delete another user\'s file', 403, 'NOT_YOUR_FILE');
  }

  // Delete from Cloudinary if publicId exists
  if (file.publicId) {
    await deleteFromCloudinary(file.publicId).catch(() => {
      // Non-critical — file might not exist on Cloudinary
    });
  }

  await prisma.file.update({
    where: { id: fileId },
    data: { isDeleted: true, deletedAt: new Date() },
  });

  await logAudit({
    userId,
    action: AuditAction.FILE_DELETE,
    resource: 'file',
    resourceId: fileId,
  });
}
