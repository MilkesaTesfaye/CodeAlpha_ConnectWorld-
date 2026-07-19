import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { connectSocket, getSocket } from '../../services/socket';
import { useWebRTC } from '../../hooks/useWebRTC';
import api from '../../services/api';
import VideoTile from '../../components/meeting/VideoTile';
import MediaControls from '../../components/meeting/MediaControls';
import ShareButtons from '../../components/sharing/ShareButtons';
import ChatSidebar from '../../components/chat/ChatSidebar';
import WhiteboardCanvas from '../../components/whiteboard/WhiteboardCanvas';
import toast from 'react-hot-toast';

type SidePanel = 'none' | 'chat' | 'whiteboard' | 'participants';

export default function MeetingRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mediaInitialized, setMediaInitialized] = useState(false);
  const [sidePanel, setSidePanel] = useState<SidePanel>('none');
  const [showSharePanel, setShowSharePanel] = useState(false);

  const {
    localStream,
    localAudioEnabled,
    localVideoEnabled,
    isScreenSharing,
    participants,
    initializeMedia,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    joinMeetingRoom,
    leaveMeetingRoom,
    error: mediaError,
  } = useWebRTC({
    meetingId: id || '',
    userId: user?.id || '',
    displayName: user?.displayName,
    avatarUrl: user?.avatarUrl,
  });

  // Connect socket and initialize media on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !id) return;

    const socket = getSocket();
    if (!socket?.connected) {
      connectSocket(token);
    }

    initializeMedia().then(() => setMediaInitialized(true));

    return () => {
      leaveMeetingRoom();
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Join the meeting room once media is initialized
  useEffect(() => {
    if (mediaInitialized && localStream) {
      joinMeetingRoom();
    }
  }, [mediaInitialized, localStream]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show media error
  useEffect(() => {
    if (mediaError) {
      toast.error(mediaError);
    }
  }, [mediaError]);

  const handleLeave = useCallback(async () => {
    // Call backend leave endpoint first
    try {
      await api.post(`/meetings/${id}/leave`);
    } catch {
      // Non-critical — user will still be disconnected locally
    }
    // Disconnect WebRTC and socket
    leaveMeetingRoom();
    navigate(`/meetings/${id}`);
  }, [leaveMeetingRoom, navigate, id]);

  // Build participant list for display (local + remote)
  const allParticipants = [
    // Local user first
    ...(localStream
      ? [
          {
            userId: user?.id || 'local',
            socketId: 'local',
            displayName: user?.displayName || 'You',
            avatarUrl: user?.avatarUrl || null,
            stream: localStream,
            isAudioEnabled: localAudioEnabled,
            isVideoEnabled: localVideoEnabled,
            isScreenSharing,
            connectionState: 'connected' as const,
          },
        ]
      : []),
    // Remote participants
    ...participants.map((p) => ({
      ...p,
      displayName: p.displayName || undefined,
      avatarUrl: p.avatarUrl || null,
    })),
  ];

  // Calculate grid layout based on participant count
  const gridCols = allParticipants.length <= 2 ? 2 : allParticipants.length <= 4 ? 2 : allParticipants.length <= 6 ? 3 : 4;

  // Toggle buttons for side panels
  const panelButtons = [
    {
      key: 'participants' as SidePanel,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: `Participants (${allParticipants.length})`,
      badge: allParticipants.length,
    },
    {
      key: 'chat' as SidePanel,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      label: 'Chat',
    },
    {
      key: 'whiteboard' as SidePanel,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      label: 'Whiteboard',
    },
  ];

  return (
    <div className="h-screen bg-gray-950 flex flex-col">
      {/* Top Bar */}
      <div className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm text-white font-medium truncate max-w-[200px]">
            Meeting Room
          </span>
          {id && (
            <span className="text-xs text-gray-500 font-mono">ID: {id}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Side panel buttons */}
          {panelButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setSidePanel(sidePanel === btn.key ? 'none' : btn.key)}
              className={`p-2 rounded-lg transition-colors relative ${
                sidePanel === btn.key
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
              title={btn.label}
            >
              {btn.icon}
              {btn.badge !== undefined && btn.badge > 0 && (
                <span className={`absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center ${
                  sidePanel === btn.key ? 'bg-white text-indigo-600' : 'bg-indigo-500 text-white'
                }`}>
                  {btn.badge}
                </span>
              )}
            </button>
          ))}

          {/* Share button */}
          <button
            onClick={() => setShowSharePanel(!showSharePanel)}
            className={`p-2 rounded-lg transition-colors ${
              showSharePanel
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
            title="Share meeting"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Share Panel (collapsible) */}
      {showSharePanel && id && (
        <div className="bg-gray-900/90 backdrop-blur-md border-b border-gray-800 px-4 py-3">
          <ShareButtons meetingId={id} theme="dark" size="sm" showHeading />
        </div>
      )}

      {/* Connection Status Bar */}
      {!mediaInitialized && (
        <div className="bg-indigo-600/20 backdrop-blur-sm px-4 py-2 text-center">
          <span className="text-sm text-indigo-300">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-400 inline-block mr-2 align-middle" />
            Initializing camera and microphone...
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid Area */}
        <div className="flex-1 overflow-y-auto p-4 min-w-0">
          {allParticipants.length === 0 && mediaInitialized ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">📹</div>
                <h2 className="text-xl font-semibold text-gray-300 mb-2">Waiting for others to join...</h2>
                <p className="text-gray-500">Share the meeting code to invite participants</p>
                {id && (
                  <div className="mt-6 space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-400">Meeting Code:</span>
                      <span className="text-sm font-mono text-indigo-400 font-medium select-all">{id}</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(id); toast.success('Code copied!'); }}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                        title="Copy meeting code"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    <ShareButtons meetingId={id} theme="dark" showHeading />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              className="grid gap-3 h-full auto-rows-fr"
              style={{
                gridTemplateColumns: `repeat(${Math.min(gridCols, allParticipants.length)}, minmax(0, 1fr))`,
              }}
            >
              {allParticipants.map((p, index) => (
                <div key={p.socketId || `local-${index}`} className="min-h-0">
                  <VideoTile
                    participant={p}
                    isLocal={p.socketId === 'local'}
                    isAudioEnabled={p.isAudioEnabled}
                    isVideoEnabled={p.isVideoEnabled}
                    isScreenSharing={p.isScreenSharing}
                    displayName={p.displayName}
                    avatarUrl={p.avatarUrl}
                    stream={p.stream}
                    connectionState={p.connectionState}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Participants Panel */}
        {sidePanel === 'participants' && (
          <div className="w-72 bg-gray-900/95 backdrop-blur-md border-l border-gray-800 overflow-y-auto shrink-0">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Participants ({allParticipants.length})
              </h3>
              <button
                onClick={() => setSidePanel('none')}
                className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="divide-y divide-gray-800">
              {allParticipants.map((p) => (
                <div key={p.socketId} className="px-4 py-3 flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-300">
                      {p.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    {p.isAudioEnabled ? (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-900" />
                    ) : (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-900" />
                    )}
                  </div>
                  <span className="text-sm text-gray-300 truncate flex-1">
                    {p.displayName || 'Unknown'}
                    {p.socketId === 'local' && (
                      <span className="text-xs text-gray-500 ml-1">(you)</span>
                    )}
                  </span>
                  {p.isScreenSharing && (
                    <span className="text-xs text-indigo-400" title="Screen sharing">🖥️</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Panel */}
        {sidePanel === 'chat' && id && (
          <ChatSidebar
            meetingId={id}
            isOpen={true}
            onClose={() => setSidePanel('none')}
          />
        )}

        {/* Whiteboard Panel */}
        {sidePanel === 'whiteboard' && id && (
          <WhiteboardCanvas
            meetingId={id}
            isOpen={true}
            onClose={() => setSidePanel('none')}
          />
        )}
      </div>

      {/* Media Controls */}
      <MediaControls
        isAudioEnabled={localAudioEnabled}
        isVideoEnabled={localVideoEnabled}
        isScreenSharing={isScreenSharing}
        participantCount={allParticipants.length}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onLeave={handleLeave}
      />
    </div>
  );
}
