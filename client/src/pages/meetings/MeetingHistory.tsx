import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getErrorMessage } from '../../services/api';
import type { MeetingHistoryItem, MeetingStatus } from '../../types/meeting';
import toast from 'react-hot-toast';

export default function MeetingHistory() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<MeetingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ENDED' | 'CANCELLED'>('all');

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setIsLoading(true);
    try {
      const { data } = await api.get('/meetings/history', { params: { limit: 50 } });
      setMeetings(data.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  const filteredMeetings = meetings.filter((meeting) => {
    const matchesSearch =
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.meetingId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || meeting.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  function getDuration(meeting: MeetingHistoryItem): string {
    if (!meeting.startedAt || !meeting.endedAt) return 'N/A';
    const start = new Date(meeting.startedAt);
    const end = new Date(meeting.endedAt);
    const diffMs = end.getTime() - start.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return '< 1 min';
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return `${hours}h ${remaining}m`;
  }

  function getStatusBadge(status: MeetingStatus) {
    const styles: Record<MeetingStatus, string> = {
      LIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      ENDED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  }

  function getRoleBadge(role: string) {
    const styles: Record<string, string> = {
      HOST: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      CO_HOST: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      PRESENTER: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      PARTICIPANT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[role] || ''}`}>
        {role}
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/meetings')}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meeting History</h1>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 ml-9">
                View your past meetings, durations, and participation
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-3 mt-4">
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" 
                   fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search meetings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         placeholder-gray-400 dark:placeholder-gray-500
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex gap-2">
              {[
                { key: 'all' as const, label: 'All' },
                { key: 'ENDED' as const, label: 'Ended' },
                { key: 'CANCELLED' as const, label: 'Cancelled' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === filter.key
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery || statusFilter !== 'all' ? 'No matching meetings' : 'No meeting history yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Your past meetings will appear here after you host or join one'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Meeting
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Participants
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredMeetings.map((meeting) => (
                    <tr key={meeting.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {meeting.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                            {meeting.meetingId}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(meeting.status)}</td>
                      <td className="px-6 py-4">{getRoleBadge(meeting.myRole)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {getDuration(meeting)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {meeting.participantCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {meeting.startedAt
                          ? new Date(meeting.startedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : meeting.createdAt
                          ? new Date(meeting.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/meetings/${meeting.meetingId}`}
                          className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 
                                   dark:hover:text-indigo-300 font-medium"
                        >
                          Details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
