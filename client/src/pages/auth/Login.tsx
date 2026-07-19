import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import api, { getErrorMessage } from '../../services/api';
import Button from '../../components/common/Button';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface CredentialUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  avatarUrl: string | null;
  password: string | null;
  isEmailVerified: boolean;
}

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<CredentialUser[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [credsError, setCredsError] = useState<string | null>(null);

  const from = (location.state as { from?: string })?.from || '/dashboard';

  // Dynamically fetch available credentials from the database
  const fetchCredentials = async () => {
    if (credentials.length > 0) {
      setShowCredentials(!showCredentials);
      return;
    }
    setLoadingCredentials(true);
    setCredsError(null);
    try {
      const { data } = await api.get('/auth/credentials');
      if (data.success && data.data) {
        setCredentials(data.data);
        setShowCredentials(true);
      }
    } catch (err) {
      setCredsError(getErrorMessage(err));
    } finally {
      setLoadingCredentials(false);
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-dark-900 dark:text-white mb-2">
          Welcome back
        </h1>
        <p className="text-dark-500 dark:text-dark-400">
          Sign in to your ConnectWorld account to continue
        </p>
      </div>
      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              placeholder="you@company.com"
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 dark:hover:text-dark-300 p-1 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-all"
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-dark-300 dark:border-dark-600 text-primary-500 focus:ring-primary-500/20 cursor-pointer"
            />
            <span className="text-sm text-dark-500 dark:text-dark-400 group-hover:text-dark-700 dark:group-hover:text-dark-300 transition-colors">Remember me</span>
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="gradient-brand"
          size="lg"
          isLoading={isLoading}
          glow
          className="w-full"
        >
          Sign in
        </Button>
      </form>

      {/* Dynamic Credentials Toggle */}
      <div className="relative mt-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dark-200 dark:border-dark-700" />
        </div>
        <div className="relative flex justify-center">
          <button
            type="button"
            onClick={fetchCredentials}
            className="px-4 py-1 bg-white dark:bg-dark-800 text-xs font-medium text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-dark-300 border border-dark-200 dark:border-dark-700 rounded-full shadow-sm hover:shadow-md transition-all"
          >
            {loadingCredentials ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading...
              </span>
            ) : showCredentials ? (
              'Hide test accounts'
            ) : (
              'Show test accounts'
            )}
          </button>
        </div>
      </div>

      {/* Dynamic Credentials List */}
      {showCredentials && (
        <div className="mt-4 animate-fade-in-up">
          {credsError ? (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
              {credsError}
            </div>
          ) : credentials.length === 0 ? (
            <div className="p-6 rounded-xl bg-dark-50 dark:bg-dark-800/50 border border-dashed border-dark-200 dark:border-dark-700 text-center">
              <p className="text-sm text-dark-500 dark:text-dark-400">
                No accounts found in the database. Run the seed script first.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dark-200 dark:border-dark-700 overflow-hidden bg-white dark:bg-dark-800/50 shadow-sm">
              <div className="px-4 py-3 bg-gradient-to-r from-primary-500/10 to-primary-600/5 border-b border-dark-200 dark:border-dark-700">
                <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                  Available Accounts ({credentials.length})
                </p>
              </div>
              <div className="divide-y divide-dark-100 dark:divide-dark-700/50 max-h-64 overflow-y-auto">
                {credentials.map((cred) => (
                  <button
                    key={cred.id}
                    type="button"
                    onClick={() => {
                      setValue('email', cred.email);
                      if (cred.password) {
                        setValue('password', cred.password);
                        document.getElementById('password')?.focus();
                      } else {
                        document.getElementById('email')?.focus();
                      }
                      setShowCredentials(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors text-left group"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {cred.displayName?.charAt(0) || cred.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {cred.displayName || cred.email}
                      </p>
                      <p className="text-xs text-dark-500 dark:text-dark-400 truncate">
                        {cred.email}
                      </p>
                      {cred.password && (
                        <p className="text-[11px] font-mono text-primary-500 dark:text-primary-400 truncate mt-0.5">
                          🔑 {cred.password}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        cred.role === 'SUPER_ADMIN' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                        cred.role === 'ADMIN' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                        cred.role === 'MODERATOR' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                        cred.role === 'GUEST' ? 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400' :
                        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}>
                        {cred.role === 'SUPER_ADMIN' ? 'S-Admin' : cred.role.charAt(0) + cred.role.slice(1).toLowerCase()}
                      </span>
                      {!cred.isEmailVerified && (
                        <span className="text-[10px] text-amber-500 font-medium">Unverified</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="px-4 py-2.5 bg-dark-50/50 dark:bg-dark-900/30 border-t border-dark-200 dark:border-dark-700">
                <p className="text-[11px] text-dark-400 dark:text-dark-500">
                  👆 Click an account to auto-fill email &amp; password. Passwords shown for seed accounts only.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="mt-6 text-center text-sm text-dark-500 dark:text-dark-400">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          Create free account
        </Link>
      </p>
    </div>
  );
}
