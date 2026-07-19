import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../app/store';
import { fetchNotifications, markAsRead, markAllAsRead, addNotification } from '../../features/notifications/notificationsSlice';
import { getSocket } from '../../services/socket';

export default function NotificationBell() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, unreadCount, isLoading } = useSelector((state: RootState) => state.notifications);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Socket listener for real-time notifications
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNotification = (notification: any) => {
      dispatch(addNotification(notification));
    };

    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [dispatch]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Element)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleMarkAsRead(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    dispatch(markAsRead(id));
  }

  function handleMarkAllRead() {
    dispatch(markAllAsRead());
  }

  function getNotificationIcon(type: string): string {
    switch (type) {
      case 'MEETING_INVITATION': return '✉️';
      case 'MEETING_REMINDER': return '⏰';
      case 'MENTION': return '💬';
      case 'CHAT_MESSAGE': return '💭';
      case 'FILE_SHARED': return '📁';
      case 'SYSTEM_ALERT': return '🔔';
      case 'ADMIN_BROADCAST': return '📢';
      default: return '🔔';
    }
  }

  function timeAgo(dateStr: string): string {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Notifications
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-2xl mb-2">🔔</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  You'll see notifications here when someone interacts with you
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {items.slice(0, 20).map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                    }`}
                    onClick={() => {
                      dispatch(markAsRead(notification.id));
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg mt-0.5">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                          {notification.title}
                        </p>
                        {notification.message && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                          {timeAgo(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          className="shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          title="Mark as read"
                        >
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
