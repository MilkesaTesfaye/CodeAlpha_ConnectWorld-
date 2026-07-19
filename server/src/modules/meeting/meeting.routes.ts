import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as meetingController from './meeting.controller';
import {
  createMeetingSchema,
  joinMeetingSchema,
  inviteParticipantsSchema,
  updateMeetingStatusSchema,
  updateMeetingSchema,
} from './meeting.validation';
import { UserRole } from '@prisma/client';

const router = Router();

// All meeting routes require authentication
router.use(authenticate);

// ─── Join / Leave (no role restriction — GUEST can join meetings they're invited to) ─

// POST /api/meetings/:id/join
router.post('/:id/join', validate(joinMeetingSchema), meetingController.joinMeeting);

// POST /api/meetings/:id/leave
router.post('/:id/leave', meetingController.leaveMeeting);

// ─── Read-only (no role restriction — any authenticated user can view meeting details) ─

// GET /api/meetings
router.get('/', meetingController.getMeetings);

// GET /api/meetings/history
router.get('/history', meetingController.getMeetingHistory);

// GET /api/meetings/:id
router.get('/:id', meetingController.getMeetingById);

// ─── Routes below require non-GUEST role ──────────────────────────────────────
router.use(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR, UserRole.USER));

// POST /api/meetings
router.post('/', validate(createMeetingSchema), meetingController.createMeeting);

// PATCH /api/meetings/:id
router.patch('/:id', validate(updateMeetingSchema), meetingController.updateMeeting);

// DELETE /api/meetings/:id
router.delete('/:id', meetingController.deleteMeeting);

// PATCH /api/meetings/:id/status
router.patch('/:id/status', validate(updateMeetingStatusSchema), meetingController.updateMeetingStatus);

// POST /api/meetings/:id/invite
router.post('/:id/invite', validate(inviteParticipantsSchema), meetingController.inviteParticipants);

// DELETE /api/meetings/:id/participants/:participantId
router.delete('/:id/participants/:participantId', meetingController.removeParticipant);

// POST /api/meetings/:id/admit/:participantId
router.post('/:id/admit/:participantId', meetingController.admitParticipant);

export default router;
