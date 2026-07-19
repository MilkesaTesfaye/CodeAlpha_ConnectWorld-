interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'primary' | 'brand' | 'accent' | 'neon' | 'gradient';
}

const sizeStyles = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };

const variantStyles = {
  primary: 'text-primary-500',
  brand: 'text-brand-500',
  accent: 'text-accent-500',
  neon: 'text-neon-500',
  gradient: 'text-primary-500',
};

export default function Spinner({ size = 'md', className = '', variant = 'primary' }: SpinnerProps) {
  if (variant === 'gradient') {
    return (
      <div className={`relative ${sizeStyles[size]} ${className}`}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-500 via-accent-500 to-neon-500 animate-spin" />
        <div className="absolute inset-[2px] rounded-full bg-white dark:bg-dark-950" />
      </div>
    );
  }

  return (
    <svg
      className={`animate-spin ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
