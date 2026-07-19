import { z } from 'zod';

/**
 * Update user profile.
 */
export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional().nullable(),
  locale: z.string().length(2).optional(),
  timezone: z.string().max(50).optional().nullable(),
  avatarUrl: z.string().url().nullable().optional(),
});

/**
 * Update user settings (privacy, notifications, preferences).
 */
export const updateSettingsSchema = z.object({
  language: z.string().length(2, 'Language must be a 2-letter code (e.g., "en")').optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  timezone: z.string().max(50).optional().nullable(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  desktopNotifications: z.boolean().optional(),
  meetingReminders: z.boolean().optional(),
  messagePreview: z.boolean().optional(),
  showOnlineStatus: z.boolean().optional(),
  showLastSeen: z.boolean().optional(),
  autoJoinAudio: z.boolean().optional(),
  autoJoinVideo: z.boolean().optional(),
  blurBackground: z.boolean().optional(),
  virtualBackground: z.string().max(500).optional().nullable(),
});

/**
 * Trust a device.
 */
export const trustDeviceSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
  isTrusted: z.boolean(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type TrustDeviceInput = z.infer<typeof trustDeviceSchema>;
