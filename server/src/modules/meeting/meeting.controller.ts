import { Request, Response, NextFunction } from 'express';
import * as meetingService from './meeting.service';
import { AppError } from '../../middleware/error.middleware';

// ─── Create ──────────────────────────────────────────────────────────────────

/**
 * POST /api/meetings
 * Create a new meeting (instant or scheduled).
 */
export async function createMeeting(req: Request, res: Response, next: NextFunction) {
  try {
    const meeting = await meetingService.createMeeting(req.user!.id, req.body);
    res.status(201).json({ success: true, message: 'Meeting created', data: meeting });
  } catch (error) {
    next(error);
  }
}

// ─── List ────────────────────────────────────────────────────────────────────

/**
 * GET /api/meetings
 * List meetings for the authenticated user (as host or participant).
 */
export async function getMeetings(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string | undefined;
    const meetings = await meetingService.getMeetings(req.user!.id, status);
    res.json({ success: true, data: meetings });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/meetings/history
 * Get meeting history (ended/cancelled meetings).
 */
export async function getMeetingHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const meetings = await meetingService.getMeetingHistory(req.user!.id, limit);
    res.json({ success: true, data: meetings });
  } catch (error) {
    next(error);
  }
}

// ─── Get Single ──────────────────────────────────────────────────────────────

/**
 * GET /api/meetings/:id
 * Get meeting details by ID or meetingId.
 */
export async function getMeetingById(req: Request, res: Response, next: NextFunction) {
  try {
    const meeting = await meetingService.getMeetingById(String(req.params.id), req.user!.id);
    res.json({ success: true, data: meeting });
  } catch (error) {
    next(error);
  }
}

// ─── Update ──────────────────────────────────────────────────────────────────

/**
 * PATCH /api/meetings/:id
 * Update meeting details (title, password, settings, etc.).
 */
export async function updateMeeting(req: Request, res: Response, next: NextFunction) {
  try {
    const meeting = await meetingService.updateMeeting(String(req.params.id), req.user!.id, req.body);
    res.json({ success: true, message: 'Meeting updated', data: meeting });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/meetings/:id/status
 * Update meeting status (start, end, cancel).
 */
export async function updateMeetingStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const meeting = await meetingService.updateMeetingStatus(String(req.params.id), req.user!.id, req.body);
    res.json({ success: true, message: `Meeting ${req.body.status.toLowerCase()}`, data: meeting });
  } catch (error) {
    next(error);
  }
}

// ─── Join / Leave ────────────────────────────────────────────────────────────

/**
 * POST /api/meetings/:id/join
 * Join a meeting (with optional password).
 */
export async function joinMeeting(req: Request, res: Response, next: NextFunction) {
  try {
    const meeting = await meetingService.joinMeeting(String(req.params.id), req.user!.id, req.body);
    res.json({ success: true, message: 'Joined meeting', data: meeting });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/meetings/:id/leave
 * Leave a meeting.
 */
export async function leaveMeeting(req: Request, res: Response, next: NextFunction) {
  try {
    await meetingService.leaveMeeting(String(req.params.id), req.user!.id);
    res.json({ success: true, message: 'Left meeting' });
  } catch (error) {
    next(error);
  }
}

// ─── Invite ──────────────────────────────────────────────────────────────────

/**
 * POST /api/meetings/:id/invite
 * Invite participants to a meeting.
 */
export async function inviteParticipants(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await meetingService.inviteParticipants(String(req.params.id), req.user!.id, req.body);
    res.json({ success: true, message: `${result.totalInvited} participant(s) invited`, data: result });
  } catch (error) {
    next(error);
  }
}

// ─── Participant Management ──────────────────────────────────────────────────

/**
 * DELETE /api/meetings/:id/participants/:participantId
 * Remove a participant from a meeting.
 */
export async function removeParticipant(req: Request, res: Response, next: NextFunction) {
  try {
    await meetingService.removeParticipant(String(req.params.id), req.user!.id, String(req.params.participantId));
    res.json({ success: true, message: 'Participant removed' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/meetings/:id/admit/:participantId
 * Admit a participant from the waiting room.
 */
export async function admitParticipant(req: Request, res: Response, next: NextFunction) {
  try {
    await meetingService.admitParticipant(String(req.params.id), req.user!.id, String(req.params.participantId));
    res.json({ success: true, message: 'Participant admitted' });
  } catch (error) {
    next(error);
  }
}

// ─── Delete ──────────────────────────────────────────────────────────────────

/**
 * DELETE /api/meetings/:id
 * Delete/cancel a meeting.
 */
export async function deleteMeeting(req: Request, res: Response, next: NextFunction) {
  try {
    await meetingService.deleteMeeting(String(req.params.id), req.user!.id);
    res.json({ success: true, message: 'Meeting deleted' });
  } catch (error) {
    next(error);
  }
}
