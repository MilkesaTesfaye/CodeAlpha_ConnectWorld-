import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass' | 'gradient' | 'elevated' | 'border-gradient';
  hoverable?: boolean;
  onClick?: () => void;
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const variantStyles = {
  default:
    'bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700',
  glass:
    'bg-white/60 dark:bg-dark-800/60 backdrop-blur-xl border border-white/30 dark:border-dark-700/40',
  gradient:
    'bg-gradient-to-br from-white via-white to-primary-50/30 dark:from-dark-800 dark:via-dark-800 dark:to-brand-950/20 border border-dark-200/50 dark:border-dark-700/50',
  elevated:
    'bg-white dark:bg-dark-800 border border-dark-200/50 dark:border-dark-700/50 shadow-soft',
  'border-gradient':
    'bg-white dark:bg-dark-800 relative overflow-hidden',
};

export default function Card({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  hoverable = false,
  onClick,
}: CardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`rounded-2xl ${paddingStyles[padding]} ${variantStyles[variant]} ${
        variant === 'border-gradient'
          ? 'card-gradient-border'
          : ''
      } ${
        hoverable
          ? 'transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
          : ''
      } ${className}`}
    >
      {children}
    </Component>
  );
}
