import { useState, useEffect } from 'react';
import api from '../../services/api';
import { getErrorMessage } from '../../services/api';
import { BarChart, LineChart, PieChart } from '../../components/charts';
import toast from 'react-hot-toast';

interface MeetingAnalytics {
  totalMeetings: number;
  totalDuration: number;
  averageParticipants: number;
  meetingsByDay: Array<{ date: string; count: number }>;
  meetingsByStatus: Array<{ status: string; count: number }>;
}

interface UserAnalytics {
  totalUsers: number;
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
  dailyActiveUsers: Array<{ date: string; count: number }>;
}

interface FileAnalytics {
  totalFiles: number;
  totalSize: number;
  filesByType: Array<{ type: string; count: number }>;
}

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

type Period = '7d' | '30d' | '90d';

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>('30d');
  const [meetingData, setMeetingData] = useState<MeetingAnalytics | null>(null);
  const [userData, setUserData] = useState<UserAnalytics | null>(null);
  const [fileData, setFileData] = useState<FileAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const periodToDays: Record<Period, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
  };

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  async function loadAnalytics() {
    setIsLoading(true);
    try {
      const days = periodToDays[period];
      const [meetingsRes, usersRes, filesRes] = await Promise.all([
        api.get('/analytics/meetings', { params: { days } }),
        api.get('/analytics/users', { params: { days } }),
        api.get('/analytics/files', { params: { days } }),
      ]);
      setMeetingData(meetingsRes.data.data);
      setUserData(usersRes.data.data);
      setFileData(filesRes.data.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  const periodOptions: Array<{ key: Period; label: string }> = [
    { key: '7d', label: 'Last 7 days' },
    { key: '30d', label: 'Last 30 days' },
    { key: '90d', label: 'Last 90 days' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Platform usage metrics and insights
            </p>
          </div>
          <div className="flex gap-2">
            {periodOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setPeriod(opt.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  period === opt.key
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ──────── Meeting Stats ──────── */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Meetings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Meetings', value: meetingData?.totalMeetings ?? 0, change: '+12%', color: 'text-indigo-600' },
              { label: 'Total Duration', value: formatDuration(meetingData?.totalDuration ?? 0), change: '+8%', color: 'text-blue-600' },
              { label: 'Avg Participants', value: meetingData?.averageParticipants?.toFixed(1) ?? '0', change: '+5%', color: 'text-green-600' },
              { label: 'This Period', value: `${period}`, change: '', color: 'text-gray-500' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                {stat.change && (
                  <p className={`text-xs mt-1 ${stat.color}`}>{stat.change}</p>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Meetings by Day (BarChart) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Meetings by Day</h3>
              {meetingData?.meetingsByDay && meetingData.meetingsByDay.length > 0 ? (
                <BarChart
                  data={meetingData.meetingsByDay.slice(-14).map((d, i) => ({
                    label: new Date(d.date).getDate().toString(),
                    value: d.count,
                    color: CHART_COLORS[i % CHART_COLORS.length],
                  }))}
                  height={200}
                  showValues
                />
              ) : (
                <div className="h-48 flex items-center justify-center">
                  <p className="text-sm text-gray-400">No data available</p>
                </div>
              )}
            </div>

            {/* Meetings by Status (PieChart) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Meetings by Status</h3>
              {meetingData?.meetingsByStatus && meetingData.meetingsByStatus.length > 0 ? (
                <PieChart
                  data={meetingData.meetingsByStatus.map((s, i) => ({
                    label: s.status,
                    value: s.count,
                    color: CHART_COLORS[i % CHART_COLORS.length],
                  }))}
                  size={180}
                  showLegend
                />
              ) : (
                <div className="h-48 flex items-center justify-center">
                  <p className="text-sm text-gray-400">No data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ──────── User Stats ──────── */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Users</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Users', value: userData?.totalUsers ?? 0, change: '+15%' },
              { label: 'Active Today', value: userData?.activeToday ?? 0, change: '' },
              { label: 'Active This Week', value: userData?.activeThisWeek ?? 0, change: '' },
              { label: 'Active This Month', value: userData?.activeThisMonth ?? 0, change: '+23%' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                {stat.change && <p className="text-xs text-green-600 mt-1">{stat.change}</p>}
              </div>
            ))}
          </div>

          {userData?.dailyActiveUsers && userData.dailyActiveUsers.length > 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Daily Active Users</h3>
              <LineChart
                data={userData.dailyActiveUsers.slice(-14).map((d) => ({
                  x: `${new Date(d.date).getMonth() + 1}/${new Date(d.date).getDate()}`,
                  y: d.count,
                }))}
                height={200}
                width={600}
                color="#6366f1"
                showGrid
              />
            </div>
          )}
        </div>

        {/* ──────── File Stats ──────── */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Files & Storage</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* File Counts */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Files by Type</h3>
                <span className="text-sm text-gray-500">
                  {fileData?.totalFiles ?? 0} files • {formatBytes(fileData?.totalSize ?? 0)}
                </span>
              </div>
              {fileData?.filesByType && fileData.filesByType.length > 0 ? (
                <PieChart
                  data={fileData.filesByType.map((f, i) => ({
                    label: f.type,
                    value: f.count,
                    color: CHART_COLORS[i % CHART_COLORS.length],
                  }))}
                  size={180}
                  showLegend
                />
              ) : (
                <div className="h-48 flex items-center justify-center">
                  <p className="text-sm text-gray-400">No file data</p>
                </div>
              )}
            </div>

            {/* Call Quality */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Call Quality Metrics</h3>
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Call quality data will appear once meetings are recorded
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
