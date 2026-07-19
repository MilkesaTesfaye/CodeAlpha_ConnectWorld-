import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { getErrorMessage } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { Meeting, MeetingParticipant, ParticipantRole, ParticipantStatus, UpdateMeetingInput } from '../../types/meeting';
import toast from 'react-hot-toast';
import ShareButtons from '../../components/sharing/ShareButtons';

type DetailTab = 'participants' | 'waiting' | 'invite' | 'settings';

export default function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>('participants');
  const [showJoinPassword, setShowJoinPassword] = useState(false);
  const [joinPassword, setJoinPassword] = useState('');

  // Invite form
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteRole, setInviteRole] = useState<'PARTICIPANT' | 'CO_HOST' | 'PRESENTER'>('PARTICIPANT');
  const [isInviting, setIsInviting] = useState(false);

  // Settings form
  const [settings, setSettings] = useState<UpdateMeetingInput>({});
  const [isSaving, setIsSaving] = useState(false);

  // Join loading
  const [isJoining, setIsJoining] = useState(false);

  // Share panel
  const [showSharePanel, setShowSharePanel] = useState(false);

  // Confirm dialogs
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMeeting = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await api.get(`/meetings/${id}`);
      setMeeting(data.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
      navigate('/meetings');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  // Reset settings form when tab opens
  useEffect(() => {
    if (activeTab === 'settings') {
      setSettings({});
    }
  }, [activeTab]);

  // ─── Derived State ─────────────────────────────────────────────────────

  const isHost = meeting?.hostId === user?.id;
  const participants = meeting?.participants || [];
  const joinedParticipants = participants.filter((p) => p.status === 'JOINED');
  const waitingParticipants = participants.filter((p) => p.status === 'INVITED' && !isHost);
  const myParticipation = participants.find((p) => p.userId === user?.id);

  const canJoin = meeting && meeting.status !== 'ENDED' && meeting.status !== 'CANCELLED' && !myParticipation;
  const hasJoined = myParticipation?.status === 'JOINED';
  const isInWaitingRoom = myParticipation?.status === 'INVITED';

  // ─── Actions ───────────────────────────────────────────────────────────

  async function handleJoin() {
    if (!meeting) return;
    setIsJoining(true);
    try {
      const payload: { password?: string } = {};
      if (meeting.hasPassword && joinPassword) {
        payload.password = joinPassword;
      }
      const { data } = await api.post(`/meetings/${meeting.meetingId}/join`, payload);
      if (data.success) {
        toast.success('Joined meeting');
        setMeeting(data.data);
        setShowJoinPassword(false);
        setJoinPassword('');
      }
    } catch (error: any) {
      const msg = getErrorMessage(error);
      if (msg.toLowerCase().includes('password')) {
        setShowJoinPassword(true);
      }
      toast.error(msg);
    } finally {
      setIsJoining(false);
    }
  }

  async function handleLeave() {
    if (!meeting) return;
    try {
      await api.post(`/meetings/${meeting.meetingId}/leave`);
      toast.success('Left meeting');
      fetchMeeting();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleAdmit(participantId: string) {
    if (!meeting) return;
    try {
      await api.post(`/meetings/${meeting.meetingId}/admit/${participantId}`);
      toast.success('Participant admitted');
      fetchMeeting();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleRemoveParticipant(participantId: string) {
    if (!meeting) return;
    try {
      await api.delete(`/meetings/${meeting.meetingId}/participants/${participantId}`);
      toast.success('Participant removed');
      fetchMeeting();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!meeting) return;
    setIsInviting(true);
    try {
      const emails = inviteEmails
        .split(/[,;\n]/)
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      const { data } = await api.post(`/meetings/${meeting.meetingId}/invite`, {
        emails,
        role: inviteRole,
        message: inviteMessage || null,
      });
      toast.success(`${data.data.totalInvited} participant(s) invited`);
      setInviteEmails('');
      setInviteMessage('');
      fetchMeeting();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsInviting(false);
    }
  }

  async function handleUpdateStatus(status: 'LIVE' | 'ENDED' | 'CANCELLED') {
    if (!meeting) return;
    try {
      const { data } = await api.patch(`/meetings/${meeting.meetingId}/status`, { status });
      toast.success(`Meeting ${status.toLowerCase()}`);
      setMeeting(data.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleUpdateSettings() {
    if (!meeting) return;
    setIsSaving(true);
    try {
      const { data } = await api.patch(`/meetings/${meeting.meetingId}`, settings);
      toast.success('Meeting settings updated');
      setMeeting(data.data);
      setActiveTab('participants');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!meeting) return;
    setIsDeleting(true);
    try {
      await api.delete(`/meetings/${meeting.meetingId}`);
      toast.success('Meeting deleted');
      navigate('/meetings');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      LIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      ENDED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || ''}`}>
        {status === 'LIVE' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1.5" />}
        {status}
      </span>
    );
  }

  function getRoleBadge(role: ParticipantRole) {
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

  function getStatusIcon(status: ParticipantStatus) {
    switch (status) {
      case 'JOINED': return <span className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'INVITED': return <span className="w-2 h-2 bg-yellow-400 rounded-full" />;
      case 'LEFT': return <span className="w-2 h-2 bg-gray-400 rounded-full" />;
      case 'REMOVED': return <span className="w-2 h-2 bg-red-500 rounded-full" />;
      default: return null;
    }
  }

  const tabs: Array<{ key: DetailTab; label: string; icon: string; count?: number }> = [
    { key: 'participants', label: 'Participants', icon: '👥', count: joinedParticipants.length },
    ...(isHost && waitingParticipants.length > 0 ? [{ key: 'waiting' as DetailTab, label: 'Waiting Room', icon: '⏳', count: waitingParticipants.length }] : []),
    ...(isHost ? [{ key: 'invite' as DetailTab, label: 'Invite', icon: '✉️' }] : []),
    ...(isHost ? [{ key: 'settings' as DetailTab, label: 'Settings', icon: '⚙️' }] : []),
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!meeting) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => navigate('/meetings')}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-gray-400 dark:text-gray-500 text-sm">Back to Meetings</span>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                {getStatusBadge(meeting.status)}
                <span className="text-sm text-gray-400 dark:text-gray-500 font-mono">
                  ID: {meeting.meetingId}
                </span>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/meetings/${meeting.meetingId}`;
                    navigator.clipboard.writeText(url);
                    toast.success('Meeting link copied!');
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium
                           text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30
                           hover:bg-indigo-100 dark:hover:bg-indigo-900/50
                           rounded-lg transition-colors"
                  title="Copy meeting link"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Copy Link
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(meeting.meetingId);
                    toast.success('Meeting ID copied!');
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium
                           text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700
                           hover:bg-gray-200 dark:hover:bg-gray-600
                           rounded-lg transition-colors font-mono"
                  title="Copy meeting ID code"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy ID
                </button>
                <button
                  onClick={() => setShowSharePanel(!showSharePanel)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium
                           rounded-lg transition-colors ${
                    showSharePanel
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                      : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title="Share meeting"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  {showSharePanel ? 'Close' : 'Share'}
                </button>
                {meeting.hasPassword && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-500">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Password protected
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                {meeting.title}
              </h1>
              {meeting.description && (
                <p className="mt-1 text-gray-500 dark:text-gray-400">{meeting.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    {meeting.host.displayName?.charAt(0)?.toUpperCase() || 'H'}
                  </div>
                  {meeting.host.displayName || 'Host'}
                  {isHost && <span className="text-xs text-indigo-500">(you)</span>}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {joinedParticipants.length} / {meeting.maxParticipants}
                </span>
                {meeting.scheduledAt && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(meeting.scheduledAt).toLocaleDateString(undefined, {
                      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                )}
                {meeting.startedAt && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Started {new Date(meeting.startedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>

              {/* Share Panel (toggleable) */}
              {showSharePanel && meeting && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <ShareButtons meetingId={meeting.meetingId} theme="light" size="sm" showHeading={false} />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-6 shrink-0 flex-wrap justify-end">
              {/* Join with Video */}
              {(canJoin || hasJoined) && meeting.status !== 'ENDED' && meeting.status !== 'CANCELLED' && (
                <Link
                  to={`/meetings/${meeting.meetingId}/room`}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium
                           hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Join with Video
                </Link>
              )}

              {/* Join / Leave / In Waiting Room */}
              {canJoin && meeting.status === 'LIVE' && (
                <button
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300
                           rounded-lg text-sm font-medium
                           hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors inline-flex items-center gap-2"
                >
                  {isJoining ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  )}
                  {isJoining ? 'Joining...' : 'Join without Video'}
                </button>
              )}
              {showJoinPassword && canJoin && (
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="Meeting password..."
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-green-500 focus:border-transparent w-40"
                    autoFocus
                  />
                  <button
                    onClick={handleJoin}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium
                             hover:bg-green-700 transition-colors"
                  >
                    Submit
                  </button>
                </div>
              )}
              {isInWaitingRoom && (
                <span className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400
                                rounded-lg text-sm font-medium">
                  Waiting for host to admit you...
                </span>
              )}
              {hasJoined && (
                <button
                  onClick={handleLeave}
                  className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400
                           rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Leave Meeting
                </button>
              )}

              {/* Host Controls */}
              {isHost && meeting.status === 'SCHEDULED' && (
                <button
                  onClick={() => handleUpdateStatus('LIVE')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium
                           hover:bg-green-700 transition-colors"
                >
                  Start Now
                </button>
              )}
              {isHost && meeting.status === 'LIVE' && (
                <button
                  onClick={() => handleUpdateStatus('ENDED')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium
                           hover:bg-red-700 transition-colors"
                >
                  End Meeting
                </button>
              )}
              {isHost && (meeting.status === 'SCHEDULED' || meeting.status === 'LIVE') && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400
                           rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 pt-2 text-sm font-medium border-b-2 transition-colors relative ${
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {participants.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-3">👥</div>
                <p className="text-gray-500 dark:text-gray-400">No participants yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300 shrink-0">
                          {p.user.displayName?.charAt(0)?.toUpperCase() || '?'}
                          {p.user.avatarUrl && (
                            <img
                              src={p.user.avatarUrl}
                              alt=""
                              className="absolute inset-0 w-10 h-10 rounded-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          )}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5">
                          {getStatusIcon(p.status)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {p.user.displayName || 'Unknown'}
                          </span>
                          {getRoleBadge(p.role)}
                          {p.userId === user?.id && (
                            <span className="text-xs text-gray-400">(you)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {p.status === 'JOINED' && p.joinedAt
                            ? `Joined ${new Date(p.joinedAt).toLocaleTimeString()}`
                            : p.status === 'INVITED'
                            ? 'Waiting for admission'
                            : p.status === 'LEFT'
                            ? 'Left'
                            : p.status === 'REMOVED'
                            ? 'Removed'
                            : 'Invited'}
                        </div>
                      </div>
                    </div>
                    {isHost && p.userId !== user?.id && p.role !== 'HOST' && (
                      <button
                        onClick={() => handleRemoveParticipant(p.userId)}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400
                                 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Waiting Room Tab */}
        {activeTab === 'waiting' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {waitingParticipants.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-3">⏳</div>
                <p className="text-gray-500 dark:text-gray-400">No one is waiting</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {waitingParticipants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center text-sm font-medium text-yellow-600 dark:text-yellow-400">
                        {p.user.displayName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {p.user.displayName || 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAdmit(p.userId)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium
                                 hover:bg-green-700 transition-colors"
                      >
                        Admit
                      </button>
                      <button
                        onClick={() => handleRemoveParticipant(p.userId)}
                        className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400
                                 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Invite Tab */}
        {activeTab === 'invite' && (
          <div className="max-w-lg">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Invite Participants</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                Enter email addresses to invite people to this meeting
              </p>

              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Addresses
                  </label>
                  <textarea
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                    placeholder="john@example.com, jane@example.com"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             placeholder-gray-400 dark:placeholder-gray-500
                             focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Separate multiple emails with commas, semicolons, or new lines
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="PARTICIPANT">Participant</option>
                    <option value="PRESENTER">Presenter</option>
                    <option value="CO_HOST">Co-Host</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Invitation Message <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="e.g. 'Please join our team standup'"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             placeholder-gray-400 dark:placeholder-gray-500
                             focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    maxLength={500}
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isInviting || !inviteEmails.trim()}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium
                             hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                             transition-colors inline-flex items-center gap-2"
                  >
                    {isInviting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Inviting...
                      </>
                    ) : (
                      'Send Invitations'
                    )}
                  </button>
                  <div className="text-sm text-gray-400">
                    Also share this code: <span className="font-mono font-medium text-gray-600 dark:text-gray-300">{meeting.meetingId}</span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Settings Tab (host only) */}
        {activeTab === 'settings' && isHost && (
          <div className="max-w-lg">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Meeting Settings</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                Update meeting details and options
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    defaultValue={meeting.title}
                    onChange={(e) => setSettings((s) => ({ ...s, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    defaultValue={meeting.description || ''}
                    onChange={(e) => setSettings((s) => ({ ...s, description: e.target.value || null }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      defaultValue={meeting.maxParticipants}
                      onChange={(e) => setSettings((s) => ({ ...s, maxParticipants: parseInt(e.target.value) || 100 }))}
                      min={1}
                      max={1000}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      New Password <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="password"
                      placeholder={meeting.hasPassword ? 'Change password' : 'Set a password'}
                      onChange={(e) => setSettings((s) => ({ ...s, password: e.target.value || null }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               placeholder-gray-400 dark:placeholder-gray-500
                               focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Waiting Room</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={meeting.hasWaitingRoom}
                        onChange={(e) => setSettings((s) => ({ ...s, hasWaitingRoom: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4
                                    peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800
                                    rounded-full peer dark:bg-gray-700
                                    peer-checked:after:translate-x-full peer-checked:after:border-white
                                    after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                    after:bg-white after:border-gray-300 after:border after:rounded-full
                                    after:h-5 after:w-5 after:transition-all
                                    peer-checked:bg-indigo-600" />
                    </label>
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Lock Meeting</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={meeting.isLocked}
                        onChange={(e) => setSettings((s) => ({ ...s, isLocked: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4
                                    peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800
                                    rounded-full peer dark:bg-gray-700
                                    peer-checked:after:translate-x-full peer-checked:after:border-white
                                    after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                    after:bg-white after:border-gray-300 after:border after:rounded-full
                                    after:h-5 after:w-5 after:transition-all
                                    peer-checked:bg-indigo-600" />
                    </label>
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Allow Recording</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={meeting.recordingEnabled}
                        onChange={(e) => setSettings((s) => ({ ...s, recordingEnabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4
                                    peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800
                                    rounded-full peer dark:bg-gray-700
                                    peer-checked:after:translate-x-full peer-checked:after:border-white
                                    after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                    after:bg-white after:border-gray-300 after:border after:rounded-full
                                    after:h-5 after:w-5 after:transition-all
                                    peer-checked:bg-indigo-600" />
                    </label>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setActiveTab('participants')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                             hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateSettings}
                    disabled={isSaving}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium
                             hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                             transition-colors inline-flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="text-3xl mb-3">🗑️</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Cancel Meeting?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                This will cancel "{meeting.title}" and notify all participants. This action cannot be undone.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                           hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Keep Meeting
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium
                           hover:bg-red-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Cancelling...
                    </>
                  ) : (
                    'Yes, Cancel Meeting'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
