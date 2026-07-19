import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import type { UserRole } from '../../types/user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Optional list of roles allowed to access this route. If omitted, any authenticated user can access. */
  allowedRoles?: UserRole[];
}

/**
 * Protected route component.
 * Redirects to login if user is not authenticated.
 * If `allowedRoles` is provided, checks the user's role and redirects
 * to the dashboard with an error toast if they lack permission.
 */
export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white dark:from-dark-950 dark:to-dark-900">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Role check
  if (allowedRoles && allowedRoles.length > 0 && user?.role && !allowedRoles.includes(user.role)) {
    const roleLabels: Record<UserRole, string> = {
      SUPER_ADMIN: 'Super Admin',
      ADMIN: 'Admin',
      MODERATOR: 'Moderator',
      USER: 'User',
      GUEST: 'Guest',
    };
    const required =
      allowedRoles
        .map((r) => roleLabels[r] || r)
        .join(', ')
        .replace(/, ([^,]*)$/, ' or $1');
    toast.error(`This page requires ${required} access.`);
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
