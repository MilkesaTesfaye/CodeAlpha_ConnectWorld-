import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as whiteboardController from './whiteboard.controller';
import { createObjectSchema, updateObjectSchema } from './whiteboard.validation';

const router = Router();

// All whiteboard routes require authentication
router.use(authenticate);

// POST /api/whiteboard/objects
router.post('/objects', validate(createObjectSchema), whiteboardController.createObject);

// GET /api/whiteboard/:meetingId/objects
router.get('/:meetingId/objects', whiteboardController.getMeetingObjects);

// PATCH /api/whiteboard/objects/:objectId
router.patch('/objects/:objectId', validate(updateObjectSchema), whiteboardController.updateObject);

// DELETE /api/whiteboard/objects/:objectId
router.delete('/objects/:objectId', whiteboardController.deleteObject);

// POST /api/whiteboard/:meetingId/clear
router.post('/:meetingId/clear', whiteboardController.clearWhiteboard);

export default router;
