/**
 * Test setup for ConnectWorld server tests.
 * Provides mock factories and test utilities.
 */

// ─── Mock Factories ──────────────────────────────────────────────────────────

export function createMockUser(overrides: Record<string, any> = {}) {
  return {
    id: overrides.id || 'test-user-id',
    email: overrides.email || 'test@example.com',
    firstName: overrides.firstName || 'Test',
    lastName: overrides.lastName || 'User',
    displayName: overrides.displayName || 'Test User',
    avatarUrl: overrides.avatarUrl || null,
    role: overrides.role || 'USER',
    isEmailVerified: overrides.isEmailVerified ?? false,
    isActive: overrides.isActive ?? true,
    isBanned: overrides.isBanned ?? false,
    onlineStatus: overrides.onlineStatus || 'offline',
    lastSeenAt: overrides.lastSeenAt || null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockMeeting(overrides: Record<string, any> = {}) {
  return {
    id: overrides.id || 'test-meeting-id',
    meetingId: overrides.meetingId || 'abc-123',
    title: overrides.title || 'Test Meeting',
    description: overrides.description || null,
    hostId: overrides.hostId || 'test-user-id',
    status: overrides.status || 'LIVE',
    meetingType: overrides.meetingType || 'instant',
    hasWaitingRoom: overrides.hasWaitingRoom ?? true,
    isLocked: overrides.isLocked ?? false,
    maxParticipants: overrides.maxParticipants ?? 100,
    password: overrides.password ?? null,
    scheduledAt: overrides.scheduledAt || null,
    startedAt: overrides.startedAt || new Date(),
    endedAt: overrides.endedAt || null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

export function createMockRequest(overrides: Record<string, any> = {}) {
  return {
    user: overrides.user || createMockUser(),
    body: overrides.body || {},
    query: overrides.query || {},
    params: overrides.params || {},
    ip: overrides.ip || '127.0.0.1',
    headers: overrides.headers || { 'user-agent': 'test-agent' },
    cookies: overrides.cookies || {},
    ...overrides,
  };
}

export function createMockResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
}

export function createMockNext() {
  return jest.fn();
}
