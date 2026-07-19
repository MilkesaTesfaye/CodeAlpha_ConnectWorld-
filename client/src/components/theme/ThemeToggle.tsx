import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
  className?: string;
  variant?: 'default' | 'glass' | 'minimal';
}

export default function ThemeToggle({ className = '', variant = 'default' }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const variantStyles = {
    default:
      'bg-dark-100 dark:bg-dark-700 text-dark-500 dark:text-dark-400 hover:bg-dark-200 dark:hover:bg-dark-600',
    glass:
      'bg-white/70 dark:bg-dark-900/50 backdrop-blur-xl border border-dark-200/50 dark:border-dark-700/50 text-dark-500 dark:text-dark-400 hover:bg-white/90 dark:hover:bg-dark-800/70',
    minimal:
      'text-dark-400 dark:text-dark-500 hover:text-dark-600 dark:hover:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800',
  };

  return (
    <button
      onClick={toggleTheme}
      className={`relative p-2 rounded-xl transition-all duration-300 group ${
        variantStyles[variant]
      } ${className}`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Sun icon */}
      <div
        className={`w-5 h-5 transition-all duration-300 ${
          isDark
            ? 'opacity-0 scale-0 rotate-90 absolute inset-0 m-auto'
            : 'opacity-100 scale-100 rotate-0'
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
      {/* Moon icon */}
      <div
        className={`w-5 h-5 transition-all duration-300 ${
          isDark
            ? 'opacity-100 scale-100 rotate-0'
            : 'opacity-0 scale-0 -rotate-90 absolute inset-0 m-auto'
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </div>
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-400/0 via-primary-400/10 to-accent-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </button>
  );
}
