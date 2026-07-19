import { Request, Response, NextFunction } from 'express';
import * as chatService from './chat.service';
import { AppError } from '../../middleware/error.middleware';

/**
 * POST /api/chat/messages
 * Send a chat message in a meeting or direct message.
 */
export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const message = await chatService.sendMessage(req.user!.id, req.body);
    res.status(201).json({ success: true, message: 'Message sent', data: message });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/chat/messages/:meetingId
 * Get chat messages for a meeting with pagination.
 */
export async function getMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const result = await chatService.getMessages(String(req.params.meetingId), req.user!.id, page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/chat/messages/:messageId
 * Edit a chat message.
 */
export async function editMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const message = await chatService.editMessage(String(req.params.messageId), req.user!.id, req.body.content);
    res.json({ success: true, message: 'Message updated', data: message });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/chat/messages/:messageId
 * Soft-delete a chat message.
 */
export async function deleteMessage(req: Request, res: Response, next: NextFunction) {
  try {
    await chatService.deleteMessage(String(req.params.messageId), req.user!.id);
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/chat/messages/:messageId/pin
 * Toggle pin status for a message.
 */
export async function togglePin(req: Request, res: Response, next: NextFunction) {
  try {
    const message = await chatService.togglePin(String(req.params.messageId), req.user!.id);
    res.json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/chat/threads/:parentId
 * Get replies in a message thread.
 */
export async function getThread(req: Request, res: Response, next: NextFunction) {
  try {
    const replies = await chatService.getThread(String(req.params.parentId));
    res.json({ success: true, data: replies });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/chat/read/:messageId
 * Mark a message as read.
 */
export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    await chatService.markAsRead(String(req.params.messageId), req.user!.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
