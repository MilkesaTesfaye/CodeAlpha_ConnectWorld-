/**
 * Sentry error monitoring utilities for the React client.
 *
 * Init is performed directly in main.tsx (which already imports @sentry/react
 * statically). This file only provides the ErrorBoundary fallback component.
 *
 * If VITE_SENTRY_DSN is not set, the init in main.tsx is skipped.
 */

import React from 'react';

/**
 * Sentry ErrorBoundary fallback component.
 * Shows a friendly error UI when an unhandled error is caught.
 */
export function SentryFallback({
  error,
  resetError,
}: {
  error: Error;
  resetError: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '40px',
        background: '#0f172a',
        color: '#f1f5f9',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: '480px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚡</div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
          Something went wrong
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#94a3b8',
            marginBottom: '24px',
            lineHeight: 1.6,
          }}
        >
          An unexpected error occurred. Our team has been notified automatically.
          Please try refreshing the page.
        </p>
        {import.meta.env.DEV && (
          <pre
            style={{
              fontSize: '12px',
              color: '#ef4444',
              background: '#1e293b',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: '200px',
              marginBottom: '24px',
            }}
          >
            {error.message}
            {'\n'}
            {error.stack}
          </pre>
        )}
        <button
          onClick={resetError}
          style={{
            padding: '12px 32px',
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) =>
            (e.currentTarget.style.background = '#4f46e5')
          }
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) =>
            (e.currentTarget.style.background = '#6366f1')
          }
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
