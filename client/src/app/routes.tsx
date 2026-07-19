import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
import LoginPage from '../pages/auth/Login';
import RegisterPage from '../pages/auth/Register';
import ForgotPasswordPage from '../pages/auth/ForgotPassword';
import ResetPasswordPage from '../pages/auth/ResetPassword';
import VerifyEmailPage from '../pages/auth/VerifyEmail';
import OAuthCallbackPage from '../pages/auth/OAuthCallback';
import DashboardPage from '../pages/Dashboard';
import ProfilePage from '../pages/settings/Profile';
import SettingsPage from '../pages/settings/Settings';
import DevicesPage from '../pages/settings/Devices';
import MeetingsDashboard from '../pages/meetings/MeetingsDashboard';
import CreateMeeting from '../pages/meetings/CreateMeeting';
import MeetingHistory from '../pages/meetings/MeetingHistory';
import MeetingDetail from '../pages/meetings/MeetingDetail';
import MeetingRoom from '../pages/meetings/MeetingRoom';
import FileManager from '../pages/files/FileManager';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AnalyticsDashboard from '../pages/analytics/AnalyticsDashboard';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import AuthLayout from '../components/auth/AuthLayout';
import SidebarLayout from '../components/layout/SidebarLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // Public auth routes
      {
        path: 'login',
        element: <AuthLayout><LoginPage /></AuthLayout>,
      },
      {
        path: 'register',
        element: <AuthLayout><RegisterPage /></AuthLayout>,
      },
      {
        path: 'forgot-password',
        element: <AuthLayout><ForgotPasswordPage /></AuthLayout>,
      },
      {
        path: 'reset-password',
        element: <AuthLayout><ResetPasswordPage /></AuthLayout>,
      },
      {
        path: 'verify-email',
        element: <AuthLayout><VerifyEmailPage /></AuthLayout>,
      },
      {
        path: 'auth/callback',
        element: <OAuthCallbackPage />,
      },

      // Protected routes with sidebar layout
      {
        element: (
          <ProtectedRoute>
            <SidebarLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'meetings',
            element: (
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER']}>
                <MeetingsDashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: 'meetings/create',
            element: (
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER']}>
                <CreateMeeting />
              </ProtectedRoute>
            ),
          },
          {
            path: 'meetings/history',
            element: (
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER']}>
                <MeetingHistory />
              </ProtectedRoute>
            ),
          },
          {
            path: 'meetings/:id',
            element: (
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER']}>
                <MeetingDetail />
              </ProtectedRoute>
            ),
          },
          {
            path: 'meetings/:id/room',
            element: (
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER']}>
                <MeetingRoom />
              </ProtectedRoute>
            ),
          },
          {
            path: 'files',
            element: (
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER']}>
                <FileManager />
              </ProtectedRoute>
            ),
          },
          {
            path: 'admin',
            element: (
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: 'analytics',
            element: (
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MODERATOR']}>
                <AnalyticsDashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: 'settings/profile',
            element: <ProfilePage />,
          },
          {
            path: 'settings/preferences',
            element: <SettingsPage />,
          },
          {
            path: 'settings/devices',
            element: (
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER']}>
                <DevicesPage />
              </ProtectedRoute>
            ),
          },
        ],
      },

      // Default redirect
      {
        path: '',
        element: <Navigate to="/login" replace />,
      },

      // Catch-all
      {
        path: '*',
        element: <Navigate to="/login" replace />,
      },
    ],
  },
]);
