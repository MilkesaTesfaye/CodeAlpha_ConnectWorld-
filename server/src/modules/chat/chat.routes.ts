import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as chatController from './chat.controller';
import { sendMessageSchema, editMessageSchema } from './chat.validation';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

// ─── Messages ────────────────────────────────────────────────────────────────

// POST /api/chat/messages
router.post('/messages', validate(sendMessageSchema), chatController.sendMessage);

// GET /api/chat/messages/:meetingId
router.get('/messages/:meetingId', chatController.getMessages);

// PATCH /api/chat/messages/:messageId
router.patch('/messages/:messageId', validate(editMessageSchema), chatController.editMessage);

// DELETE /api/chat/messages/:messageId
router.delete('/messages/:messageId', chatController.deleteMessage);

// POST /api/chat/messages/:messageId/pin
router.post('/messages/:messageId/pin', chatController.togglePin);

// GET /api/chat/threads/:parentId
router.get('/threads/:parentId', chatController.getThread);

// POST /api/chat/read/:messageId
router.post('/read/:messageId', chatController.markAsRead);

export default router;
