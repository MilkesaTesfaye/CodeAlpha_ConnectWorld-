/**
 * Sentry error monitoring initialization.
 *
 * If SENTRY_DSN is not configured, all Sentry calls gracefully degrade.
 *
 * In @sentry/node v9:
 *   - Request handling is AUTOMATIC via expressIntegration() — no need for
 *     a separate requestHandler middleware.
 *   - Error capture uses Sentry.expressErrorHandler() as the final Express
 *     error middleware.
 *
 * For manual capture in background jobs / non-Express code:
 *   getSentry()?.captureException(err);
 */

import env from '../config/env';

// Lazy-init flag — Sentry is only configured once when initSentry() is called
let initialized = false;

// Singleton reference to the @sentry/node module (or null if unavailable)
let sentryModule: ReturnType<typeof getSentryModule> = null;

function getSentryModule() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@sentry/node') as typeof import('@sentry/node');
  } catch {
    return null as unknown as typeof import('@sentry/node') | null;
  }
}

/**
 * Initialize Sentry for the Express server.
 * Must be called at the TOP of app.ts, before any other middleware.
 */
export function initSentry(): void {
  if (initialized) return;
  initialized = true;

  if (!env.SENTRY_DSN) {
    console.warn('⚠️  SENTRY_DSN not configured — Sentry error monitoring is disabled');
    return;
  }

  try {
    const Sentry = getSentryModule();
    if (!Sentry) {
      console.warn('⚠️  @sentry/node module not loaded');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { nodeProfilingIntegration } = require('@sentry/profiling-node');

    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      release: `connectworld-server@${process.env.npm_package_version || '1.0.0'}`,

      // Sample rates: 10% in production, 0% in dev/test
      tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 0.0,
      profilesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 0.0,

      // Use v9's native Express integration (auto request tracing)
      integrations: [
        Sentry.expressIntegration(),
        nodeProfilingIntegration(),
      ],

      enabled: true,
      normalizeDepth: 10,
    });

    sentryModule = Sentry;
    console.log('✅ Sentry error monitoring initialized');
  } catch (err) {
    console.warn('⚠️  Sentry initialization failed:', (err as Error).message);
  }
}

/**
 * Get the Sentry module reference for manual error capture.
 * Returns null if Sentry is not configured/available.
 *
 * Usage:
 *   getSentry()?.captureException(err);
 */
export function getSentry() {
  return sentryModule;
}

import type { ErrorRequestHandler } from 'express';

/**
 * Express error-handling middleware for Sentry.
 * Must be registered AFTER all routes, before your custom error handler.
 */
export function sentryErrorHandler(): ErrorRequestHandler {
  const Sentry = getSentry();
  if (!Sentry) {
    // Passthrough — skips itself, calls next()
    return (_err: Error, _req: any, _res: any, next: (e?: Error) => void) => next(_err);
  }
  return Sentry.expressErrorHandler() as ErrorRequestHandler;
}
