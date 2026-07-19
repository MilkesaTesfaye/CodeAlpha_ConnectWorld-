import prisma from '../config/database';
import { getIO } from '../socket';
import type { NotificationType } from '@prisma/client';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  data?: Record<string, unknown>;
}

/**
 * Notification service for creating and managing in-app notifications.
 * Also pushes real-time notifications via Socket.IO when possible.
 */
export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message || null,
      data: input.data as any || null,
    },
  });

  // Emit real-time notification via Socket.IO
  try {
    const io = getIO();
    io.to(`user:${input.userId}`).emit('notification', notification);
  } catch {
    // Socket server may not be initialized yet
  }

  return notification;
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });
}

/**
 * Mark all unread notifications as read for a user.
 */
export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

/**
 * Get notifications for a user with pagination.
 */
export async function getUserNotifications(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return {
    notifications,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get unread notification count for a user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

/**
 * Delete a notification.
 */
export async function deleteNotification(notificationId: string, userId: string) {
  await prisma.notification.deleteMany({
    where: { id: notificationId, userId },
  });
}
