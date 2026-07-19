import { z } from 'zod';

export const sendMessageSchema = z.object({
  meetingId: z.string().min(1, 'Meeting ID is required').optional(),
  receiverId: z.string().min(1).optional(),
  content: z.string().min(1, 'Message cannot be empty').max(5000),
  messageType: z.enum(['TEXT', 'IMAGE', 'FILE', 'VOICE', 'SYSTEM']).default('TEXT'),
  parentId: z.string().min(1).optional(),
  fileName: z.string().max(255).optional(),
  fileUrl: z.string().url().optional(),
  fileSize: z.number().int().positive().optional(),
});

export const editMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
