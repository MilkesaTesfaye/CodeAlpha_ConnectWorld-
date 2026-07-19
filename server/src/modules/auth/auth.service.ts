import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { generateTokenPair, verifyRefreshToken } from '../../utils/jwt';
import { generateOTP, storeOTP, verifyOTP } from '../../utils/otp';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../../utils/email';
import { logAudit } from '../../utils/audit';
import { SEED_CREDENTIALS } from '../../config/seed-credentials';
import type { RegisterInput, LoginInput, ResetPasswordInput } from './auth.validation';
import { UserRole } from '@prisma/client';

const SALT_ROUNDS = 12;

/**
 * Register a new user.
 * Creates user, sends verification email, returns tokens.
 */
export async function register(input: RegisterInput, ipAddress?: string, userAgent?: string) {
  // Check for existing user
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (existingUser) {
    throw new AppError('An account with this email already exists', 409, 'EMAIL_EXISTS');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  // Get default USER role
  const defaultRole = await prisma.role.findUnique({
    where: { name: UserRole.USER },
  });

  // Create user
  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      firstName: input.firstName || null,
      lastName: input.lastName || null,
      displayName: input.displayName || input.firstName || input.email.split('@')[0],
      roleId: defaultRole?.id || null,
      authProvider: 'local',
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      displayName: true,
      roleId: true,
    },
  });

  // Create default user settings
  await prisma.userSetting.create({
    data: { userId: user.id },
  });

  // Generate OTP and send verification email
  const otp = generateOTP();
  await storeOTP(user.email, 'email_verification', otp);
  await sendVerificationEmail(user.email, otp, user.displayName || undefined);

  // Generate session and tokens
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: randomUUID(),
      userAgent,
      ipAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const tokenPair = generateTokenPair({
    userId: user.id,
    email: user.email,
    role: UserRole.USER,
    sessionId: session.id,
  });

  // Update the session with the actual refresh token
  await prisma.session.update({
    where: { id: session.id },
    data: { refreshToken: tokenPair.refreshToken },
  });

  // Audit log
  await logAudit({
    userId: user.id,
    action: 'REGISTER',
    resource: 'user',
    resourceId: user.id,
    ipAddress,
    userAgent,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
    },
    ...tokenPair,
  };
}

/**
 * Get all available login credentials dynamically from the database.
 * For known seed accounts, includes the plaintext password for easy login.
 */
export async function getCredentials() {
  const users = await prisma.user.findMany({
    where: { deletedAt: null, authProvider: 'local' },
    include: { role: { select: { name: true } } },
    orderBy: [{ role: { name: 'asc' } }, { email: 'asc' }],
  });

  return users.map((u) => ({
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    firstName: u.firstName,
    lastName: u.lastName,
    avatarUrl: u.avatarUrl,
    role: u.role?.name || 'USER',
    password: SEED_CREDENTIALS[u.email.toLowerCase()] || null,
    isEmailVerified: u.isEmailVerified,
    isActive: u.isActive,
    isBanned: u.isBanned,
    createdAt: u.createdAt,
  }));
}

/**
 * Login with email and password.
 */
export async function login(input: LoginInput, ipAddress?: string, userAgent?: string) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    include: { role: true },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Check if banned
  if (user.isBanned) {
    throw new AppError('Account has been suspended', 403, 'ACCOUNT_SUSPENDED');
  }

  // Check if inactive
  if (!user.isActive) {
    throw new AppError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
  }

  // Verify password
  if (!user.passwordHash) {
    throw new AppError('This account uses OAuth. Please sign in with Google or GitHub.', 400, 'OAUTH_ACCOUNT');
  }

  const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValidPassword) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Create session
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: randomUUID(),
      userAgent,
      ipAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const roleName = user.role?.name || UserRole.USER;

  const tokenPair = generateTokenPair({
    userId: user.id,
    email: user.email,
    role: roleName,
    sessionId: session.id,
  });

  await prisma.session.update({
    where: { id: session.id },
    data: { refreshToken: tokenPair.refreshToken },
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), onlineStatus: 'online' },
  });

  // Audit log
  await logAudit({
    userId: user.id,
    action: 'LOGIN',
    resource: 'user',
    resourceId: user.id,
    details: { method: 'password' },
    ipAddress,
    userAgent,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: roleName,
      isEmailVerified: user.isEmailVerified,
    },
    ...tokenPair,
  };
}

/**
 * Refresh access token using refresh token.
 */
export async function refreshAccessToken(refreshToken: string) {
  // First try JWT verification
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  // Verify session exists and is not revoked
  const session = await prisma.session.findFirst({
    where: {
      refreshToken,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
    include: { user: { include: { role: true } } },
  });

  if (!session || !session.user) {
    throw new AppError('Session expired or revoked', 401, 'SESSION_EXPIRED');
  }

  if (session.user.isBanned || !session.user.isActive) {
    throw new AppError('Account is disabled', 403, 'ACCOUNT_DISABLED');
  }

  // Generate new tokens
  const roleName = session.user.role?.name || UserRole.USER;
  const newTokenPair = generateTokenPair({
    userId: session.user.id,
    email: session.user.email,
    role: roleName,
    sessionId: session.id,
  });

  // Rotate refresh token in the DB (prevents replay attacks)
  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshToken: newTokenPair.refreshToken,
      lastUsedAt: new Date(),
    },
  });

  return {
    ...newTokenPair,
    user: {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      displayName: session.user.displayName,
      avatarUrl: session.user.avatarUrl,
      role: roleName,
      isEmailVerified: session.user.isEmailVerified,
    },
  };
}

/**
 * Logout — revoke session.
 */
export async function logout(refreshToken: string): Promise<void> {
  await prisma.session.updateMany({
    where: { refreshToken },
    data: { isRevoked: true },
  });
}

/**
 * Verify email with OTP.
 */
export async function verifyEmail(email: string, otp: string) {
  const isValid = await verifyOTP(email, 'email_verification', otp);
  if (!isValid) {
    throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (user.isEmailVerified) {
    throw new AppError('Email is already verified', 400, 'ALREADY_VERIFIED');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true },
  });

  // Send welcome email
  await sendWelcomeEmail(user.email, user.displayName || user.firstName || 'User');

  // Audit log
  await logAudit({
    userId: user.id,
    action: 'VERIFY_EMAIL',
    resource: 'user',
    resourceId: user.id,
  });

  return { message: 'Email verified successfully' };
}

/**
 * Resend verification OTP.
 */
export async function resendVerificationOtp(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (user.isEmailVerified) {
    throw new AppError('Email is already verified', 400, 'ALREADY_VERIFIED');
  }

  const otp = generateOTP();
  await storeOTP(user.email, 'email_verification', otp);
  await sendVerificationEmail(user.email, otp, user.displayName || undefined);

  return { message: 'Verification email sent' };
}

/**
 * Forgot password — send reset OTP.
 */
export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    // Don't reveal whether the email exists (security best practice)
    return { message: 'If an account exists with this email, a reset code has been sent' };
  }

  if (user.authProvider !== 'local') {
    return { message: 'If an account exists with this email, a reset code has been sent' };
  }

  const otp = generateOTP();
  await storeOTP(user.email, 'password_reset', otp);
  await sendPasswordResetEmail(user.email, otp, user.displayName || undefined);

  return { message: 'If an account exists with this email, a reset code has been sent' };
}

/**
 * Reset password with OTP.
 */
export async function resetPassword(input: ResetPasswordInput) {
  const isValid = await verifyOTP(input.email, 'password_reset', input.otp);
  if (!isValid) {
    throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
  }

  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Revoke all sessions for security
  await prisma.session.updateMany({
    where: { userId: user.id, isRevoked: false },
    data: { isRevoked: true },
  });

  // Audit log
  await logAudit({
    userId: user.id,
    action: 'RESET_PASSWORD',
    resource: 'user',
    resourceId: user.id,
  });

  return { message: 'Password reset successfully' };
}
