import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import type { SendMessageInput } from './chat.validation';

/**
 * Send a chat message.
 */
export async function sendMessage(userId: string, input: SendMessageInput) {
  // Resolve meetingId to database ID if provided
  let resolvedMeetingId: string | null = null;
  if (input.meetingId) {
    const meeting = await prisma.meeting.findFirst({
      where: {
        OR: [{ id: input.meetingId }, { meetingId: input.meetingId }],
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!meeting) {
      throw new AppError('Meeting not found', 404, 'MEETING_NOT_FOUND');
    }
    resolvedMeetingId = meeting.id;
  }

  // If replying, verify parent message exists
  if (input.parentId) {
    const parent = await prisma.chatMessage.findUnique({
      where: { id: input.parentId },
    });
    if (!parent) {
      throw new AppError('Parent message not found', 404, 'PARENT_NOT_FOUND');
    }
  }

  const message = await prisma.chatMessage.create({
    data: {
      meetingId: resolvedMeetingId,
      senderId: userId,
      receiverId: input.receiverId || null,
      content: input.content,
      messageType: input.messageType || 'TEXT',
      parentId: input.parentId || null,
      fileName: input.fileName || null,
      fileUrl: input.fileUrl || null,
      fileSize: input.fileSize || null,
    },
    include: {
      sender: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  });

  return message;
}

/**
 * Get messages for a meeting with pagination.
 */
export async function getMessages(meetingId: string, userId: string, page = 1, limit = 50) {
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

  const [messages, total] = await Promise.all([
    prisma.chatMessage.findMany({
      where: {
        meetingId: meeting.id,
        isDeleted: false,
        parentId: null, // Top-level messages only
      },
      include: {
        sender: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.chatMessage.count({
      where: { meetingId: meeting.id, isDeleted: false, parentId: null },
    }),
  ]);

  return {
    data: messages.reverse(), // Return oldest first
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Edit a chat message.
 */
export async function editMessage(messageId: string, userId: string, content: string) {
  const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });

  if (!message) {
    throw new AppError('Message not found', 404, 'MESSAGE_NOT_FOUND');
  }

  if (message.senderId !== userId) {
    throw new AppError('Cannot edit another user\'s message', 403, 'NOT_YOUR_MESSAGE');
  }

  if (message.isDeleted) {
    throw new AppError('Cannot edit a deleted message', 400, 'MESSAGE_DELETED');
  }

  return prisma.chatMessage.update({
    where: { id: messageId },
    data: { content, isEdited: true },
    include: {
      sender: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });
}

/**
 * Soft-delete a chat message.
 */
export async function deleteMessage(messageId: string, userId: string) {
  const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });

  if (!message) {
    throw new AppError('Message not found', 404, 'MESSAGE_NOT_FOUND');
  }

  if (message.senderId !== userId) {
    throw new AppError('Cannot delete another user\'s message', 403, 'NOT_YOUR_MESSAGE');
  }

  await prisma.chatMessage.update({
    where: { id: messageId },
    data: { isDeleted: true, content: '[deleted]' },
  });
}

/**
 * Toggle pin status for a message.
 */
export async function togglePin(messageId: string, userId: string) {
  const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });

  if (!message) {
    throw new AppError('Message not found', 404, 'MESSAGE_NOT_FOUND');
  }

  // Verify user is host or co-host of the meeting
  const participant = await prisma.meetingParticipant.findFirst({
    where: {
      meetingId: message.meetingId!,
      userId,
      role: { in: ['HOST', 'CO_HOST'] },
    },
  });

  if (!participant) {
    throw new AppError('Only hosts can pin messages', 403, 'NOT_HOST');
  }

  return prisma.chatMessage.update({
    where: { id: messageId },
    data: {
      isPinned: !message.isPinned,
      pinnedAt: message.isPinned ? null : new Date(),
    },
  });
}

/**
 * Get replies in a message thread.
 */
export async function getThread(parentId: string) {
  const parent = await prisma.chatMessage.findUnique({ where: { id: parentId } });

  if (!parent) {
    throw new AppError('Parent message not found', 404, 'PARENT_NOT_FOUND');
  }

  return prisma.chatMessage.findMany({
    where: { parentId, isDeleted: false },
    include: {
      sender: { select: { id: true, displayName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Mark a message as read.
 */
export async function markAsRead(messageId: string, userId: string) {
  const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });

  if (!message) {
    throw new AppError('Message not found', 404, 'MESSAGE_NOT_FOUND');
  }

  await prisma.readReceipt.upsert({
    where: { messageId_userId: { messageId, userId } },
    update: { readAt: new Date() },
    create: { messageId, userId },
  });
}
