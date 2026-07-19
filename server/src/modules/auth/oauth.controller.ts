import { Request, Response, NextFunction } from 'express';
import * as oauthService from './oauth.service';
import { AppError } from '../../middleware/error.middleware';
import env from '../../config/env';
import logger from '../../utils/logger';

/**
 * Cookie options for refresh token (same as auth.controller).
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,
  path: '/api/auth',
};

/**
 * Redirect helper to safely build redirect URLs.
 */
function buildRedirectUrl(path: string, params: Record<string, string>): string {
  const url = new URL(path, env.CLIENT_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

/**
 * GET /api/auth/google
 * Redirect user to Google OAuth consent screen with CSRF state.
 */
export async function googleAuth(_req: Request, res: Response, next: NextFunction) {
  try {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new AppError('Google OAuth is not configured', 500, 'OAUTH_NOT_CONFIGURED');
    }

    // Generate CSRF state and store in a cookie
    const state = oauthService.generateOAuthState();
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
      path: '/api/auth/google',
    });

    const authUrl = oauthService.getGoogleAuthUrl(state);
    res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback — exchange code, set HTTP-only cookie, redirect with hash token.
 */
export async function googleCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      logger.error('Google OAuth error:', oauthError);
      return res.redirect(buildRedirectUrl('/login', { error: 'oauth_denied' }));
    }

    if (!code || typeof code !== 'string') {
      return res.redirect(buildRedirectUrl('/login', { error: 'no_code' }));
    }

    // Verify CSRF state
    const storedState = req.cookies?.oauth_state;
    if (!state || !storedState || state !== storedState) {
      logger.warn('OAuth state mismatch — possible CSRF attack');
      return res.redirect(buildRedirectUrl('/login', { error: 'invalid_state' }));
    }

    // Clear the state cookie
    res.clearCookie('oauth_state', { path: '/api/auth/google' });

    const result = await oauthService.handleGoogleCallback(
      code as string,
      req.ip,
      req.headers['user-agent']
    );

    // Set refresh token as HTTP-only cookie (same pattern as auth.controller)
    res.cookie('refreshToken', result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Pass access token via query param; client will immediately clear it from URL
    res.redirect(`${env.CLIENT_URL}/auth/callback?accessToken=${encodeURIComponent(result.accessToken)}`);
  } catch (error) {
    logger.error('Google OAuth callback error:', error);
    res.redirect(buildRedirectUrl('/login', { error: 'oauth_failed' }));
  }
}

/**
 * GET /api/auth/github
 * Redirect user to GitHub OAuth consent screen with CSRF state.
 */
export async function githubAuth(_req: Request, res: Response, next: NextFunction) {
  try {
    if (!env.GITHUB_CLIENT_ID) {
      throw new AppError('GitHub OAuth is not configured', 500, 'OAUTH_NOT_CONFIGURED');
    }

    // Generate CSRF state
    const state = oauthService.generateOAuthState();
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
      path: '/api/auth/github',
    });

    const authUrl = oauthService.getGitHubAuthUrl(state);
    res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/github/callback
 * Handle GitHub OAuth callback.
 */
export async function githubCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      logger.error('GitHub OAuth error:', oauthError);
      return res.redirect(buildRedirectUrl('/login', { error: 'oauth_denied' }));
    }

    if (!code || typeof code !== 'string') {
      return res.redirect(buildRedirectUrl('/login', { error: 'no_code' }));
    }

    // Verify CSRF state
    const storedState = req.cookies?.oauth_state;
    if (!state || !storedState || state !== storedState) {
      logger.warn('OAuth state mismatch — possible CSRF attack');
      return res.redirect(buildRedirectUrl('/login', { error: 'invalid_state' }));
    }

    res.clearCookie('oauth_state', { path: '/api/auth/github' });

    const result = await oauthService.handleGitHubCallback(
      code as string,
      req.ip,
      req.headers['user-agent']
    );

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Pass access token via query param; client will immediately clear it from URL
    res.redirect(`${env.CLIENT_URL}/auth/callback?accessToken=${encodeURIComponent(result.accessToken)}`);
  } catch (error) {
    logger.error('GitHub OAuth callback error:', error);
    res.redirect(buildRedirectUrl('/login', { error: 'oauth_failed' }));
  }
}
