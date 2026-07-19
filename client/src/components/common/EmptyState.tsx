import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && <div className="text-4xl mb-3">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
