import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api, { getErrorMessage } from '../services/api';
import UserMenu from '../components/layout/UserMenu';
import ThemeToggle from '../components/theme/ThemeToggle';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import RoleBadge from '../components/common/RoleBadge';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalMeetings: number;
  upcomingMeetings: number;
  completedMeetings: number;
  totalParticipants: number;
  averageDuration: number;
  meetingsByDay: Array<{ date: string; count: number }>;
  meetingsByStatus: Array<{ status: string; count: number }>;
  recentMeetings: Array<{
    id: string;
    title: string;
    meetingId: string;
    status: string;
    scheduledAt?: string;
    startedAt?: string;
    endedAt?: string;
    createdAt: string;
  }>;
}

const quickActions = [
  {
    title: 'New Meeting',
    description: 'Start an instant meeting',
    icon: '🎥',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'shadow-glow-brand',
    onClick: (navigate: any) => navigate('/meetings/create'),
  },
  {
    title: 'Join Meeting',
    description: 'Enter a meeting code',
    icon: '🔗',
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'shadow-glow-neon',
    onClick: (navigate: any) => navigate('/meetings'),
  },
  {
    title: 'Schedule',
    description: 'Plan a future meeting',
    icon: '📅',
    gradient: 'from-emerald-500 to-teal-500',
    glow: 'shadow-glow-neon',
    onClick: (navigate: any) => navigate('/meetings/create'),
  },
  {
    title: 'History',
    description: 'View past meetings',
    icon: '📋',
    gradient: 'from-orange-500 to-amber-500',
    glow: 'shadow-glow-sunset',
    onClick: (navigate: any) => navigate('/meetings/history'),
  },
];

function getStatusBadge(status: string) {
  const config: Record<string, { variant: 'success' | 'info' | 'default' | 'danger'; dot: boolean }> = {
    LIVE: { variant: 'success', dot: true },
    SCHEDULED: { variant: 'info', dot: false },
    ENDED: { variant: 'default', dot: false },
    CANCELLED: { variant: 'danger', dot: false },
  };
  const c = config[status] || { variant: 'default' as const, dot: false };
  return (
    <Badge variant={c.variant} dot={c.dot} size="sm" glow={status === 'LIVE'}>
      {status}
    </Badge>
  );
}

const statCards = [
  { key: 'totalMeetings', label: 'Total Meetings', icon: '📊', gradient: 'from-brand-500 to-primary-600' },
  { key: 'upcomingMeetings', label: 'Upcoming', icon: '📅', gradient: 'from-neon-500 to-cyan-600' },
  { key: 'completedMeetings', label: 'Completed', icon: '✅', gradient: 'from-emerald-500 to-teal-600' },
  { key: 'averageDuration', label: 'Avg Duration', icon: '⏱️', gradient: 'from-accent-500 to-rose-600' },
];

function formatDuration(minutes: number): string {
  if (minutes > 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${minutes}m`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const { data } = await api.get('/dashboard/stats');
      setStats(data.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  function handleJoin() {
    if (joinCode.trim()) {
      navigate(`/meetings/${joinCode.trim()}`);
    } else {
      navigate('/meetings');
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-strong border-b border-dark-200/50 dark:border-dark-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center shadow-glow-brand">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-dark-900 dark:text-white">Dashboard</h1>
              <p className="text-xs text-dark-400">Welcome back, {user?.displayName || 'User'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle variant="glass" />
            {user && <UserMenu />}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <button
              key={action.title}
              onClick={() => action.onClick(navigate)}
              className="group relative overflow-hidden p-6 rounded-2xl bg-white dark:bg-dark-800 border border-dark-200/50 dark:border-dark-700/50 hover:shadow-xl transition-all duration-300 text-left hover:-translate-y-0.5"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300`} />
              {/* Shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
              </div>
              <div className="relative">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 shadow-lg ${action.glow} group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-xl">{action.icon}</span>
                </div>
                <h3 className="font-bold text-dark-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-dark-500 dark:text-dark-400">{action.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Welcome + Join Card */}
        <Card variant="gradient" padding="lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">
                Welcome{user?.displayName ? `, ${user.displayName}` : ''}! 👋
              </h2>
              <p className="text-dark-500 dark:text-dark-400 max-w-xl">
                You're all set to start collaborating. Create a new meeting, join one with a code, or schedule something for later.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter meeting code"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  className="w-full px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
                />
              </div>
              <Button variant="gradient-brand" size="md" glow onClick={handleJoin}>
                Join
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        {!isLoading && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, i) => {
              const value = stats[stat.key as keyof DashboardStats];
              const displayValue = stat.key === 'averageDuration'
                ? formatDuration(value as number)
                : String(value);

              return (
                <div
                  key={stat.key}
                  className="relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-dark-800 border border-dark-200/50 dark:border-dark-700/50 shadow-soft hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-lg">{stat.icon}</span>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-dark-900 dark:text-white mb-1">{displayValue}</p>
                  <p className="text-sm text-dark-500 dark:text-dark-400">{stat.label}</p>
                  {/* Decorative gradient bar */}
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.gradient} opacity-50`} />
                </div>
              );
            })}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" variant="gradient" />
          </div>
        )}

        {/* Bottom Grid: Recent Meetings, Upcoming, Account */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Meetings */}
          <Card variant="elevated" padding="md" className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-dark-900 dark:text-white">Recent Meetings</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/meetings/history')}>
                View all
              </Button>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner variant="gradient" />
              </div>
            ) : stats?.recentMeetings && stats.recentMeetings.length > 0 ? (
              <div className="space-y-2">
                {stats.recentMeetings.slice(0, 5).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => navigate(`/meetings/${m.meetingId}`)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-dark-50 dark:hover:bg-dark-800/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-sm font-medium text-dark-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {m.title}
                        </p>
                        <p className="text-xs text-dark-400">
                          {new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(m.status)}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-dark-400 text-sm">No recent meetings</p>
                <Button
                  variant="gradient-brand"
                  size="sm"
                  className="mt-3"
                  glow
                  onClick={() => navigate('/meetings/create')}
                >
                  Create your first meeting
                </Button>
              </div>
            )}
          </Card>

          {/* Upcoming + Account Status */}
          <div className="space-y-6">
            <Card variant="gradient" padding="md">
              <h3 className="font-bold text-dark-900 dark:text-white mb-4">Upcoming</h3>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner variant="gradient" />
                </div>
              ) : stats && stats.upcomingMeetings > 0 ? (
                <div className="text-center py-4">
                  <p className="text-4xl font-bold gradient-text-brand">{stats.upcomingMeetings}</p>
                  <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">scheduled meetings ahead</p>
                  <Button
                    variant="outline-brand"
                    size="sm"
                    className="mt-4"
                    onClick={() => navigate('/meetings')}
                  >
                    View schedule
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-dark-400 text-sm">No scheduled meetings</p>
                  <Button
                    variant="gradient-brand"
                    size="sm"
                    className="mt-3"
                    glow
                    onClick={() => navigate('/meetings/create')}
                  >
                    Schedule one
                  </Button>
                </div>
              )}
            </Card>

            <Card variant="elevated" padding="md">
              <h3 className="font-bold text-dark-900 dark:text-white mb-4">Account</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-dark-100 dark:border-dark-700/50">
                  <span className="text-sm text-dark-500">Email verified</span>
                  <Badge variant={user?.isEmailVerified ? 'success' : 'warning'} dot size="sm">
                    {user?.isEmailVerified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-dark-100 dark:border-dark-700/50">
                  <span className="text-sm text-dark-500">Role</span>
                  {user?.role ? <RoleBadge role={user.role} size="sm" showIcon /> : null}
                </div>
                {stats && (
                  <>
                    <div className="flex items-center justify-between py-2 border-b border-dark-100 dark:border-dark-700/50">
                      <span className="text-sm text-dark-500">Participants</span>
                      <span className="text-sm font-semibold text-dark-900 dark:text-white">{stats.totalParticipants}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-dark-500">Meetings</span>
                      <span className="text-sm font-semibold text-dark-900 dark:text-white">{stats.totalMeetings}</span>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
