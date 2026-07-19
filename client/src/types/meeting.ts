export type MeetingStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
export type ParticipantRole = 'HOST' | 'CO_HOST' | 'PRESENTER' | 'PARTICIPANT';
export type ParticipantStatus = 'INVITED' | 'JOINED' | 'LEFT' | 'REMOVED' | 'REJECTED';
export type MeetingType = 'instant' | 'scheduled' | 'recurring';

export interface Meeting {
  id: string;
  meetingId: string;
  title: string;
  description?: string | null;
  hostId: string;
  host: {
    id: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  };
  status: MeetingStatus;
  meetingType: string;
  isRecurring: boolean;
  recurringRule?: string | null;
  scheduledAt?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  maxParticipants: number;
  hasWaitingRoom: boolean;
  isLocked: boolean;
  hasPassword: boolean;
  recordingEnabled: boolean;
  participants?: MeetingParticipant[];
  participantCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingParticipant {
  id: string;
  meetingId: string;
  userId: string;
  user: {
    id: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    onlineStatus?: string;
  };
  role: ParticipantRole;
  status: ParticipantStatus;
  joinedAt?: string | null;
  leftAt?: string | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isPinned: boolean;
}

export interface ChatMessage {
  id: string;
  meetingId?: string | null;
  senderId: string;
  sender: {
    id: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  };
  content: string;
  messageType: string;
  parentId?: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  fileUrl?: string | null;
  createdAt: string;
}

export interface WhiteboardObject {
  id: string;
  meetingId: string;
  type: string;
  data: Record<string, unknown>;
  layer: number;
  createdAt: string;
}

export interface MeetingRecording {
  id: string;
  meetingId: string;
  url: string;
  duration: number;
  size: number;
  format: string;
  status: string;
  startedAt: string;
  endedAt?: string | null;
}

// ─── Input Types ─────────────────────────────────────────────────────────────

export interface CreateMeetingInput {
  title: string;
  description?: string | null;
  meetingType?: MeetingType;
  password?: string | null;
  scheduledAt?: string | null;
  maxParticipants?: number;
  hasWaitingRoom?: boolean;
  isRecurring?: boolean;
  recurringRule?: string | null;
  recordingEnabled?: boolean;
}

export interface JoinMeetingInput {
  password?: string | null;
}

export interface InviteParticipantsInput {
  userIds?: string[];
  emails?: string[];
  role?: 'PARTICIPANT' | 'CO_HOST' | 'PRESENTER';
  message?: string | null;
}

export interface UpdateMeetingStatusInput {
  status: 'LIVE' | 'ENDED' | 'CANCELLED';
}

export interface UpdateMeetingInput {
  title?: string;
  description?: string | null;
  password?: string | null;
  maxParticipants?: number;
  hasWaitingRoom?: boolean;
  isLocked?: boolean;
  recordingEnabled?: boolean;
}

// ─── Response Types ──────────────────────────────────────────────────────────

export interface MeetingHistoryItem extends Meeting {
  myRole: ParticipantRole;
  joinedAt?: string | null;
  leftAt?: string | null;
}

export interface InviteResult {
  invited: Array<{ id: string; displayName?: string | null; email: string }>;
  notFound: string[];
  totalInvited: number;
}
