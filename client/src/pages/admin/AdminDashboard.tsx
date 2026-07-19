import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../app/store';
import { fetchAdminStats } from '../../features/admin/adminSlice';
import api from '../../services/api';
import { getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';

type AdminTab = 'overview' | 'users' | 'audit-logs' | 'broadcast';

interface UserRow {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

interface LogEntry {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: { id: string; displayName: string | null } | null;
}

export default function AdminDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { stats, isLoading: statsLoading } = useSelector((state: RootState) => state.admin);
  const { user } = useSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Broadcast
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminStats());
  }, [dispatch]);

  // ─── Users ─────────────────────────────────────────────────────────────

  async function loadUsers() {
    setUsersLoading(true);
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUsersLoading(false);
    }
  }

  async function loadLogs() {
    setLogsLoading(true);
    try {
      const { data } = await api.get('/admin/audit-logs');
      setLogs(data.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'audit-logs') loadLogs();
  }, [activeTab]);

  async function handleBanUser(userId: string) {
    if (!window.confirm('Ban this user?')) return;
    try {
      await api.post(`/admin/users/${userId}/ban`, { reason: 'Violated terms of service' });
      toast.success('User banned');
      loadUsers();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleUnbanUser(userId: string) {
    try {
      await api.post(`/admin/users/${userId}/unban`);
      toast.success('User unbanned');
      loadUsers();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleUpdateRole(userId: string, role: string) {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      toast.success('Role updated');
      loadUsers();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setBroadcasting(true);
    try {
      await api.post('/admin/broadcast', {
        title: broadcastTitle,
        message: broadcastMessage,
      });
      toast.success('Broadcast sent!');
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBroadcasting(false);
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── Render ─────────────────────────────────────────────────────────────

  const tabs: Array<{ key: AdminTab; label: string; icon: string }> = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'users', label: 'Users', icon: '👥' },
    { key: 'audit-logs', label: 'Audit Logs', icon: '📋' },
    { key: 'broadcast', label: 'Broadcast', icon: '📢' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your ConnectWorld instance
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ──────── Overview Tab ──────── */}
        {activeTab === 'overview' && (
          <div>
            {statsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : stats ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'from-blue-500 to-blue-600' },
                    { label: 'Active Meetings', value: stats.activeMeetings, icon: '📡', color: 'from-green-500 to-green-600' },
                    { label: 'Total Meetings', value: stats.totalMeetings, icon: '📅', color: 'from-indigo-500 to-indigo-600' },
                    { label: 'Storage Used', value: `${(stats.storageUsed / (1024 * 1024 * 1024)).toFixed(1)} GB`, icon: '💾', color: 'from-purple-500 to-purple-600' },
                  ].map((card) => (
                    <div
                      key={card.label}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{card.icon}</span>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</span>
                      </div>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                    </div>
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                  {stats.recentActivity.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.recentActivity.slice(0, 10).map((activity) => (
                        <div key={activity.id} className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                          <span className="text-gray-600 dark:text-gray-300 capitalize">{activity.type.replace(/_/g, ' ')}</span>
                          <span className="text-gray-400 ml-auto text-xs">{new Date(activity.createdAt).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Unable to load stats</p>
              </div>
            )}
          </div>
        )}

        {/* ──────── Users Tab ──────── */}
        {activeTab === 'users' && (
          <div>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search users by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         placeholder-gray-400 dark:placeholder-gray-500
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                                {u.displayName?.charAt(0)?.toUpperCase() || u.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{u.displayName || 'N/A'}</p>
                                <p className="text-xs text-gray-500">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={u.role}
                              onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                              disabled={u.role === 'SUPER_ADMIN'}
                            >
                              <option value="USER">USER</option>
                              <option value="MODERATOR">MODERATOR</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {u.isBanned ? (
                                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">Banned</span>
                              ) : !u.isActive ? (
                                <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full">Inactive</span>
                              ) : u.isEmailVerified ? (
                                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">Active</span>
                              ) : (
                                <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">Unverified</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {u.isBanned ? (
                              <button onClick={() => handleUnbanUser(u.id)} className="text-xs text-green-600 hover:text-green-700 font-medium">
                                Unban
                              </button>
                            ) : (
                              <button onClick={() => handleBanUser(u.id)} className="text-xs text-red-600 hover:text-red-700 font-medium">
                                Ban
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────── Audit Logs Tab ──────── */}
        {activeTab === 'audit-logs' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {logsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-3">📋</div>
                <p className="text-gray-500 text-sm">No audit logs yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {logs.slice(0, 50).map((log) => (
                  <div key={log.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">
                            <span className="font-medium capitalize">{log.action.replace(/_/g, ' ')}</span>
                            {log.resource && (
                              <span className="text-gray-500"> on {log.resource}</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {log.user?.displayName || 'System'} • {log.ipAddress || 'Unknown IP'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ──────── Broadcast Tab ──────── */}
        {activeTab === 'broadcast' && (
          <div className="max-w-lg">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Send Broadcast</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                Send an announcement to all users
              </p>

              <form onSubmit={handleBroadcast} className="space-y-4">
                <div>
                  <label htmlFor="broadcastTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    id="broadcastTitle"
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. Scheduled Maintenance"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                    maxLength={200}
                  />
                </div>
                <div>
                  <label htmlFor="broadcastMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message
                  </label>
                  <textarea
                    id="broadcastMessage"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Your announcement..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    required
                    maxLength={2000}
                  />
                </div>
                <button
                  type="submit"
                  disabled={broadcasting || !broadcastTitle.trim() || !broadcastMessage.trim()}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium
                           hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors inline-flex items-center justify-center gap-2"
                >
                  {broadcasting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                      Send Broadcast
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
