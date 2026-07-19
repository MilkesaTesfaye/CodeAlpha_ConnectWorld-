import { Router } from 'express';
import * as authController from './auth.controller';
import * as oauthController from './oauth.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from './auth.validation';

const router = Router();

// ─── Public Routes ───────────────────────────────────────────────────────────

// GET /api/auth/credentials — Dynamically list available accounts from DB
router.get('/credentials', authController.getCredentials);

// POST /api/auth/register
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/refresh
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// POST /api/auth/verify-email
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);

// POST /api/auth/resend-verification
router.post('/resend-verification', validate(resendVerificationSchema), authController.resendVerification);

// POST /api/auth/forgot-password
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// ─── OAuth Routes ────────────────────────────────────────────────────────────

// GET /api/auth/google — Initiate Google OAuth flow
router.get('/google', oauthController.googleAuth);

// GET /api/auth/google/callback — Google OAuth callback
router.get('/google/callback', oauthController.googleCallback);

// GET /api/auth/github — Initiate GitHub OAuth flow
router.get('/github', oauthController.githubAuth);

// GET /api/auth/github/callback — GitHub OAuth callback
router.get('/github/callback', oauthController.githubCallback);

// ─── Protected Routes ───────────────────────────────────────────────────────

// GET /api/auth/me
router.get('/me', authenticate, authController.getMe);

export default router;
