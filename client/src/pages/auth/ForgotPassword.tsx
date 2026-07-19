import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../services/api';

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const { forgotPassword, isLoading } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotFormData) => {
    try {
      await forgotPassword(data);
      setSubmitted(true);
      toast.success('If the account exists, a reset code has been sent.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (submitted) {
    return (
      <div className="animate-in-fast text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-2">Check your email</h2>
        <p className="text-dark-500 dark:text-dark-400 mb-8">
          We've sent a password reset code to your email. It expires in 5 minutes.
        </p>
        <Link
          to="/reset-password"
          className="inline-block px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors"
        >
          Enter reset code
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in-fast">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">
          Forgot password?
        </h1>
        <p className="text-dark-500 dark:text-dark-400">
          Enter your email and we'll send you a reset code
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="forgotEmail" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
            Email
          </label>
          <input
            id="forgotEmail"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="w-full px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            placeholder="you@company.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Send reset code'
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
