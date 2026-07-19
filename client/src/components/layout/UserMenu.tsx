import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import RoleBadge, { RoleDot } from '../common/RoleBadge';

/**
 * User menu dropdown.
 * Clicking the user avatar opens a dropdown with links to Profile,
 * Preferences, Devices, and a Sign out button.
 */
export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close menu on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const handleNavigation = () => {
    setIsOpen(false);
  };

  const settingsItems = [
    {
      label: 'Profile',
      path: '/settings/profile',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      label: 'Preferences',
      path: '/settings/preferences',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'Devices',
      path: '/settings/devices',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const meetingItems = [
    {
      label: 'Create Meeting',
      path: '/meetings/create',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      label: 'Meetings',
      path: '/meetings',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Meeting History',
      path: '/meetings/history',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="relative">
      {/* Avatar Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-dark-900 dark:text-white leading-tight">
              {user?.displayName || user?.email}
            </p>
            <div className="flex justify-end mt-0.5">
              {user?.role && <RoleBadge role={user.role} size="sm" />}
            </div>
          </div>
          <div className="relative w-9 h-9 shrink-0">
            <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center ring-2 ring-transparent group-hover:ring-primary-300 transition-all overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                  {user?.displayName?.charAt(0)?.toUpperCase() || user?.email.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {user?.role && <RoleDot role={user.role} size="sm" />}
          </div>
        </div>
        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-dark-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 py-1.5 rounded-2xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 shadow-xl shadow-black/5 dark:shadow-black/20 animate-in-fast z-50"
        >
          {/* User info header */}
          <div className="px-4 py-3 border-b border-dark-200 dark:border-dark-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative shrink-0">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                      {user?.displayName?.charAt(0)?.toUpperCase() || user?.email.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                {user?.role && <RoleDot role={user.role} size="md" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-dark-900 dark:text-white truncate">
                  {user?.displayName || user?.email}
                </p>
                <p className="text-xs text-dark-500 dark:text-dark-400 truncate">{user?.email}</p>
              </div>
            </div>
            {user?.role && <RoleBadge role={user.role} size="sm" showIcon className="w-full justify-center" />}
          </div>

          {/* Settings section */}
          <div className="py-1">
            <div className="px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-dark-400 dark:text-dark-500">
              Settings
            </div>
            {settingsItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavigation}
                role="menuitem"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
              >
                <span className="text-dark-400 dark:text-dark-500">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Meetings section */}
          <div className="py-1 border-t border-dark-200 dark:border-dark-700">
            <div className="px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-dark-400 dark:text-dark-500">
              Meetings
            </div>
            {meetingItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavigation}
                role="menuitem"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
              >
                <span className="text-dark-400 dark:text-dark-500">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Sign out */}
          <div className="border-t border-dark-200 dark:border-dark-700 pt-1">
            <button
              onClick={handleLogout}
              role="menuitem"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
