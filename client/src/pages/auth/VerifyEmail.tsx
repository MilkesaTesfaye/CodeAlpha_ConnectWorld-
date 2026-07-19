import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import api, { getErrorMessage } from '../../services/api';

const verifySchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must contain only digits'),
});

type VerifyFormData = z.infer<typeof verifySchema>;

export default function VerifyEmailPage() {
  const { verifyEmail, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || '';
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Use setTimeout for the countdown timer instead of setInterval
  // This avoids creating a new interval on every tick and is more efficient
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: { otp: '' },
  });

  const onSubmit = async (data: VerifyFormData) => {
    if (!email) {
      toast.error('Email not found. Please register first.');
      navigate('/register');
      return;
    }
    try {
      await verifyEmail({ email, otp: data.otp });
      toast.success('Email verified successfully! 🎉');
      navigate('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleResend = async () => {
    if (!email || isResending || countdown > 0) return;
    setIsResending(true);
    try {
      await api.post('/auth/resend-verification', { email });
      toast.success('Verification code resent!');
      setCountdown(60);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="animate-in-fast">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">
          Verify your email
        </h1>
        <p className="text-dark-500 dark:text-dark-400">
          Enter the 6-digit code sent to <strong className="text-dark-900 dark:text-white">{email}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="verifyOtp" className="sr-only">
            Verification code
          </label>
          <input
            id="verifyOtp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            {...register('otp')}
            className="w-full px-4 py-3 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-center text-3xl tracking-[12px] font-mono"
            placeholder="000000"
          />
          {errors.otp && <p className="mt-2 text-sm text-red-500 text-center">{errors.otp.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Verify email'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || countdown > 0}
          className="text-sm text-primary-500 hover:text-primary-600 disabled:text-dark-300 dark:disabled:text-dark-600 transition-colors"
        >
          {countdown > 0
            ? `Resend code in ${countdown}s`
            : isResending
            ? 'Resending...'
            : "Didn't receive the code? Resend"}
        </button>
      </div>

      <p className="mt-4 text-center text-sm text-dark-500 dark:text-dark-400">
        <Link to="/login" className="font-medium text-primary-500 hover:text-primary-600 transition-colors">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
