import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'gradient-brand' | 'gradient-accent' | 'gradient-neon' | 'outline-brand';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
  glow?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 disabled:bg-primary-300 shadow-sm hover:shadow-md',
  secondary:
    'border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 focus:ring-dark-500',
  danger:
    'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 disabled:bg-red-400 shadow-sm',
  ghost:
    'text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-700 focus:ring-dark-500',
  'gradient-brand':
    'btn-gradient-brand',
  'gradient-accent':
    'btn-gradient-accent',
  'gradient-neon':
    'btn-gradient-neon',
  'outline-brand':
    'btn-outline-brand',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  glow = false,
  className = '',
  ...props
}: ButtonProps) {
  const glowStyles = glow && variant === 'primary'
    ? 'shadow-glow-primary'
    : glow && variant === 'gradient-brand'
    ? 'shadow-glow-brand'
    : '';

  return (
    <button
      type={props.type || 'button'}
      className={`inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-950 disabled:cursor-not-allowed active:scale-[0.98] ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${glowStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}
