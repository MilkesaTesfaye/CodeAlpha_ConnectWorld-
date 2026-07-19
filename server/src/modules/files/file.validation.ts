import { z } from 'zod';

export const uploadFileSchema = z.object({
  meetingId: z.string().min(1).optional(),
  originalName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
