/**
 * OAuth Configuration
 *
 * Controls where the OAuth flow initiates (where the user's browser navigates to).
 * In development, this points to the dev proxy on port 3000 which forwards
 * to the API server. The proxy is needed because:
 *   1. Vite's dev proxy doesn't forward /api correctly in some versions
 *   2. Google/GitHub OAuth apps are configured with port 3000 as the callback URL
 *
 * In production, this should be the API base URL (same origin or API gateway).
 */

export const OAUTH_BASE_URL =
  import.meta.env.VITE_OAUTH_URL ||
  (import.meta.env.PROD
    ? '/api/auth'
    : 'http://localhost:3000/api/auth');

export function getOAuthUrl(provider: 'google' | 'github'): string {
  return `${OAUTH_BASE_URL}/${provider}`;
}
