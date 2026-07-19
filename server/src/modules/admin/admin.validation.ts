import { z } from 'zod';

export const updateRoleSchema = z.object({
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER', 'GUEST']),
});

export const banUserSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const broadcastSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  message: z.string().min(1, 'Message is required').max(2000),
});
