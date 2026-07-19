import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AuditAction } from '@prisma/client';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
  meeting: {
    create: jest.fn<any>(),
    findFirst: jest.fn<any>(),
    findUnique: jest.fn<any>(),
    findMany: jest.fn<any>(),
    update: jest.fn<any>(),
  },
  meetingParticipant: {
    create: jest.fn<any>(),
    findUnique: jest.fn<any>(),
    findFirst: jest.fn<any>(),
    update: jest.fn<any>(),
    count: jest.fn<any>(),
  },
  activity: {
    create: jest.fn<any>(),
  },
  user: {
    findMany: jest.fn<any>(),
  },
  notification: {
    create: jest.fn<any>(),
  },
};

const mockLogAudit = jest.fn<any>();

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: mockPrisma,
}));

jest.mock('../../utils/audit', () => ({
  logAudit: mockLogAudit,
}));

// ─── Import after mocks ──────────────────────────────────────────────────────

const meetingService = require('./meeting.service');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockUserId = 'user-test-123';
const mockMeetingId = 'abc-1234-def';
const mockMeetingDbId = 'meeting-db-id-456';

function createMockMeeting(overrides: Record<string, any> = {}) {
  return {
    id: overrides.id || mockMeetingDbId,
    meetingId: overrides.meetingId || mockMeetingId,
    title: overrides.title || 'Test Meeting',
    description: overrides.description || null,
    hostId: overrides.hostId || mockUserId,
    host: overrides.host || { id: mockUserId, displayName: 'Test User', avatarUrl: null },
    status: overrides.status || 'LIVE',
    meetingType: overrides.meetingType || 'instant',
    isRecurring: overrides.isRecurring ?? false,
    recurringRule: overrides.recurringRule || null,
    hasWaitingRoom: overrides.hasWaitingRoom ?? true,
    isLocked: overrides.isLocked ?? false,
    recordingEnabled: overrides.recordingEnabled ?? false,
    maxParticipants: overrides.maxParticipants || 100,
    password: overrides.password ?? null,
    scheduledAt: overrides.scheduledAt || null,
    startedAt: overrides.startedAt || new Date(),
    endedAt: overrides.endedAt || null,
    participants: overrides.participants || [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    _count: { participants: overrides.participantCount ?? 0 },
  };
}

function createMockParticipant(overrides: Record<string, any> = {}) {
  return {
    id: overrides.id || 'participant-1',
    meetingId: overrides.meetingId || mockMeetingDbId,
    userId: overrides.userId || 'other-user',
    user: {
      id: overrides.userId || 'other-user',
      displayName: overrides.displayName || 'Other User',
      avatarUrl: null,
    },
    role: overrides.role || 'PARTICIPANT',
    status: overrides.status || 'JOINED',
    joinedAt: overrides.joinedAt || new Date(),
    leftAt: overrides.leftAt || null,
    isMuted: false,
    isVideoEnabled: true,
    isScreenSharing: false,
    isHandRaised: false,
    isPinned: false,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Meeting Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Password Hashing ──────────────────────────────────────────────────

  describe('password hashing', () => {
    it('should store salt:hash format for passwords', async () => {
      const meeting = createMockMeeting({ password: 'stored-hash' });

      mockPrisma.meeting.create.mockResolvedValue(meeting);
      mockPrisma.meetingParticipant.create.mockResolvedValue({});
      mockPrisma.activity.create.mockResolvedValue({});
      mockPrisma.meeting.findUnique.mockResolvedValue({
        ...meeting,
        participants: [{ userId: mockUserId, role: 'HOST' }],
      });

      await meetingService.createMeeting(mockUserId, {
        title: 'Test',
        meetingType: 'instant',
        password: 'my-password',
        hasWaitingRoom: true,
        maxParticipants: 100,
        isRecurring: false,
        recordingEnabled: false,
      });

      const callArg = (mockPrisma.meeting.create.mock.calls[0] as any)[0];
      expect(callArg.data.password).toMatch(/^[a-f0-9]{32}:[a-f0-9]{128}$/);
    });

    it('should produce different hashes for same password (random salt)', async () => {
      const meeting1 = createMockMeeting({ password: 'hash-1' });
      const meeting2 = createMockMeeting({ password: 'hash-2' });

      mockPrisma.meeting.create
        .mockResolvedValueOnce(meeting1)
        .mockResolvedValueOnce(meeting2);
      mockPrisma.meetingParticipant.create.mockResolvedValue({});
      mockPrisma.activity.create.mockResolvedValue({});
      mockPrisma.meeting.findUnique
        .mockResolvedValueOnce({
          ...meeting1,
          participants: [{ userId: mockUserId, role: 'HOST' }],
        })
        .mockResolvedValueOnce({
          ...meeting2,
          participants: [{ userId: mockUserId, role: 'HOST' }],
        });

      const input = {
        title: 'Test',
        meetingType: 'instant' as const,
        password: 'same-password',
        hasWaitingRoom: true,
        maxParticipants: 100,
        isRecurring: false,
        recordingEnabled: false,
      };

      await meetingService.createMeeting(mockUserId, input);
      await meetingService.createMeeting(mockUserId, input);

      const hash1 = (mockPrisma.meeting.create.mock.calls[0] as any)[0]?.data?.password;
      const hash2 = (mockPrisma.meeting.create.mock.calls[1] as any)[0]?.data?.password;

      expect(hash1).toBeDefined();
      expect(hash2).toBeDefined();
      expect(hash1).not.toBe(hash2);
      expect(hash1).not.toBe('same-password');
      expect(hash2).not.toBe('same-password');
    });
  });

  // ─── inviteParticipants ───────────────────────────────────────────────

  describe('inviteParticipants', () => {
    const hostUserId = mockUserId;
    const otherUserId1 = 'user-other-1';
    const otherUserId2 = 'user-other-2';
    const nonExistentUserId = 'user-nonexistent';

    function setupMeeting(overrides: Record<string, any> = {}) {
      const meeting = createMockMeeting({ hostId: hostUserId, ...overrides });
      mockPrisma.meeting.findFirst.mockResolvedValue(meeting);
      return meeting;
    }

    it('should throw when meeting is not found', async () => {
      mockPrisma.meeting.findFirst.mockResolvedValue(null);

      await expect(
        meetingService.inviteParticipants('nonexistent', hostUserId, {
          userIds: [],
          emails: [],
          role: 'PARTICIPANT',
        })
      ).rejects.toThrow('Meeting not found');
    });

    it('should throw when non-host tries to invite', async () => {
      setupMeeting();

      await expect(
        meetingService.inviteParticipants(mockMeetingId, 'not-the-host', {
          userIds: [],
          emails: [],
          role: 'PARTICIPANT',
        })
      ).rejects.toThrow('Only the host can invite');
    });

    it('should invite users by email and create participants + notifications', async () => {
      const meeting = setupMeeting();

      mockPrisma.user.findMany.mockResolvedValue([
        { id: otherUserId1, displayName: 'User One', email: 'user1@test.com' },
        { id: otherUserId2, displayName: 'User Two', email: 'user2@test.com' },
      ]);
      mockPrisma.meetingParticipant.findUnique.mockResolvedValue(null);
      mockPrisma.meetingParticipant.create.mockResolvedValue({});
      mockPrisma.notification.create.mockResolvedValue({});

      const result = await meetingService.inviteParticipants(mockMeetingId, hostUserId, {
        userIds: [],
        emails: ['user1@test.com', 'user2@test.com'],
        role: 'PARTICIPANT',
        message: 'Please join our meeting',
      });

      expect(result.totalInvited).toBe(2);
      expect(result.invited).toHaveLength(2);
      expect(result.notFound).toHaveLength(0);
      expect(result.invited[0].email).toBe('user1@test.com');
      expect(result.invited[1].email).toBe('user2@test.com');

      // Should create participant records
      expect(mockPrisma.meetingParticipant.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.meetingParticipant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: otherUserId1,
            role: 'PARTICIPANT',
            status: 'INVITED',
          }),
        })
      );

      // Should create notifications
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: otherUserId1,
            type: 'MEETING_INVITATION',
            message: 'Please join our meeting',
          }),
        })
      );
    });

    it('should invite users by user IDs and report not-found IDs', async () => {
      setupMeeting();

      mockPrisma.user.findMany.mockResolvedValue([
        { id: otherUserId1, displayName: 'User One', email: 'user1@test.com' },
        { id: otherUserId2, displayName: 'User Two', email: 'user2@test.com' },
      ]);
      mockPrisma.meetingParticipant.findUnique.mockResolvedValue(null);
      mockPrisma.meetingParticipant.create.mockResolvedValue({});
      mockPrisma.notification.create.mockResolvedValue({});

      const result = await meetingService.inviteParticipants(mockMeetingId, hostUserId, {
        userIds: [otherUserId1, otherUserId2, nonExistentUserId],
        emails: [],
        role: 'CO_HOST',
        message: null,
      });

      expect(result.totalInvited).toBe(2);
      expect(result.invited).toHaveLength(2);
      expect(result.notFound).toEqual([nonExistentUserId]);

      // Should create participant records with CO_HOST role
      expect(mockPrisma.meetingParticipant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'CO_HOST',
          }),
        })
      );
    });

    it('should skip already-invited users', async () => {
      setupMeeting();

      mockPrisma.user.findMany.mockResolvedValue([
        { id: otherUserId1, displayName: 'User One', email: 'user1@test.com' },
        { id: otherUserId2, displayName: 'User Two', email: 'user2@test.com' },
      ]);

      // First user already has a participant record
      mockPrisma.meetingParticipant.findUnique
        .mockResolvedValueOnce(createMockParticipant({ userId: otherUserId1 })) // already exists
        .mockResolvedValueOnce(null); // second user does not

      mockPrisma.meetingParticipant.create.mockResolvedValue({});
      mockPrisma.notification.create.mockResolvedValue({});

      const result = await meetingService.inviteParticipants(mockMeetingId, hostUserId, {
        userIds: [],
        emails: ['user1@test.com', 'user2@test.com'],
        role: 'PARTICIPANT',
        message: null,
      });

      // Only 1 new participant should be created (the second user)
      expect(result.totalInvited).toBe(1);
      expect(mockPrisma.meetingParticipant.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
    });

    it('should send default message when no custom message provided', async () => {
      const meeting = setupMeeting();
      meeting.title = 'Sprint Planning';

      mockPrisma.user.findMany.mockResolvedValue([
        { id: otherUserId1, displayName: 'User One', email: 'user1@test.com' },
      ]);
      mockPrisma.meetingParticipant.findUnique.mockResolvedValue(null);
      mockPrisma.meetingParticipant.create.mockResolvedValue({});
      mockPrisma.notification.create.mockResolvedValue({});

      await meetingService.inviteParticipants(mockMeetingId, hostUserId, {
        userIds: [],
        emails: ['user1@test.com'],
        role: 'PARTICIPANT',
        message: null,
      });

      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            message: 'You have been invited to join "Sprint Planning"',
          }),
        })
      );
    });

    it('should not invite banned or inactive users', async () => {
      setupMeeting();

      // Only active, non-banned users are returned by the query
      mockPrisma.user.findMany.mockResolvedValue([
        { id: otherUserId1, displayName: 'Active User', email: 'active@test.com' },
      ]);
      mockPrisma.meetingParticipant.findUnique.mockResolvedValue(null);
      mockPrisma.meetingParticipant.create.mockResolvedValue({});
      mockPrisma.notification.create.mockResolvedValue({});

      const result = await meetingService.inviteParticipants(mockMeetingId, hostUserId, {
        userIds: [otherUserId1, 'banned-user-id'],
        emails: [],
        role: 'PARTICIPANT',
        message: null,
      });

      // Only the active user should be invited
      expect(result.totalInvited).toBe(1);
      expect(result.notFound).toContain('banned-user-id');
    });
  });

  // ─── createMeeting ─────────────────────────────────────────────────────

  describe('createMeeting', () => {
    function setupCreateMeeting(meetingOverrides: Record<string, any> = {}) {
      const meeting = createMockMeeting(meetingOverrides);
      mockPrisma.meeting.create.mockResolvedValue(meeting);
      mockPrisma.meetingParticipant.create.mockResolvedValue({});
      mockPrisma.activity.create.mockResolvedValue({});
      mockPrisma.meeting.findUnique.mockResolvedValue({
        ...meeting,
        participants: [{ userId: mockUserId, role: 'HOST' }],
      });
      return meeting;
    }

    it('should create an instant meeting with LIVE status', async () => {
      setupCreateMeeting({ status: 'LIVE', meetingType: 'instant' });

      const result = await meetingService.createMeeting(mockUserId, {
        title: 'Test Meeting',
        meetingType: 'instant',
        hasWaitingRoom: true,
        maxParticipants: 100,
        isRecurring: false,
        recordingEnabled: false,
      });

      expect(result.title).toBe('Test Meeting');
      expect(result.status).toBe('LIVE');
      expect(result.meetingType).toBe('instant');
      expect(result.hostId).toBe(mockUserId);
      expect(mockPrisma.meeting.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ hostId: mockUserId }),
        })
      );
    });

    it('should create a scheduled meeting with SCHEDULED status', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      setupCreateMeeting({
        status: 'SCHEDULED',
        meetingType: 'scheduled',
        scheduledAt: new Date(futureDate),
        startedAt: null,
      });

      const result = await meetingService.createMeeting(mockUserId, {
        title: 'Scheduled Meeting',
        meetingType: 'scheduled',
        scheduledAt: futureDate,
        hasWaitingRoom: true,
        maxParticipants: 50,
        isRecurring: false,
        recordingEnabled: false,
      });

      expect(result.status).toBe('SCHEDULED');
      expect(result.meetingType).toBe('scheduled');
    });

    it('should add the host as a participant with HOST role', async () => {
      setupCreateMeeting({});

      await meetingService.createMeeting(mockUserId, {
        title: 'Test',
        meetingType: 'instant',
        hasWaitingRoom: true,
        maxParticipants: 100,
        isRecurring: false,
        recordingEnabled: false,
      });

      expect(mockPrisma.meetingParticipant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUserId,
            role: 'HOST',
            status: 'JOINED',
          }),
        })
      );
    });

    it('should create audit log', async () => {
      setupCreateMeeting({});

      await meetingService.createMeeting(mockUserId, {
        title: 'Test',
        meetingType: 'instant',
        hasWaitingRoom: true,
        maxParticipants: 100,
        isRecurring: false,
        recordingEnabled: false,
      });

      expect(mockLogAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          action: AuditAction.CREATE,
          resource: 'meeting',
        })
      );
    });
  });

  // ─── joinMeeting ───────────────────────────────────────────────────────

  describe('joinMeeting', () => {
    function setupMeeting(meetingOverrides: Record<string, any> = {}) {
      const meeting = createMockMeeting(meetingOverrides);
      mockPrisma.meeting.findFirst.mockResolvedValue(meeting);
      return meeting;
    }

    it('should allow joining a live meeting', async () => {
      setupMeeting({ hasWaitingRoom: false });
      mockPrisma.meetingParticipant.count.mockResolvedValue(1);
      mockPrisma.meetingParticipant.findUnique.mockResolvedValue(null);
      mockPrisma.meetingParticipant.create.mockResolvedValue({});
      mockPrisma.activity.create.mockResolvedValue({});

      const result = await meetingService.joinMeeting(mockMeetingId, 'new-user', {});

      expect(result).toBeDefined();
      expect(mockPrisma.meetingParticipant.create).toHaveBeenCalled();
    });

    it('should throw when meeting not found', async () => {
      mockPrisma.meeting.findFirst.mockResolvedValue(null);

      await expect(
        meetingService.joinMeeting('nonexistent', 'new-user', {})
      ).rejects.toThrow('Meeting not found');
    });

    it('should reject joining an ended meeting', async () => {
      setupMeeting({ status: 'ENDED' });

      await expect(
        meetingService.joinMeeting(mockMeetingId, 'new-user', {})
      ).rejects.toThrow('This meeting has ended');
    });

    it('should reject joining a cancelled meeting', async () => {
      setupMeeting({ status: 'CANCELLED' });

      await expect(
        meetingService.joinMeeting(mockMeetingId, 'new-user', {})
      ).rejects.toThrow('This meeting has ended');
    });

    it('should reject joining a locked meeting', async () => {
      setupMeeting({ isLocked: true });

      await expect(
        meetingService.joinMeeting(mockMeetingId, 'new-user', {})
      ).rejects.toThrow('This meeting is locked');
    });

    it('should require password for password-protected meetings', async () => {
      setupMeeting({ password: 'hashed-password' });

      await expect(
        meetingService.joinMeeting(mockMeetingId, 'new-user', {})
      ).rejects.toThrow('This meeting requires a password');
    });

    it('should enforce participant limit', async () => {
      setupMeeting({ maxParticipants: 2 });
      mockPrisma.meetingParticipant.count.mockResolvedValue(2);

      await expect(
        meetingService.joinMeeting(mockMeetingId, 'new-user', {})
      ).rejects.toThrow('reached maximum participants');
    });

    it('should reject removed participants', async () => {
      setupMeeting({ hasWaitingRoom: false });
      mockPrisma.meetingParticipant.count.mockResolvedValue(1);
      mockPrisma.meetingParticipant.findUnique.mockResolvedValue(
        createMockParticipant({ userId: 'removed-user', status: 'REMOVED' })
      );

      await expect(
        meetingService.joinMeeting(mockMeetingId, 'removed-user', {})
      ).rejects.toThrow('removed from this meeting');
    });

    it('should place new participants in waiting room when enabled', async () => {
      setupMeeting({ hasWaitingRoom: true });
      mockPrisma.meetingParticipant.count.mockResolvedValue(1);
      mockPrisma.meetingParticipant.findUnique.mockResolvedValue(null);
      mockPrisma.meetingParticipant.create.mockResolvedValue({});
      mockPrisma.activity.create.mockResolvedValue({});

      await meetingService.joinMeeting(mockMeetingId, 'new-user', {});

      expect(mockPrisma.meetingParticipant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'INVITED', joinedAt: null }),
        })
      );
    });

    it('should directly join when waiting room is disabled', async () => {
      setupMeeting({ hasWaitingRoom: false });
      mockPrisma.meetingParticipant.count.mockResolvedValue(1);
      mockPrisma.meetingParticipant.findUnique.mockResolvedValue(null);
      mockPrisma.meetingParticipant.create.mockResolvedValue({});
      mockPrisma.activity.create.mockResolvedValue({});

      await meetingService.joinMeeting(mockMeetingId, 'new-user', {});

      expect(mockPrisma.meetingParticipant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'JOINED', joinedAt: expect.any(Date) }),
        })
      );
    });

    it('should log audit on join', async () => {
      setupMeeting({ hasWaitingRoom: false });
      mockPrisma.meetingParticipant.count.mockResolvedValue(1);
      mockPrisma.meetingParticipant.findUnique.mockResolvedValue(null);
      mockPrisma.meetingParticipant.create.mockResolvedValue({});
      mockPrisma.activity.create.mockResolvedValue({});

      await meetingService.joinMeeting(mockMeetingId, 'new-user', {});

      expect(mockLogAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.JOIN_MEETING })
      );
    });
  });

  // ─── leaveMeeting ──────────────────────────────────────────────────────

  describe('leaveMeeting', () => {
    function setupMeeting() {
      const meeting = createMockMeeting({});
      mockPrisma.meeting.findFirst.mockResolvedValue(meeting);
      return meeting;
    }

    it('should allow a participant to leave', async () => {
      setupMeeting();
      mockPrisma.meetingParticipant.findUnique.mockResolvedValue(
        createMockParticipant({ userId: 'other-user', role: 'PARTICIPANT', status: 'JOINED' })
      );
      mockPrisma.meetingParticipant.update.mockResolvedValue({});
      mockPrisma.activity.create.mockResolvedValue({});

      await meetingService.leaveMeeting(mockMeetingId, 'other-user');

      expect(mockPrisma.meetingParticipant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'LEFT' }),
        })
      );
    });

    it('should throw when meeting is not found', async () => {
      mockPrisma.meeting.findFirst.mockResolvedValue(null);

      await expect(
        meetingService.leaveMeeting('nonexistent', mockUserId)
      ).rejects.toThrow('Meeting not found');
    });

    it('should throw when user is not a participant', async () => {
      setupMeeting();
      mockPrisma.meetingParticipant.findUnique.mockResolvedValue(null);

      await expect(
        meetingService.leaveMeeting(mockMeetingId, 'non-participant')
      ).rejects.toThrow('You are not a participant');
    });

    it('should promote co-host when host leaves', async () => {
      setupMeeting();
      const hostParticipant = createMockParticipant({
        userId: mockUserId,
        role: 'HOST',
        status: 'JOINED',
      });
      const coHostParticipant = createMockParticipant({
        id: 'co-host-id',
        userId: 'co-host-user',
        role: 'CO_HOST',
        status: 'JOINED',
      });

      mockPrisma.meetingParticipant.findUnique.mockResolvedValue(hostParticipant);
      mockPrisma.meetingParticipant.findFirst.mockResolvedValue(coHostParticipant);
      mockPrisma.meetingParticipant.update.mockResolvedValue({});
      mockPrisma.activity.create.mockResolvedValue({});

      await meetingService.leaveMeeting(mockMeetingId, mockUserId);

      expect(mockPrisma.meetingParticipant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'co-host-id' },
          data: { role: 'HOST' },
        })
      );
    });

    it('should log audit on leave', async () => {
      setupMeeting();
      mockPrisma.meetingParticipant.findUnique.mockResolvedValue(
        createMockParticipant({ userId: 'leaving-user', role: 'PARTICIPANT', status: 'JOINED' })
      );
      mockPrisma.meetingParticipant.update.mockResolvedValue({});
      mockPrisma.activity.create.mockResolvedValue({});

      await meetingService.leaveMeeting(mockMeetingId, 'leaving-user');

      expect(mockLogAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.LEAVE_MEETING })
      );
    });
  });
});
