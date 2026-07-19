import crypto, { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { logAudit } from '../../utils/audit';
import { AuditAction, MeetingStatus, ParticipantRole, ParticipantStatus, Prisma } from '@prisma/client';
import type {
  CreateMeetingInput,
  JoinMeetingInput,
  InviteParticipantsInput,
  UpdateMeetingStatusInput,
  UpdateMeetingInput,
} from './meeting.validation';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Generate a short, unique meeting ID (human-readable, e.g. "abc-def-ghi").
 */
function generateMeetingId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const segments = [3, 4, 3];
  return segments
    .map((len) =>
      Array.from({ length: len }, () => chars[crypto.randomInt(chars.length)]).join('')
    )
    .join('-');
}

/**
 * Generate a unique 6-digit invite code.
 */
async function generateInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = crypto.randomInt(100000, 999999).toString();
    const existing = await prisma.meeting.findUnique({ where: { meetingId: code } });
    if (!existing) return code;
  }
  // Fallback: use the full generated ID
  return generateMeetingId();
}

// ─── Meeting CRUD ────────────────────────────────────────────────────────────

/**
 * Create a new meeting (instant or scheduled).
 */
export async function createMeeting(userId: string, input: CreateMeetingInput) {
  const meetingId = input.meetingType === 'instant'
    ? await generateInviteCode()
    : generateMeetingId();

  // Hash password if provided
  let passwordHash: string | null = null;
  if (input.password) {
    passwordHash = await hashPassword(input.password);
  }

  const meeting = await prisma.meeting.create({
    data: {
      title: input.title,
      description: input.description,
      meetingId,
      hostId: userId,
      meetingType: input.meetingType,
      password: passwordHash,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      maxParticipants: input.maxParticipants,
      hasWaitingRoom: input.hasWaitingRoom,
      isRecurring: input.isRecurring,
      recurringRule: input.recurringRule,
      recordingEnabled: input.recordingEnabled,
      status: input.meetingType === 'instant' ? 'LIVE' : 'SCHEDULED',
      startedAt: input.meetingType === 'instant' ? new Date() : null,
    },
    include: {
      host: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
      participants: {
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      },
    },
  });

  // Add the host as a participant with HOST role
  await prisma.meetingParticipant.create({
    data: {
      meetingId: meeting.id,
      userId,
      role: 'HOST',
      status: 'JOINED',
      joinedAt: new Date(),
    },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      userId,
      type: 'meeting_created',
      metadata: { meetingId: meeting.meetingId, title: meeting.title, type: input.meetingType },
    },
  });

  await logAudit({
    userId,
    action: AuditAction.CREATE,
    resource: 'meeting',
    resourceId: meeting.id,
    details: { title: meeting.title, type: input.meetingType },
  });

  // Refetch to include the newly created host participant
  const created = await prisma.meeting.findUnique({
    where: { id: meeting.id },
    include: {
      host: { select: { id: true, displayName: true, avatarUrl: true } },
      participants: {
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      },
    },
  });

  return formatMeetingResponse(created!);
}

/**
 * Get all meetings the user is involved in (as host or participant).
 */
export async function getMeetings(userId: string, status?: string) {
  const where: Prisma.MeetingWhereInput = {
    deletedAt: null,
    ...(status ? { status: status as MeetingStatus } : {}),
    OR: [
      { hostId: userId },
      { participants: { some: { userId } } },
    ],
  };

  const meetings = await prisma.meeting.findMany({
    where,
    include: {
      host: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
      participants: {
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      },
      _count: { select: { participants: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return meetings.map(formatMeetingResponse);
}

/**
 * Get meeting by ID with full details.
 */
export async function getMeetingById(meetingId: string, userId: string) {
  const meeting = await prisma.meeting.findFirst({
    where: {
      OR: [
        { id: meetingId },
        { meetingId: meetingId },
      ],
      deletedAt: null,
    },
    include: {
      host: {
        select: { id: true, displayName: true, avatarUrl: true, onlineStatus: true },
      },
      participants: {
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true, onlineStatus: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
      _count: { select: { participants: true } },
    },
  });

  if (!meeting) {
    throw new AppError('Meeting not found', 404, 'MEETING_NOT_FOUND');
  }

  return formatMeetingResponse(meeting);
}

/**
 * Update meeting details.
 */
export async function updateMeeting(
  meetingId: string,
  userId: string,
  input: UpdateMeetingInput
) {
  const meeting = await prisma.meeting.findFirst({
    where: { OR: [{ id: meetingId }, { meetingId }], deletedAt: null },
  });

  if (!meeting) {
    throw new AppError('Meeting not found', 404, 'MEETING_NOT_FOUND');
  }

  if (meeting.hostId !== userId) {
    throw new AppError('Only the host can update the meeting', 403, 'NOT_HOST');
  }

  const data: Prisma.MeetingUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.maxParticipants !== undefined) data.maxParticipants = input.maxParticipants;
  if (input.hasWaitingRoom !== undefined) data.hasWaitingRoom = input.hasWaitingRoom;
  if (input.isLocked !== undefined) data.isLocked = input.isLocked;
  if (input.recordingEnabled !== undefined) data.recordingEnabled = input.recordingEnabled;

  if (input.password !== undefined) {
    data.password = input.password ? await hashPassword(input.password) : null;
  }

  const updated = await prisma.meeting.update({
    where: { id: meeting.id },
    data,
    include: {
      host: { select: { id: true, displayName: true, avatarUrl: true } },
      participants: {
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      },
      _count: { select: { participants: true } },
    },
  });

  return formatMeetingResponse(updated);
}

// ─── Join / Leave ────────────────────────────────────────────────────────────

/**
 * Join a meeting.
 * Validates password, checks waiting room, enforces participant limit.
 */
export async function joinMeeting(
  meetingId: string,
  userId: string,
  input: JoinMeetingInput
) {
  const meeting = await prisma.meeting.findFirst({
    where: { OR: [{ id: meetingId }, { meetingId }], deletedAt: null },
  });

  if (!meeting) {
    throw new AppError('Meeting not found', 404, 'MEETING_NOT_FOUND');
  }

  if (meeting.status === 'ENDED' || meeting.status === 'CANCELLED') {
    throw new AppError('This meeting has ended', 400, 'MEETING_ENDED');
  }

  if (meeting.isLocked) {
    throw new AppError('This meeting is locked', 403, 'MEETING_LOCKED');
  }

  // Check password if required
  if (meeting.password) {
    if (!input.password) {
      throw new AppError('This meeting requires a password', 401, 'PASSWORD_REQUIRED');
    }
    const isValid = await verifyPassword(input.password, meeting.password);
    if (!isValid) {
      throw new AppError('Incorrect meeting password', 401, 'INVALID_PASSWORD');
    }
  }

  // Check participant limit
  const participantCount = await prisma.meetingParticipant.count({
    where: { meetingId: meeting.id },
  });

  if (participantCount >= meeting.maxParticipants) {
    throw new AppError('Meeting has reached maximum participants', 400, 'MEETING_FULL');
  }

  // Check if already a participant
  const existingParticipant = await prisma.meetingParticipant.findUnique({
    where: { meetingId_userId: { meetingId: meeting.id, userId } },
  });

  if (existingParticipant) {
    if (existingParticipant.status === 'REMOVED') {
      throw new AppError('You have been removed from this meeting', 403, 'REMOVED_FROM_MEETING');
    }
    // Update status to JOINED if they were LEFT or INVITED
    if (existingParticipant.status === 'LEFT' || existingParticipant.status === 'INVITED') {
      await prisma.meetingParticipant.update({
        where: { id: existingParticipant.id },
        data: { status: 'JOINED', joinedAt: new Date() },
      });
    }
    return getMeetingById(meeting.id, userId);
  }

  // Handle waiting room
  const participantStatus = meeting.hasWaitingRoom ? 'INVITED' as ParticipantStatus : 'JOINED' as ParticipantStatus;

  await prisma.meetingParticipant.create({
    data: {
      meetingId: meeting.id,
      userId,
      role: 'PARTICIPANT',
      status: participantStatus,
      joinedAt: participantStatus === 'JOINED' ? new Date() : null,
    },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      userId,
      type: 'meeting_joined',
      metadata: { meetingId: meeting.meetingId, title: meeting.title },
    },
  });

  await logAudit({
    userId,
    action: AuditAction.JOIN_MEETING,
    resource: 'meeting',
    resourceId: meeting.id,
  });

  return getMeetingById(meeting.id, userId);
}

/**
 * Leave a meeting.
 */
export async function leaveMeeting(meetingId: string, userId: string) {
  const meeting = await prisma.meeting.findFirst({
    where: { OR: [{ id: meetingId }, { meetingId }], deletedAt: null },
  });

  if (!meeting) {
    throw new AppError('Meeting not found', 404, 'MEETING_NOT_FOUND');
  }

  const participant = await prisma.meetingParticipant.findUnique({
    where: { meetingId_userId: { meetingId: meeting.id, userId } },
  });

  if (!participant) {
    throw new AppError('You are not a participant in this meeting', 400, 'NOT_PARTICIPANT');
  }

  // If host leaves, end the meeting or assign new host
  if (participant.role === 'HOST') {
    const coHost = await prisma.meetingParticipant.findFirst({
      where: { meetingId: meeting.id, role: 'CO_HOST', status: 'JOINED' },
    });

    if (coHost) {
      // Promote co-host to host
      await prisma.meetingParticipant.update({
        where: { id: coHost.id },
        data: { role: 'HOST' },
      });
    }
  }

  await prisma.meetingParticipant.update({
    where: { id: participant.id },
    data: { status: 'LEFT', leftAt: new Date() },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      userId,
      type: 'meeting_left',
      metadata: { meetingId: meeting.meetingId, title: meeting.title },
    },
  });

  await logAudit({
    userId,
    action: AuditAction.LEAVE_MEETING,
    resource: 'meeting',
    resourceId: meeting.id,
  });
}

// ─── Invite ──────────────────────────────────────────────────────────────────

/**
 * Invite participants to a meeting.
 */
export async function inviteParticipants(
  meetingId: string,
  userId: string,
  input: InviteParticipantsInput
) {
  const meeting = await prisma.meeting.findFirst({
    where: { OR: [{ id: meetingId }, { meetingId }], deletedAt: null },
  });

  if (!meeting) {
    throw new AppError('Meeting not found', 404, 'MEETING_NOT_FOUND');
  }

  if (meeting.hostId !== userId) {
    throw new AppError('Only the host can invite participants', 403, 'NOT_HOST');
  }

  const invitedUsers: Array<{ id: string; displayName?: string | null; email: string }> = [];
  const notFound: string[] = [];

  // Invite by user IDs
  if (input.userIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: input.userIds }, isActive: true, isBanned: false },
      select: { id: true, displayName: true, email: true },
    });

    const foundIds = new Set(users.map((u) => u.id));
    for (const uid of input.userIds) {
      if (!foundIds.has(uid)) {
        notFound.push(uid);
      }
    }

    for (const user of users) {
      const existing = await prisma.meetingParticipant.findUnique({
        where: { meetingId_userId: { meetingId: meeting.id, userId: user.id } },
      });

      if (!existing) {
        await prisma.meetingParticipant.create({
          data: {
            meetingId: meeting.id,
            userId: user.id,
            role: input.role as ParticipantRole,
            status: 'INVITED',
          },
        });
        invitedUsers.push(user);
      }
    }
  }

  // Invite by emails (find existing users by email)
  if (input.emails.length > 0) {
    const users = await prisma.user.findMany({
      where: { email: { in: input.emails.map((e) => e.toLowerCase()) }, isActive: true },
      select: { id: true, displayName: true, email: true },
    });

    for (const user of users) {
      const existing = await prisma.meetingParticipant.findUnique({
        where: { meetingId_userId: { meetingId: meeting.id, userId: user.id } },
      });

      if (!existing) {
        await prisma.meetingParticipant.create({
          data: {
            meetingId: meeting.id,
            userId: user.id,
            role: input.role as ParticipantRole,
            status: 'INVITED',
          },
        });
        invitedUsers.push(user);
      }
    }
  }

  // Create notifications for invited users
  for (const invited of invitedUsers) {
    await prisma.notification.create({
      data: {
        userId: invited.id,
        type: 'MEETING_INVITATION',
        title: `Meeting invitation: ${meeting.title}`,
        message: input.message || `You have been invited to join "${meeting.title}"`,
        data: { meetingId: meeting.meetingId, meetingTitle: meeting.title },
      },
    });
  }

  return {
    invited: invitedUsers.map((u) => ({ id: u.id, displayName: u.displayName, email: u.email })),
    notFound,
    totalInvited: invitedUsers.length,
  };
}

// ─── Status Management ───────────────────────────────────────────────────────

/**
 * Update meeting status (start, end, cancel).
 */
export async function updateMeetingStatus(
  meetingId: string,
  userId: string,
  input: UpdateMeetingStatusInput
) {
  const meeting = await prisma.meeting.findFirst({
    where: { OR: [{ id: meetingId }, { meetingId }], deletedAt: null },
  });

  if (!meeting) {
    throw new AppError('Meeting not found', 404, 'MEETING_NOT_FOUND');
  }

  if (meeting.hostId !== userId) {
    throw new AppError('Only the host can change meeting status', 403, 'NOT_HOST');
  }

  const updateData: Prisma.MeetingUpdateInput = { status: input.status as MeetingStatus };

  if (input.status === 'LIVE' && !meeting.startedAt) {
    updateData.startedAt = new Date();
  }

  if (input.status === 'ENDED') {
    updateData.endedAt = new Date();
  }

  const updated = await prisma.meeting.update({
    where: { id: meeting.id },
    data: updateData,
    include: {
      host: { select: { id: true, displayName: true, avatarUrl: true } },
      participants: {
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      },
      _count: { select: { participants: true } },
    },
  });

  return formatMeetingResponse(updated);
}

// ─── History ─────────────────────────────────────────────────────────────────

/**
 * Get meeting history for the user (ended meetings they hosted or participated in).
 */
export async function getMeetingHistory(userId: string, limit: number = 20) {
  const meetings = await prisma.meeting.findMany({
    where: {
      deletedAt: null,
      status: { in: ['ENDED', 'CANCELLED'] },
      OR: [
        { hostId: userId },
        { participants: { some: { userId } } },
      ],
    },
    include: {
      host: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
      participants: {
        where: { userId },
        select: { role: true, joinedAt: true, leftAt: true },
      },
      _count: { select: { participants: true } },
    },
    orderBy: { endedAt: 'desc' },
    take: limit,
  });

  return meetings.map((m) => ({
    ...formatMeetingResponse(m),
    myRole: m.participants[0]?.role || 'HOST',
    joinedAt: m.participants[0]?.joinedAt,
    leftAt: m.participants[0]?.leftAt,
  }));
}

// ─── Delete ──────────────────────────────────────────────────────────────────

/**
 * Delete (soft-delete) a meeting.
 */
export async function deleteMeeting(meetingId: string, userId: string) {
  const meeting = await prisma.meeting.findFirst({
    where: { OR: [{ id: meetingId }, { meetingId }], deletedAt: null },
  });

  if (!meeting) {
    throw new AppError('Meeting not found', 404, 'MEETING_NOT_FOUND');
  }

  if (meeting.hostId !== userId) {
    throw new AppError('Only the host can delete the meeting', 403, 'NOT_HOST');
  }

  await prisma.meeting.update({
    where: { id: meeting.id },
    data: { deletedAt: new Date(), status: 'CANCELLED' },
  });

  await logAudit({
    userId,
    action: AuditAction.DELETE,
    resource: 'meeting',
    resourceId: meeting.id,
  });
}

// ─── Participant Management ──────────────────────────────────────────────────

/**
 * Remove a participant from a meeting.
 */
export async function removeParticipant(meetingId: string, hostId: string, participantId: string) {
  const meeting = await prisma.meeting.findFirst({
    where: { OR: [{ id: meetingId }, { meetingId }], deletedAt: null },
  });

  if (!meeting) {
    throw new AppError('Meeting not found', 404, 'MEETING_NOT_FOUND');
  }

  if (meeting.hostId !== hostId) {
    throw new AppError('Only the host can remove participants', 403, 'NOT_HOST');
  }

  const participant = await prisma.meetingParticipant.findFirst({
    where: { meetingId: meeting.id, userId: participantId },
  });

  if (!participant) {
    throw new AppError('Participant not found', 404, 'PARTICIPANT_NOT_FOUND');
  }

  if (participant.role === 'HOST') {
    throw new AppError('Cannot remove the host', 400, 'CANNOT_REMOVE_HOST');
  }

  await prisma.meetingParticipant.update({
    where: { id: participant.id },
    data: { status: 'REMOVED', leftAt: new Date() },
  });
}

/**
 * Admit a participant from the waiting room.
 */
export async function admitParticipant(meetingId: string, hostId: string, participantId: string) {
  const meeting = await prisma.meeting.findFirst({
    where: { OR: [{ id: meetingId }, { meetingId }], deletedAt: null },
  });

  if (!meeting) {
    throw new AppError('Meeting not found', 404, 'MEETING_NOT_FOUND');
  }

  if (meeting.hostId !== hostId) {
    throw new AppError('Only the host can admit participants', 403, 'NOT_HOST');
  }

  const participant = await prisma.meetingParticipant.findFirst({
    where: { meetingId: meeting.id, userId: participantId },
  });

  if (!participant) {
    throw new AppError('Participant not found', 404, 'PARTICIPANT_NOT_FOUND');
  }

  await prisma.meetingParticipant.update({
    where: { id: participant.id },
    data: { status: 'JOINED', joinedAt: new Date() },
  });
}

// ─── Password Hashing ────────────────────────────────────────────────────────

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(':');
  const derivedKey = await scryptAsync(password, salt!, 64) as Buffer;
  return key === derivedKey.toString('hex');
}

// ─── Response Formatting ─────────────────────────────────────────────────────

function formatMeetingResponse(meeting: any) {
  return {
    id: meeting.id,
    meetingId: meeting.meetingId,
    title: meeting.title,
    description: meeting.description,
    hostId: meeting.hostId,
    host: meeting.host,
    status: meeting.status,
    meetingType: meeting.meetingType,
    isRecurring: meeting.isRecurring,
    recurringRule: meeting.recurringRule,
    hasWaitingRoom: meeting.hasWaitingRoom,
    isLocked: meeting.isLocked,
    recordingEnabled: meeting.recordingEnabled,
    maxParticipants: meeting.maxParticipants,
    hasPassword: !!meeting.password,
    scheduledAt: meeting.scheduledAt,
    startedAt: meeting.startedAt,
    endedAt: meeting.endedAt,
    participants: meeting.participants,
    participantCount: meeting._count?.participants ?? meeting.participants?.length ?? 0,
    createdAt: meeting.createdAt,
    updatedAt: meeting.updatedAt,
  };
}
