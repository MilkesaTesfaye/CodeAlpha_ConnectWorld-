import { Request, Response, NextFunction } from 'express';
import * as whiteboardService from './whiteboard.service';

/**
 * POST /api/whiteboard/objects
 * Create a whiteboard object.
 */
export async function createObject(req: Request, res: Response, next: NextFunction) {
  try {
    const object = await whiteboardService.createObject({
      meetingId: req.body.meetingId,
      type: req.body.type,
      data: req.body.data,
      layer: req.body.layer,
      createdBy: req.user!.id,
    });
    res.status(201).json({ success: true, data: object });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/whiteboard/:meetingId/objects
 * Get all whiteboard objects for a meeting.
 */
export async function getMeetingObjects(req: Request, res: Response, next: NextFunction) {
  try {
    const objects = await whiteboardService.getMeetingObjects(String(req.params.meetingId));
    res.json({ success: true, data: objects });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/whiteboard/objects/:objectId
 * Update a whiteboard object.
 */
export async function updateObject(req: Request, res: Response, next: NextFunction) {
  try {
    const object = await whiteboardService.updateObject(String(req.params.objectId), req.body.data, req.user!.id);
    res.json({ success: true, data: object });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/whiteboard/objects/:objectId
 * Delete a whiteboard object.
 */
export async function deleteObject(req: Request, res: Response, next: NextFunction) {
  try {
    await whiteboardService.deleteObject(String(req.params.objectId), req.user!.id);
    res.json({ success: true, message: 'Object deleted' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/whiteboard/:meetingId/clear
 * Clear all whiteboard objects (host only).
 */
export async function clearWhiteboard(req: Request, res: Response, next: NextFunction) {
  try {
    await whiteboardService.clearWhiteboard(String(req.params.meetingId), req.user!.id);
    res.json({ success: true, message: 'Whiteboard cleared' });
  } catch (error) {
    next(error);
  }
}
