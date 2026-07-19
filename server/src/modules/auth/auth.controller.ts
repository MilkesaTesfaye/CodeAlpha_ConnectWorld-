import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { AppError } from '../../middleware/error.middleware';
import env from '../../config/env';
import prisma from '../../config/database';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,
  path: '/api/auth',
};

/**
 * GET /api/auth/credentials
 * Get all available login credentials dynamically from the database.
 */
export async function getCredentials(_req: Request, res: Response, next: NextFunction) {
  try {
    const credentials = await authService.getCredentials();
    res.json({ success: true, data: credentials });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/register
 * Register a new user.
 */
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.register(
      req.body,
      req.ip,
      req.headers['user-agent']
    );

    res.cookie('refreshToken', result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'Account created. Please verify your email.',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Authenticate with email and password.
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(
      req.body,
      req.ip,
      req.headers['user-agent']
    );

    res.cookie('refreshToken', result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/refresh
 * Refresh the access token.
 */
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new AppError('Refresh token required', 401, 'REFRESH_REQUIRED');
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.cookie('refreshToken', result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout
 * Revoke the refresh token.
 */
export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/verify-email
 * Verify email with OTP.
 */
export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.verifyEmail(req.body.email, req.body.otp);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/resend-verification
 * Resend email verification OTP.
 */
export async function resendVerification(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.resendVerificationOtp(req.body.email);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/forgot-password
 * Request password reset OTP.
 */
export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.forgotPassword(req.body.email);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/reset-password
 * Reset password with OTP.
 */
export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.resetPassword(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Get currently authenticated user profile.
 */
export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        role: { select: { name: true } },
        settings: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        role: user.role?.name || 'USER',
        isEmailVerified: user.isEmailVerified,
        onlineStatus: user.onlineStatus,
        lastSeenAt: user.lastSeenAt,
        locale: user.locale,
        theme: user.theme,
        settings: user.settings,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}
