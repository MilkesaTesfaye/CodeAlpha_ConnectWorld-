import type { UserRole } from '../../types/user';

interface RoleBadgeProps {
  role: UserRole | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const roleConfig: Record<string, { label: string; color: string; bg: string; dot: string; icon: string }> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    color: 'text-white',
    bg: 'bg-gradient-to-r from-purple-600 to-red-500',
    dot: 'bg-purple-500',
    icon: '⚡',
  },
  ADMIN: {
    label: 'Admin',
    color: 'text-white',
    bg: 'bg-blue-500',
    dot: 'bg-blue-500',
    icon: '🛡️',
  },
  MODERATOR: {
    label: 'Moderator',
    color: 'text-white',
    bg: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    icon: '🛠️',
  },
  USER: {
    label: 'User',
    color: 'text-dark-600 dark:text-dark-300',
    bg: 'bg-dark-200 dark:bg-dark-700',
    dot: 'bg-dark-400',
    icon: '👤',
  },
  GUEST: {
    label: 'Guest',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    dot: 'bg-amber-500',
    icon: '🔑',
  },
};

const sizeStyles = {
  sm: 'text-[10px] px-1.5 py-0.5 gap-1',
  md: 'text-xs px-2 py-0.5 gap-1.5',
  lg: 'text-sm px-3 py-1 gap-2',
};

const dotSizes = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export default function RoleBadge({ role, size = 'sm', showIcon = false, className = '' }: RoleBadgeProps) {
  const config = roleConfig[role] || roleConfig.USER;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${config.bg} ${config.color} ${sizeStyles[size]} ${className}`}
    >
      {showIcon && <span className="shrink-0">{config.icon}</span>}
      <span className="shrink-0">{config.label}</span>
    </span>
  );
}

/**
 * Role indicator dot - a small colored circle showing the user's role level.
 * Use this on avatars or anywhere you need a subtle role indicator.
 */
export function RoleDot({ role, size = 'md', className = '' }: { role: UserRole | string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const config = roleConfig[role] || roleConfig.USER;

  return (
    <span
      className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white dark:border-dark-900 ${config.dot} ${dotSizes[size]} ${className}`}
      title={config.label}
    />
  );
}

/**
 * Get the role config for use outside of React components.
 */
export function getRoleConfig(role: UserRole | string) {
  return roleConfig[role] || roleConfig.USER;
}
