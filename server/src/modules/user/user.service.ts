import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { uploadToCloudinary, deleteFromCloudinary } from '../../middleware/upload.middleware';
import { logAudit } from '../../utils/audit';
import type { UpdateProfileInput, UpdateSettingsInput } from './user.validation';
import { AuditAction } from '@prisma/client';

// ─── Profile ─────────────────────────────────────────────────────────────────

/**
 * Get full profile for the authenticated user.
 */
export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: { select: { name: true } },
      settings: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return formatUserResponse(user, user.settings || undefined);
}

/**
 * Update profile fields (firstName, lastName, displayName, bio, locale, timezone).
 */
export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.firstName !== undefined && { firstName: input.firstName }),
      ...(input.lastName !== undefined && { lastName: input.lastName }),
      ...(input.displayName !== undefined && { displayName: input.displayName }),
      ...(input.bio !== undefined && { bio: input.bio }),
      ...(input.locale !== undefined && { locale: input.locale }),
      ...(input.timezone !== undefined && { timezone: input.timezone }),
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
    },
    include: { role: { select: { name: true } }, settings: true },
  });

  await logAudit({
    userId,
    action: 'UPDATE' as AuditAction,
    resource: 'user',
    resourceId: userId,
    details: { updatedFields: Object.keys(input) },
  });

  return formatUserResponse(updated, updated.settings || undefined);
}

/**
 * Upload a new avatar.
 * Deletes the old avatar from Cloudinary if it exists.
 */
export async function uploadAvatar(userId: string, buffer: Buffer) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Delete old avatar from Cloudinary if it has a public ID stored
  if (user.avatarUrl) {
    // Extract publicId from URL if possible (the URL contains the public ID)
    const urlParts = user.avatarUrl.split('/');
    const filename = urlParts[urlParts.length - 1]?.split('.')[0];
    if (filename) {
      await deleteFromCloudinary(`connectworld/avatars/${filename}`).catch(() => {
        // Non-critical — old file might not exist
      });
    }
  }

  const { url } = await uploadToCloudinary(buffer, 'connectworld/avatars', 'image');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: url },
    include: { role: { select: { name: true } }, settings: true },
  });

  await logAudit({
    userId,
    action: 'UPDATE' as AuditAction,
    resource: 'user',
    resourceId: userId,
    details: { action: 'avatar_upload' },
  });

  return formatUserResponse(updated, updated.settings || undefined);
}

// ─── Settings ────────────────────────────────────────────────────────────────

/**
 * Get user settings.
 */
export async function getSettings(userId: string) {
  let settings = await prisma.userSetting.findUnique({ where: { userId } });

  // Create default settings if they don't exist
  if (!settings) {
    settings = await prisma.userSetting.create({ data: { userId } });
  }

  return settings;
}

/**
 * Update user settings (privacy, notifications, preferences).
 */
export async function updateSettings(userId: string, input: UpdateSettingsInput) {
  // Ensure settings record exists
  const existing = await prisma.userSetting.findUnique({ where: { userId } });
  if (!existing) {
    await prisma.userSetting.create({ data: { userId } });
  }

  const data: any = {};
  if (input.language !== undefined) data.language = input.language;
  if (input.theme !== undefined) data.theme = input.theme;
  if (input.timezone !== undefined) data.timezone = input.timezone;
  if (input.emailNotifications !== undefined) data.emailNotifications = input.emailNotifications;
  if (input.pushNotifications !== undefined) data.pushNotifications = input.pushNotifications;
  if (input.desktopNotifications !== undefined) data.desktopNotifications = input.desktopNotifications;
  if (input.meetingReminders !== undefined) data.meetingReminders = input.meetingReminders;
  if (input.messagePreview !== undefined) data.messagePreview = input.messagePreview;
  if (input.showOnlineStatus !== undefined) data.showOnlineStatus = input.showOnlineStatus;
  if (input.showLastSeen !== undefined) data.showLastSeen = input.showLastSeen;
  if (input.autoJoinAudio !== undefined) data.autoJoinAudio = input.autoJoinAudio;
  if (input.autoJoinVideo !== undefined) data.autoJoinVideo = input.autoJoinVideo;
  if (input.blurBackground !== undefined) data.blurBackground = input.blurBackground;
  if (input.virtualBackground !== undefined) data.virtualBackground = input.virtualBackground;

  const updated = await prisma.userSetting.update({
    where: { userId },
    data,
  });

  await logAudit({
    userId,
    action: 'SETTINGS_CHANGE' as AuditAction,
    resource: 'user_settings',
    resourceId: userId,
    details: { updatedFields: Object.keys(input) },
  });

  return updated;
}

// ─── Device Management ───────────────────────────────────────────────────────

/**
 * Get all devices for the authenticated user.
 */
export async function getDevices(userId: string) {
  const devices = await prisma.device.findMany({
    where: { userId },
    orderBy: { lastUsedAt: 'desc' },
  });

  return devices;
}

/**
 * Toggle device trusted status.
 */
export async function trustDevice(userId: string, deviceId: string, isTrusted: boolean) {
  const device = await prisma.device.findFirst({
    where: { id: deviceId, userId },
  });

  if (!device) {
    throw new AppError('Device not found', 404, 'DEVICE_NOT_FOUND');
  }

  return prisma.device.update({
    where: { id: deviceId },
    data: { isTrusted },
  });
}

/**
 * Remove a device (disconnect session).
 */
export async function removeDevice(userId: string, deviceId: string) {
  const device = await prisma.device.findFirst({
    where: { id: deviceId, userId },
  });

  if (!device) {
    throw new AppError('Device not found', 404, 'DEVICE_NOT_FOUND');
  }

  // Revoke all sessions for this device
  await prisma.session.updateMany({
    where: { deviceId, userId },
    data: { isRevoked: true },
  });

  await prisma.device.delete({ where: { id: deviceId } });

  await logAudit({
    userId,
    action: 'UPDATE' as AuditAction,
    resource: 'device',
    resourceId: deviceId,
    details: { action: 'device_removed' },
  });
}

// ─── Activity History ────────────────────────────────────────────────────────

/**
 * Get recent activity for the user.
 */
export async function getActivity(userId: string, limit: number = 20) {
  const activities = await prisma.activity.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return activities;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatUserResponse(user: any, settings?: any) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    role: user.role?.name || 'USER',
    isEmailVerified: user.isEmailVerified,
    onlineStatus: user.onlineStatus,
    lastSeenAt: user.lastSeenAt,
    locale: user.locale,
    theme: user.theme,
    timezone: user.timezone,
    settings: settings || null,
    createdAt: user.createdAt,
  };
}
