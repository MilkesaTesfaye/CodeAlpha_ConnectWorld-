import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../services/api';
import { PASSWORD_REGEX, PASSWORD_REGEX_ERROR, PASSWORD_MIN_LENGTH } from '../../utils/password';
import Button from '../../components/common/Button';

const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
      .regex(PASSWORD_REGEX, PASSWORD_REGEX_ERROR),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      toast.success('Account created! Check your email for verification.');
      navigate('/verify-email', { state: { email: data.email } });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-dark-900 dark:text-white mb-2">
          Create your account
        </h1>
        <p className="text-dark-500 dark:text-dark-400">
          Start collaborating with your team on ConnectWorld
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
              First name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                id="firstName"
                {...register('firstName')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                placeholder="John"
              />
            </div>
            {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
              Last name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                id="lastName"
                {...register('lastName')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                placeholder="Doe"
              />
            </div>
            {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="regEmail" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              id="regEmail"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              placeholder="you@company.com"
            />
          </div>
          {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="regPassword" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              id="regPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              {...register('password')}
              className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              placeholder="Create a strong password"
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
          {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
            Confirm password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              {...register('confirmPassword')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              placeholder="Confirm your password"
            />
          </div>
          {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        <Button
          type="submit"
          variant="gradient-brand"
          size="lg"
          isLoading={isLoading}
          glow
          className="w-full mt-2"
        >
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-dark-500 dark:text-dark-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
