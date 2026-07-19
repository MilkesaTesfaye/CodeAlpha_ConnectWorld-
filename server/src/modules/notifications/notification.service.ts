import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { getIO } from '../../socket';

interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  message?: string;
  data?: Record<string, unknown>;
}

/**
 * Create a notification and emit via Socket.IO.
 */
export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type as any,
      title: input.title,
      message: input.message || null,
      data: input.data as any || null,
    },
  });

  // Real-time push
  try {
    const io = getIO();
    io.to(`user:${input.userId}`).emit('notification', notification);
  } catch {
    // Socket may not be initialized
  }

  return notification;
}

/**
 * Get notifications for a user with pagination.
 */
export async function getNotifications(userId: string, page = 1, limit = 20) {
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
    data: notifications,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });
}

/**
 * Mark all notifications as read.
 */
export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

/**
 * Get unread notification count.
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
