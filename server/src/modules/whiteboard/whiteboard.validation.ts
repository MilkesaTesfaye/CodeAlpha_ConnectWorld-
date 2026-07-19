import { z } from 'zod';

export const createObjectSchema = z.object({
  meetingId: z.string().min(1),
  type: z.string().min(1).max(50),
  data: z.object({}).passthrough(),
  layer: z.number().int().min(0).optional(),
});

export const updateObjectSchema = z.object({
  data: z.object({}).passthrough(),
});
