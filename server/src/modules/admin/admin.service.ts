import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { logAudit } from '../../utils/audit';
import { UserRole, AuditAction } from '@prisma/client';

/**
 * Get dashboard statistics.
 */
export async function getDashboardStats() {
  const [
    totalUsers,
    activeUsers,
    totalMeetings,
    activeMeetings,
    totalFiles,
    unverifiedUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { onlineStatus: 'online', isActive: true } }),
    prisma.meeting.count({ where: { deletedAt: null } }),
    prisma.meeting.count({ where: { status: 'LIVE' } }),
    prisma.file.count({ where: { isDeleted: false } }),
    prisma.user.count({ where: { isEmailVerified: false, deletedAt: null } }),
  ]);

  const recentMeetings = await prisma.meeting.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      host: { select: { id: true, displayName: true, avatarUrl: true } },
      _count: { select: { participants: true } },
    },
  });

  return {
    totalUsers,
    activeUsers,
    totalMeetings,
    activeMeetings,
    totalFiles,
    unverifiedUsers,
    recentMeetings,
  };
}

/**
 * Get all users with pagination (admin view).
 */
export async function getAllUsers(page = 1, limit = 20, search?: string) {
  const skip = (page - 1) * limit;

  const where: any = { deletedAt: null };
  if (search) {
    where.OR = [
      { email: { contains: search } },
      { displayName: { contains: search } },
      { firstName: { contains: search } },
      { lastName: { contains: search } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        role: { select: { name: true } },
        _count: { select: { meetings: true, files: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users.map((u: any) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      firstName: u.firstName,
      lastName: u.lastName,
      avatarUrl: u.avatarUrl,
      role: u.role?.name || 'USER',
      isActive: u.isActive,
      isBanned: u.isBanned,
      isEmailVerified: u.isEmailVerified,
      onlineStatus: u.onlineStatus,
      lastLoginAt: u.lastLoginAt,
      meetingCount: u._count?.meetings || 0,
      fileCount: u._count?.files || 0,
      createdAt: u.createdAt,
    })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Update a user's role.
 */
export async function updateUserRole(adminId: string, userId: string, newRole: UserRole) {
  if (adminId === userId) {
    throw new AppError('Cannot change your own role', 400, 'SELF_ROLE_CHANGE');
  }

  const role = await prisma.role.findUnique({ where: { name: newRole } });
  if (!role) {
    throw new AppError('Role not found', 404, 'ROLE_NOT_FOUND');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { roleId: role.id },
  });

  await logAudit({
    userId: adminId,
    action: AuditAction.ROLE_CHANGE,
    resource: 'user',
    resourceId: userId,
    details: { newRole },
  });
}

/**
 * Ban or unban a user.
 */
export async function toggleBan(adminId: string, userId: string, ban: boolean, reason?: string) {
  if (adminId === userId) {
    throw new AppError('Cannot ban yourself', 400, 'SELF_BAN');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isBanned: ban,
      bannedAt: ban ? new Date() : null,
      banReason: ban ? (reason || null) : null,
      onlineStatus: ban ? 'offline' : user.onlineStatus,
    },
  });

  // Revoke all sessions if banning
  if (ban) {
    await prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  await logAudit({
    userId: adminId,
    action: ban ? AuditAction.USER_BAN : AuditAction.USER_UNBAN,
    resource: 'user',
    resourceId: userId,
    details: { reason: reason || null },
  });
}

/**
 * Get audit logs with pagination.
 */
export async function getAuditLogs(page = 1, limit = 50) {
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: {
        user: { select: { id: true, displayName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count(),
  ]);

  return {
    data: logs,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Send a broadcast notification to all users (or filtered subset).
 */
export async function sendBroadcast(adminId: string, title: string, message: string) {
  const users = await prisma.user.findMany({
    where: { isActive: true, isBanned: false },
    select: { id: true },
  });

  // Create notifications in bulk
  await prisma.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      type: 'ADMIN_BROADCAST' as any,
      title,
      message,
      data: { broadcast: true },
    })),
  });

  await logAudit({
    userId: adminId,
    action: AuditAction.CREATE,
    resource: 'broadcast',
    details: { title, recipientCount: users.length },
  });

  return { recipientCount: users.length };
}
