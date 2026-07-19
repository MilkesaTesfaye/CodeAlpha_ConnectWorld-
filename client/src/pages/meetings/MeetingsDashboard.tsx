import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getErrorMessage } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { Meeting, MeetingStatus } from '../../types/meeting';
import toast from 'react-hot-toast';

type TabType = 'active' | 'scheduled' | 'all';

export default function MeetingsDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  useEffect(() => {
    fetchMeetings();
  }, [activeTab]);

  async function fetchMeetings() {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeTab === 'active') params.status = 'LIVE';
      else if (activeTab === 'scheduled') params.status = 'SCHEDULED';

      const { data } = await api.get('/meetings', { params });
      setMeetings(data.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoinMeeting() {
    const code = joinCode.trim();
    if (!code) return;

    try {
      const { data } = await api.post(`/meetings/${code}/join`, {});
      if (data.success) {
        toast.success('Joined meeting');
        navigate(`/meetings/${data.data.meetingId}`);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
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
        {status === 'LIVE' && (
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1.5" />
        )}
        {status}
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meetings</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Create, join, and manage your meetings
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Join Meeting */}
              {showJoinInput ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter meeting code..."
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinMeeting()}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    autoFocus
                  />
                  <button
                    onClick={handleJoinMeeting}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium
                             hover:bg-indigo-700 transition-colors"
                  >
                    Join
                  </button>
                  <button
                    onClick={() => { setShowJoinInput(false); setJoinCode(''); }}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowJoinInput(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 
                           rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300
                           bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 
                           transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Join Meeting
                </button>
              )}

              {/* Create Meeting */}
              <Link
                to="/meetings/create"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg 
                         text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Meeting
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6 border-b border-gray-200 dark:border-gray-700">
            {[
              { key: 'active' as TabType, label: 'Active', icon: '📡' },
              { key: 'scheduled' as TabType, label: 'Scheduled', icon: '📅' },
              { key: 'all' as TabType, label: 'All Meetings', icon: '📋' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">
              {activeTab === 'active' ? '📡' : activeTab === 'scheduled' ? '📅' : '📋'}
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {activeTab === 'active'
                ? 'No active meetings'
                : activeTab === 'scheduled'
                ? 'No scheduled meetings'
                : 'No meetings yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {activeTab === 'active'
                ? 'Join a meeting or create a new one to get started'
                : 'Create a scheduled meeting to see it here'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowJoinInput(true)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         text-sm font-medium text-gray-700 dark:text-gray-300
                         hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Join a Meeting
              </button>
              <Link
                to="/meetings/create"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium
                         hover:bg-indigo-700 transition-colors"
              >
                Create Meeting
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 
                         p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(meeting.status)}
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                        {meeting.meetingId}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {meeting.title}
                    </h3>
                    {meeting.description && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {meeting.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {meeting.participantCount}
                      </span>
                      {meeting.scheduledAt && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(meeting.scheduledAt).toLocaleDateString()}
                        </span>
                      )}
                      {meeting.hasPassword && (
                        <span className="flex items-center gap-1 text-amber-500">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Password
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {meeting.status === 'LIVE' && (
                      <Link
                        to={`/meetings/${meeting.meetingId}`}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium
                                 hover:bg-green-700 transition-colors"
                      >
                        Join Now
                      </Link>
                    )}
                    {meeting.status === 'SCHEDULED' && (
                      <Link
                        to={`/meetings/${meeting.meetingId}`}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium
                                 hover:bg-indigo-700 transition-colors"
                      >
                        View
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
