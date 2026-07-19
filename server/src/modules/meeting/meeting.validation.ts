import { z } from 'zod';

/**
 * Create a new meeting (instant or scheduled).
 */
export const createMeetingSchema = z.object({
  title: z
    .string()
    .min(1, 'Meeting title is required')
    .max(200, 'Title must be at most 200 characters'),
  description: z.string().max(1000).optional().nullable(),
  meetingType: z.enum(['instant', 'scheduled', 'recurring']).default('instant'),
  password: z
    .string()
    .min(4, 'Password must be at least 4 characters')
    .max(64)
    .optional()
    .nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
  maxParticipants: z
    .number()
    .int()
    .min(1, 'Must allow at least 1 participant')
    .max(1000, 'Maximum 1000 participants')
    .default(100),
  hasWaitingRoom: z.boolean().default(true),
  isRecurring: z.boolean().default(false),
  recurringRule: z.string().max(500).optional().nullable(),
  recordingEnabled: z.boolean().default(false),
});

/**
 * Join a meeting (with optional password).
 */
export const joinMeetingSchema = z.object({
  password: z.string().optional().nullable(),
});

/**
 * Invite participants to a meeting by user IDs or emails.
 */
export const inviteParticipantsSchema = z.object({
  userIds: z.array(z.string().min(1)).optional().default([]),
  emails: z.array(z.string().email('Invalid email address')).optional().default([]),
  role: z.enum(['PARTICIPANT', 'CO_HOST', 'PRESENTER']).default('PARTICIPANT'),
  message: z.string().max(500).optional().nullable(),
});

/**
 * Update meeting status (start, end, cancel).
 */
export const updateMeetingStatusSchema = z.object({
  status: z.enum(['LIVE', 'ENDED', 'CANCELLED']),
});

/**
 * Update meeting details.
 */
export const updateMeetingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  password: z.string().min(4).max(64).optional().nullable(),
  maxParticipants: z.number().int().min(1).max(1000).optional(),
  hasWaitingRoom: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  recordingEnabled: z.boolean().optional(),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type JoinMeetingInput = z.infer<typeof joinMeetingSchema>;
export type InviteParticipantsInput = z.infer<typeof inviteParticipantsSchema>;
export type UpdateMeetingStatusInput = z.infer<typeof updateMeetingStatusSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
