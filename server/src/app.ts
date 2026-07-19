import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import env from './config/env';
import { initSentry, sentryErrorHandler } from './utils/sentry';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import meetingRoutes from './modules/meeting/meeting.routes';
import chatRoutes from './modules/chat/chat.routes';
import fileRoutes from './modules/files/file.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import adminRoutes from './modules/admin/admin.routes';
import whiteboardRoutes from './modules/whiteboard/whiteboard.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';

const app: Application = express();

// ─── Sentry Error Monitoring ─────────────────────────────────────────────────
// Must be initialized before any other middleware
// @sentry/node v9 uses expressIntegration() — request handling is automatic
initSentry();

// Trust proxy — required when behind nginx (for rate limiting, IP detection)
app.set('trust proxy', 1);

// ─── Security Middleware ──────────────────────────────────────────────────────

// Helmet with strict CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
        connectSrc: ["'self'", 'ws:', 'wss:', 'https://res.cloudinary.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        mediaSrc: ["'self'", 'blob:'],
        frameSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS — allow dynamic origins for dev & production
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  ...(env.CORS_ORIGINS ? env.CORS_ORIGINS.split(',') : []),
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, mobile apps, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.some((o) => origin.includes(o) || o.includes(origin))) {
        return callback(null, true);
      }

      // In production, be more permissive for Vercel preview URLs
      if (env.NODE_ENV === 'production') {
        // Allow all Vercel preview URLs (*.vercel.app)
        if (origin.endsWith('.vercel.app')) {
          return callback(null, true);
        }
        // Allow custom domain
        if (origin.includes(env.DOMAIN || 'connectworld')) {
          return callback(null, true);
        }
      }

      callback(null, true); // Allow all in dev
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// ─── Request Parsing ─────────────────────────────────────────────────────────

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Logging ─────────────────────────────────────────────────────────────────

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ─── Rate Limiting ───────────────────────────────────────────────────────────

const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);

// ─── Health Check ────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'ConnectWorld API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/whiteboard', whiteboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ─── Error Handling ──────────────────────────────────────────────────────────

// Sentry error handler must come FIRST — captures Express errors with
// full request context (user, breadcrumbs, etc.) then passes to our handler
app.use(sentryErrorHandler());

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
