import { randomUUID, randomBytes } from 'crypto';
import prisma from '../../config/database';
import env from '../../config/env';
import { AppError } from '../../middleware/error.middleware';
import { generateTokenPair } from '../../utils/jwt';
import { logAudit } from '../../utils/audit';
import logger from '../../utils/logger';
import { UserRole } from '@prisma/client';

interface OAuthProfile {
  provider: 'google' | 'github';
  providerAccountId: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

interface SessionUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role?: { name: string } | null;
  isEmailVerified?: boolean | null;
}

const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Generate a random state value for CSRF protection.
 */
export function generateOAuthState(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Generate the Google OAuth consent URL with CSRF state.
 */
export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID || '',
    redirect_uri: env.GOOGLE_CALLBACK_URL || '',
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Generate the GitHub OAuth consent URL with CSRF state.
 */
export function getGitHubAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID || '',
    redirect_uri: env.GITHUB_CALLBACK_URL || '',
    scope: 'read:user user:email',
    state,
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange an authorization code for Google tokens and user profile.
 */
export async function handleGoogleCallback(
  code: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ user: SessionUser; accessToken: string; refreshToken: string }> {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
    throw new AppError('Google OAuth is not configured', 500, 'OAUTH_NOT_CONFIGURED');
  }

  // Exchange authorization code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    logger.error('Google token exchange failed:', errorText);
    throw new AppError('Failed to authenticate with Google', 401, 'OAUTH_FAILED');
  }

  const tokens = (await tokenResponse.json()) as { access_token: string };

  // Fetch user profile from Google
  const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!profileResponse.ok) {
    throw new AppError('Failed to fetch Google profile', 401, 'OAUTH_PROFILE_FAILED');
  }

  const profile = (await profileResponse.json()) as {
    id: string;
    email: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
  };

  if (!profile.email) {
    throw new AppError('Google account has no email', 400, 'OAUTH_NO_EMAIL');
  }

  return processOAuthUser(
    {
      provider: 'google',
      providerAccountId: profile.id,
      email: profile.email.toLowerCase(),
      displayName: profile.name,
      firstName: profile.given_name,
      lastName: profile.family_name,
      avatarUrl: profile.picture,
    },
    ipAddress,
    userAgent
  );
}

/**
 * Exchange an authorization code for GitHub tokens and user profile.
 */
export async function handleGitHubCallback(
  code: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ user: SessionUser; accessToken: string; refreshToken: string }> {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.GITHUB_CALLBACK_URL) {
    throw new AppError('GitHub OAuth is not configured', 500, 'OAUTH_NOT_CONFIGURED');
  }

  // Exchange authorization code for access token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: env.GITHUB_CALLBACK_URL,
    }),
  });

  if (!tokenResponse.ok) {
    throw new AppError('Failed to authenticate with GitHub', 401, 'OAUTH_FAILED');
  }

  const tokenData = (await tokenResponse.json()) as { access_token: string; error?: string };

  if (tokenData.error) {
    logger.error('GitHub token exchange error:', tokenData.error);
    throw new AppError('Failed to authenticate with GitHub', 401, 'OAUTH_FAILED');
  }

  // Fetch user profile from GitHub
  const profileResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/json',
    },
  });

  if (!profileResponse.ok) {
    throw new AppError('Failed to fetch GitHub profile', 401, 'OAUTH_PROFILE_FAILED');
  }

  const profile = (await profileResponse.json()) as {
    id: number;
    login: string;
    name?: string;
    email?: string;
    avatar_url?: string;
  };

  // GitHub may not return the primary email; fetch separately if needed
  let email = profile.email;
  if (!email) {
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/json',
      },
    });

    if (emailsResponse.ok) {
      const emails = (await emailsResponse.json()) as Array<{
        email: string;
        primary: boolean;
      }>;
      const primaryEmail = emails.find((e) => e.primary);
      email = primaryEmail?.email || emails[0]?.email;
    }
  }

  if (!email) {
    throw new AppError('GitHub account has no public email', 400, 'OAUTH_NO_EMAIL');
  }

  // Split display name into first/last
  let firstName: string | undefined;
  let lastName: string | undefined;
  if (profile.name) {
    const nameParts = profile.name.split(' ');
    firstName = nameParts[0];
    lastName = nameParts.slice(1).join(' ') || undefined;
  }

  return processOAuthUser(
    {
      provider: 'github',
      providerAccountId: String(profile.id),
      email: email.toLowerCase(),
      displayName: profile.name || profile.login,
      firstName,
      lastName,
      avatarUrl: profile.avatar_url,
    },
    ipAddress,
    userAgent
  );
}

/**
 * Process an OAuth user — find existing or create new account.
 * Links accounts by email or providerAccountId.
 */
async function processOAuthUser(
  profile: OAuthProfile,
  ipAddress?: string,
  userAgent?: string
): Promise<{ user: SessionUser; accessToken: string; refreshToken: string }> {
  // Check if account already exists via provider ID
  const existingAccount = await prisma.account.findFirst({
    where: {
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
    },
    include: {
      user: {
        include: { role: true },
      },
    },
  });

  if (existingAccount?.user) {
    // Existing OAuth account — login
    return createSessionAndTokens(existingAccount.user, ipAddress, userAgent);
  }

  // Check if a user with this email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: profile.email },
    include: { role: true },
  });

  if (existingUser) {
    // Link the OAuth provider to the existing account
    await prisma.account.create({
      data: {
        userId: existingUser.id,
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      },
    });

    // Update auth provider field
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { authProvider: profile.provider },
    });

    // Audit login
    await logAudit({
      userId: existingUser.id,
      action: 'LOGIN',
      resource: 'user',
      resourceId: existingUser.id,
      details: { method: profile.provider },
      ipAddress,
      userAgent,
    });

    return createSessionAndTokens(existingUser, ipAddress, userAgent);
  }

  // Create new user
  const defaultRole = await prisma.role.findUnique({
    where: { name: UserRole.USER },
  });

  const newUser = await prisma.user.create({
    data: {
      email: profile.email,
      firstName: profile.firstName || null,
      lastName: profile.lastName || null,
      displayName: profile.displayName || profile.email.split('@')[0],
      avatarUrl: profile.avatarUrl || null,
      authProvider: profile.provider,
      isEmailVerified: true, // OAuth emails are pre-verified
      roleId: defaultRole?.id || null,
    },
    include: { role: true },
  });

  // Create default user settings
  await prisma.userSetting.create({
    data: { userId: newUser.id },
  });

  // Link OAuth account
  await prisma.account.create({
    data: {
      userId: newUser.id,
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
    },
  });

  // Audit registration
  await logAudit({
    userId: newUser.id,
    action: 'REGISTER',
    resource: 'user',
    resourceId: newUser.id,
    details: { method: profile.provider },
    ipAddress,
    userAgent,
  });

  return createSessionAndTokens(newUser, ipAddress, userAgent);
}

/**
 * Create a session and generate JWT tokens for a user.
 * Only returns the access token (refresh token is set as HTTP-only cookie by the controller).
 */
async function createSessionAndTokens(
  user: SessionUser,
  ipAddress?: string,
  userAgent?: string
): Promise<{ user: SessionUser; accessToken: string; refreshToken: string }> {
  const roleName = user.role?.name || UserRole.USER;
  const refreshTokenValue = randomUUID();

  // Create session
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: refreshTokenValue,
      userAgent,
      ipAddress,
      expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS),
    },
  });

  const tokenPair = generateTokenPair({
    userId: user.id,
    email: user.email,
    role: roleName,
    sessionId: session.id,
  });

  // Update session with JWT refresh token
  await prisma.session.update({
    where: { id: session.id },
    data: { refreshToken: tokenPair.refreshToken },
  });

  // Update online status
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), onlineStatus: 'online' },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isEmailVerified: user.isEmailVerified ?? true,
    },
    accessToken: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken,
  };
}
