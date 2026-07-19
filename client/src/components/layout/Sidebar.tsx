import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';

import type { UserRole } from '../../types/user';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  /** Roles that can see this item. Empty array = all roles. */
  roles?: UserRole[];
}

interface NavSection {
  title: string;
  items: NavItem[];
  /** Roles that can see this section header. Empty array = all roles. */
  roles?: UserRole[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Meetings',
    items: [
      {
        label: 'All Meetings',
        path: '/meetings',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        ),
        roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER'],
      },
      {
        label: 'Create Meeting',
        path: '/meetings/create',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        ),
        roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER'],
      },
      {
        label: 'Meeting History',
        path: '/meetings/history',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER'],
      },
    ],
    roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER'],
  },
  {
    title: 'Workspace',
    items: [
      {
        label: 'Files',
        path: '/files',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        ),
        roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER'],
      },
      {
        label: 'Analytics',
        path: '/analytics',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
        roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'],
      },
    ],
    roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER'],
  },
  {
    title: 'Admin',
    items: [
      {
        label: 'Admin Panel',
        path: '/admin',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
    ],
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    title: 'Settings',
    items: [
      {
        label: 'Profile',
        path: '/settings/profile',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
      },
      {
        label: 'Preferences',
        path: '/settings/preferences',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
      {
        label: 'Devices',
        path: '/settings/devices',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
        roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER'],
      },
    ],
  },
];

/**
 * Check whether a role is allowed to see an item/section.
 * Empty allowedRoles array = accessible to everyone.
 */
function isRoleAllowed(userRole: string | undefined, allowedRoles?: string[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

export default function Sidebar() {
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const visibleSections = useMemo(
    () =>
      navSections
        .filter((section) => isRoleAllowed(user?.role, section.roles))
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => isRoleAllowed(user?.role, item.roles)),
        }))
        .filter((section) => section.items.length > 0),
    [user?.role]
  );

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      if (width >= 768 && width < 1024) {
        setCollapsed(true);
      } else if (width >= 1024) {
        setCollapsed(false);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  function isActive(path: string): boolean {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    if (path === '/meetings') return location.pathname === '/meetings';
    if (path === '/meetings/create' || path === '/meetings/history') return location.pathname.startsWith(path);
    return location.pathname.startsWith(path);
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  function renderNavLink(item: NavItem) {
    const active = isActive(item.path);
    const linkContent = (
      <Link
        key={item.path}
        to={item.path}
        onClick={closeMobile}
        className={`flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          active
            ? 'bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 text-primary-700 dark:text-primary-300 shadow-sm'
            : 'text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800/50 hover:text-dark-900 dark:hover:text-dark-200'
        }`}
        title={collapsed ? item.label : undefined}
      >
        <span className={`shrink-0 transition-colors ${
          active
            ? 'text-primary-600 dark:text-primary-400'
            : 'text-dark-400 dark:text-dark-500 group-hover:text-dark-600 dark:group-hover:text-dark-300'
        }`}>
          {item.icon}
        </span>
        {!collapsed && <span className="truncate">{item.label}</span>}
        {active && !collapsed && (
          <span className="ml-auto w-1.5 h-5 rounded-full bg-gradient-to-b from-primary-500 to-primary-400" />
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <div key={item.path} className="group relative flex items-center justify-center">
          {linkContent}
          <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-dark-900 dark:bg-dark-700 text-white text-xs font-medium rounded-md shadow-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none">
            {item.label}
          </div>
        </div>
      );
    }

    return linkContent;
  }

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-dark-200 dark:border-dark-700 shadow-lg hover:shadow-xl transition-all"
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
      >
        <svg className="w-5 h-5 text-dark-600 dark:text-dark-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {mobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={closeMobile} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 glass-strong border-r border-dark-200/50 dark:border-dark-700/50 overflow-y-auto transform transition-transform duration-200 md:hidden ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-dark-200/50 dark:border-dark-700/50">
          <div className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center shadow-glow-brand shrink-0">
            <span className="text-sm font-bold text-white">CW</span>
          </div>
          <span className="text-lg font-bold gradient-text-brand">ConnectWorld</span>
        </div>
        <nav className="p-4 space-y-6">
          {visibleSections.map((section) => (
            <div key={section.title}>
              <h3 className="px-3 mb-2 text-xs font-bold uppercase tracking-widest text-dark-400 dark:text-dark-500">
                {section.title}
              </h3>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeMobile}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        active
                          ? 'bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 text-primary-700 dark:text-primary-300'
                          : 'text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800/50 hover:text-dark-900 dark:hover:text-dark-200'
                      }`}
                    >
                      <span className={active ? 'text-primary-600 dark:text-primary-400' : 'text-dark-400 dark:text-dark-500'}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <aside
        className={`shrink-0 border-r border-dark-200/50 dark:border-dark-700/50 glass-sidebar overflow-y-auto hidden md:block transition-[width] duration-200 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className={`h-16 flex items-center gap-3 border-b border-dark-200/50 dark:border-dark-700/50 transition-all duration-200 ${
          collapsed ? 'justify-center px-0' : 'px-6'
        }`}>
          <div className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center shadow-glow-brand shrink-0">
            <span className="text-sm font-bold text-white">CW</span>
          </div>
          {!collapsed && (
            <span className="text-lg font-bold gradient-text-brand truncate">ConnectWorld</span>
          )}
        </div>

        <nav className="p-3 space-y-6">
          {visibleSections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <h3 className="px-3 mb-2 text-xs font-bold uppercase tracking-widest text-dark-400 dark:text-dark-500">
                  {section.title}
                </h3>
              )}
              <div className={`space-y-0.5 ${collapsed ? 'flex flex-col items-center' : ''}`}>
                {section.items.map(renderNavLink)}
              </div>
            </div>
          ))}
        </nav>

        <div className={`border-t border-dark-200/50 dark:border-dark-700/50 p-3 ${collapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-xl text-dark-400 dark:text-dark-500 hover:bg-dark-100 dark:hover:bg-dark-800 hover:text-dark-600 dark:hover:text-dark-300 transition-all duration-200 ${
              collapsed ? '' : 'w-full flex items-center gap-3'
            }`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={`w-5 h-5 shrink-0 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {!collapsed && <span className="text-sm">Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
