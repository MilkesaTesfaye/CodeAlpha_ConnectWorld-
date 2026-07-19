import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'pink' | 'brand' | 'neon';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  dot?: boolean;
  pill?: boolean;
  size?: 'sm' | 'md';
  glow?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-dark-100 text-dark-700 dark:bg-dark-700 dark:text-dark-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
  neon: 'bg-neon-100 text-neon-700 dark:bg-neon-900/30 dark:text-neon-400',
};

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-dark-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  brand: 'bg-brand-500',
  neon: 'bg-neon-500',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
};

const glowStyles: Record<BadgeVariant, string> = {
  default: '',
  success: 'shadow-[0_0_8px_rgba(34,197,94,0.3)]',
  warning: 'shadow-[0_0_8px_rgba(245,158,11,0.3)]',
  danger: 'shadow-[0_0_8px_rgba(239,68,68,0.3)]',
  info: 'shadow-[0_0_8px_rgba(59,130,246,0.3)]',
  purple: 'shadow-[0_0_8px_rgba(147,51,234,0.3)]',
  pink: 'shadow-[0_0_8px_rgba(236,72,153,0.3)]',
  brand: 'shadow-[0_0_8px_rgba(124,58,237,0.3)]',
  neon: 'shadow-[0_0_8px_rgba(6,182,212,0.3)]',
};

export default function Badge({
  variant = 'default',
  children,
  className = '',
  dot = false,
  pill = false,
  size = 'md',
  glow = false,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${glow ? glowStyles[variant] : ''} ${
        pill ? 'px-3' : ''
      } ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} />
      )}
      {children}
    </span>
  );
}
