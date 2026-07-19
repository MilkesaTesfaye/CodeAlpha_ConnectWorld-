import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import * as Sentry from '@sentry/react';
import { store } from './app/store';
import { router } from './app/routes';
import { SentryFallback } from './utils/sentry';
import { ThemeProvider } from './components/theme';
import './styles/globals.css';

// ─── Sentry Error Monitoring ─────────────────────────────────────────────────
// If VITE_SENTRY_DSN is set, init Sentry with browser tracing + session replay.
// Otherwise, Sentry stays a no-op (the ErrorBoundary is still active but
// won't send events anywhere).
const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: (import.meta.env.VITE_NODE_ENV as string) || 'development',
    release: `connectworld-client@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    tracesSampleRate: import.meta.env.VITE_NODE_ENV === 'production' ? 0.1 : 0.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    normalizeDepth: 10,
  });
  console.log('✅ Sentry client error monitoring initialized');
} else {
  console.warn('⚠️  VITE_SENTRY_DSN not configured — Sentry is disabled');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={(errorData) => {
      const { error, resetError } = errorData as { error: Error; resetError: () => void };
      return <SentryFallback error={error} resetError={resetError} />;
    }}>
      <Provider store={store}>
        <ThemeProvider>
          <RouterProvider router={router} />
          <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              background: '#1e293b',
              color: '#f1f5f9',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#f0fdf4' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fef2f2' },
            },
          }}
        />
        </ThemeProvider>
      </Provider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
