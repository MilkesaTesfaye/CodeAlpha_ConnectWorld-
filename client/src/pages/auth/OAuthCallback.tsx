import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

/**
 * OAuth callback page.
 * Handles the redirect from Google/GitHub OAuth flow.
 * The access token is passed via query param and immediately cleared from the URL.
 * The refresh token is set as an HTTP-only cookie by the server.
 */
export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for error in query params (set by server on failure)
    const errorParam = searchParams.get('error');

    if (errorParam) {
      const errorMessages: Record<string, string> = {
        oauth_denied: 'Authentication was denied. Please try again.',
        oauth_failed: 'Authentication failed. Please try again.',
        no_code: 'Invalid authentication response.',
        invalid_state: 'Authentication session expired. Please try again.',
      };
      setError(errorMessages[errorParam] || 'Authentication failed. Please try again.');
      // Clean error from URL
      window.history.replaceState({}, '', '/auth/callback');
      return;
    }

    // Read access token from query params
    const accessToken = searchParams.get('accessToken');

    if (accessToken) {
      // Store token
      localStorage.setItem('accessToken', accessToken);

      // Immediately remove the token from the URL bar for security
      window.history.replaceState({}, '', '/auth/callback');

      toast.success('Signed in successfully!');
      navigate('/dashboard', { replace: true });
    } else {
      setError('No authentication token received.');
    }
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white dark:from-dark-950 dark:to-dark-900">
        <div className="text-center p-8 animate-in-fast">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-2">
            Authentication Failed
          </h2>
          <p className="text-dark-500 dark:text-dark-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white dark:from-dark-950 dark:to-dark-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-dark-500 dark:text-dark-400 text-sm font-medium">
          Completing authentication...
        </p>
      </div>
    </div>
  );
}
