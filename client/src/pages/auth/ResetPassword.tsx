import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../services/api';
import { PASSWORD_REGEX, PASSWORD_REGEX_ERROR, PASSWORD_MIN_LENGTH } from '../../utils/password';

const resetSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must contain only digits'),
    newPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
      .regex(PASSWORD_REGEX, PASSWORD_REGEX_ERROR),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const { resetPassword, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '', otp: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetFormData) => {
    try {
      await resetPassword({
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      toast.success('Password reset successfully! Please sign in.');
      navigate('/login');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="animate-in-fast">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">
          Reset your password
        </h1>
        <p className="text-dark-500 dark:text-dark-400">
          Enter the reset code sent to your email and create a new password
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="resetEmail" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
            Email
          </label>
          <input
            id="resetEmail"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="w-full px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            placeholder="you@company.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="resetOtp" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
            Reset code (OTP)
          </label>
          <input
            id="resetOtp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            {...register('otp')}
            className="w-full px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-center text-2xl tracking-[8px] font-mono"
            placeholder="000000"
          />
          {errors.otp && <p className="mt-1 text-sm text-red-500">{errors.otp.message}</p>}
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
            New password
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              {...register('newPassword')}
              className="w-full px-4 py-2.5 pr-12 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              placeholder="New password"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
          {errors.newPassword && <p className="mt-1 text-sm text-red-500">{errors.newPassword.message}</p>}
        </div>

        <div>
          <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
            Confirm new password
          </label>
          <input
            id="confirmNewPassword"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
            className="w-full px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            placeholder="Confirm new password"
          />
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Reset password'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-dark-500 dark:text-dark-400">
        Remember your password?{' '}
        <Link to="/login" className="font-medium text-primary-500 hover:text-primary-600 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
