import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';

interface CreateObjectInput {
  meetingId: string;
  type: string;
  data: Record<string, unknown>;
  layer?: number;
  createdBy: string;
}

/**
 * Create a whiteboard object.
 */
export async function createObject(input: CreateObjectInput) {
  const meeting = await prisma.meeting.findFirst({
    where: {
      OR: [{ id: input.meetingId }, { meetingId: input.meetingId }],
      deletedAt: null,
    },
  });

  if (!meeting) {
    throw new AppError('Meeting not found', 404, 'MEETING_NOT_FOUND');
  }

  const object = await prisma.whiteboardObject.create({
    data: {
      meetingId: meeting.id,
      type: input.type,
      data: input.data as any,
      layer: input.layer ?? 0,
      createdBy: input.createdBy,
    },
  });

  return object;
}

/**
 * Get all whiteboard objects for a meeting, ordered by layer.
 */
export async function getMeetingObjects(meetingId: string) {
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

  return prisma.whiteboardObject.findMany({
    where: { meetingId: meeting.id, isVisible: true },
    orderBy: [{ layer: 'asc' }, { createdAt: 'asc' }],
  });
}

/**
 * Update a whiteboard object's data.
 */
export async function updateObject(objectId: string, data: Record<string, unknown>, userId: string) {
  const object = await prisma.whiteboardObject.findUnique({ where: { id: objectId } });

  if (!object) {
    throw new AppError('Object not found', 404, 'OBJECT_NOT_FOUND');
  }

  if (object.createdBy !== userId) {
    throw new AppError('Cannot modify another user\'s object', 403, 'NOT_YOUR_OBJECT');
  }

  return prisma.whiteboardObject.update({
    where: { id: objectId },
    data: { data: data as any },
  });
}

/**
 * Delete a whiteboard object.
 */
export async function deleteObject(objectId: string, userId: string) {
  const object = await prisma.whiteboardObject.findUnique({ where: { id: objectId } });

  if (!object) {
    throw new AppError('Object not found', 404, 'OBJECT_NOT_FOUND');
  }

  if (object.createdBy !== userId) {
    throw new AppError('Cannot delete another user\'s object', 403, 'NOT_YOUR_OBJECT');
  }

  await prisma.whiteboardObject.update({
    where: { id: objectId },
    data: { isVisible: false },
  });
}

/**
 * Clear all objects from a whiteboard (meeting host only).
 */
export async function clearWhiteboard(meetingId: string, userId: string) {
  const meeting = await prisma.meeting.findFirst({
    where: {
      OR: [{ id: meetingId }, { meetingId }],
      deletedAt: null,
    },
    select: { id: true, hostId: true },
  });

  if (!meeting) {
    throw new AppError('Meeting not found', 404, 'MEETING_NOT_FOUND');
  }

  if (meeting.hostId !== userId) {
    throw new AppError('Only the host can clear the whiteboard', 403, 'NOT_HOST');
  }

  await prisma.whiteboardObject.updateMany({
    where: { meetingId: meeting.id },
    data: { isVisible: false },
  });
}
