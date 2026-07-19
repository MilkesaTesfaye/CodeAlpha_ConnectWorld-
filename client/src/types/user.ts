export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'USER' | 'GUEST';

export interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  onlineStatus?: string;
  lastSeenAt?: string | null;
  locale?: string;
  theme?: string;
  createdAt: string;
}

export interface UserSettings {
  id: string;
  language: string;
  theme: string;
  timezone?: string | null;
  emailNotifications: boolean;
  pushNotifications: boolean;
  desktopNotifications: boolean;
  meetingReminders: boolean;
  messagePreview: boolean;
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  autoJoinAudio: boolean;
  autoJoinVideo: boolean;
  blurBackground: boolean;
  virtualBackground?: string | null;
}

export interface Device {
  id: string;
  name?: string | null;
  type: string;
  os?: string | null;
  browser?: string | null;
  ipAddress?: string | null;
  isTrusted: boolean;
  lastUsedAt: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    accessToken: string;
  };
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface VerifyEmailInput {
  email: string;
  otp: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  email: string;
  otp: string;
  newPassword: string;
}
