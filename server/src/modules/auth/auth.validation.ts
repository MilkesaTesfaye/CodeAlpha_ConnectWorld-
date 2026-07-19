import { z } from 'zod';
import {
  PASSWORD_REGEX,
  PASSWORD_REGEX_ERROR,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from '../../utils/password';

/**
 * Register a new user.
 */
export const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be at most 255 characters'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
    .regex(PASSWORD_REGEX, PASSWORD_REGEX_ERROR),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be at most 100 characters')
    .optional(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be at most 100 characters')
    .optional(),
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be at most 100 characters')
    .optional(),
});

/**
 * Login with email and password.
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Verify email with OTP.
 */
export const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});

/**
 * Resend verification email OTP.
 */
export const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * Request password reset (send OTP to email).
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * Reset password with OTP.
 */
export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
  newPassword: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
    .regex(PASSWORD_REGEX, PASSWORD_REGEX_ERROR),
});

/**
 * Refresh access token.
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Change password (authenticated).
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
    .regex(PASSWORD_REGEX, PASSWORD_REGEX_ERROR),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
