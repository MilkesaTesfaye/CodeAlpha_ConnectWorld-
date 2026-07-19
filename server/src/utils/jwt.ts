import jwt from 'jsonwebtoken';
import env from '../config/env';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
}

/**
 * Generate an access token (short-lived).
 * Used for API authentication.
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Generate a refresh token (long-lived).
 * Used to obtain new access tokens without re-authentication.
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Verify an access token.
 * Returns the decoded payload or throws.
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

/**
 * Verify a refresh token.
 * Returns the decoded payload or throws.
 */
export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}

/**
 * Generate both access and refresh tokens.
 */
export function generateTokenPair(payload: TokenPayload) {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}
