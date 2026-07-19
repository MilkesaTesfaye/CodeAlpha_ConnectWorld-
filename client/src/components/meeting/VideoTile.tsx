import { useRef, useEffect } from 'react';
import type { RemoteParticipant, ConnectionState } from '../../hooks/useWebRTC';

interface VideoTileProps {
  participant: RemoteParticipant;
  isLocal?: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing?: boolean;
  displayName?: string | null;
  avatarUrl?: string | null;
  stream?: MediaStream | null;
  connectionState?: ConnectionState;
}

export default function VideoTile({
  participant,
  isLocal = false,
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing = false,
  displayName,
  avatarUrl,
  stream,
  connectionState,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const name = displayName || participant.displayName || 'Unknown';
  const initial = name.charAt(0).toUpperCase();
  const state = connectionState || participant.connectionState;

  // Connection status badge content
  const connectionBadge = !isLocal && state && state !== 'connected'
    ? (() => {
        switch (state) {
          case 'checking':
          case 'new':
            return {
              label: 'Connecting',
              classes: 'bg-amber-500/90 backdrop-blur-sm text-white',
              icon: (
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ),
            };
          case 'poor':
            return {
              label: 'Poor Connection',
              classes: 'bg-orange-500/90 backdrop-blur-sm text-white',
              icon: (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              ),
            };
          case 'disconnected':
          case 'failed':
            return {
              label: state === 'failed' ? 'Connection Failed' : 'Disconnected',
              classes: 'bg-red-500/90 backdrop-blur-sm text-white',
              icon: (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 4.243a1 1 0 010-1.414" />
                </svg>
              ),
            };
          default:
            return null;
        }
      })()
    : null;

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-gray-800 aspect-video group ${
        isScreenSharing ? 'ring-2 ring-indigo-500' : ''
      } ${isLocal ? 'ring-1 ring-indigo-400/50' : ''}`}
    >
      {/* Video */}
      {stream && isVideoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        /* Avatar Fallback (no video) */
        <div className="w-full h-full flex items-center justify-center bg-gray-700">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover opacity-60" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center">
              <span className="text-3xl font-medium text-gray-300">{initial}</span>
            </div>
          )}
        </div>
      )}

      {/* Screen Share Badge */}
      {isScreenSharing && (
        <div className="absolute top-3 left-3 px-2 py-1 bg-indigo-600/90 backdrop-blur-sm rounded-lg text-xs text-white font-medium flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Sharing Screen
        </div>
      )}

      {/* Local Indicator */}
      {isLocal && (
        <div className="absolute top-3 left-3 px-2 py-1 bg-indigo-600/90 backdrop-blur-sm rounded-lg text-xs text-white font-medium">
          You
        </div>
      )}

      {/* Connection Status Badge */}
      {connectionBadge && (
        <div className="absolute top-3 right-3 z-10">
          <div
            className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-lg ${connectionBadge.classes}`}
          >
            {connectionBadge.icon}
            <span>{connectionBadge.label}</span>
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white font-medium truncate max-w-[70%]">
            {name}
          </span>
          <div className="flex items-center gap-2">
            {/* Audio Indicator */}
            {!isAudioEnabled && (
              <div className="p-1 bg-red-500/80 rounded-full" title="Muted">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              </div>
            )}
            {isAudioEnabled && (
              <div className="p-1 bg-green-500/80 rounded-full" title="Unmuted">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </div>
            )}
            {/* Video Indicator */}
            {!isVideoEnabled && (
              <div className="p-1 bg-red-500/80 rounded-full" title="Camera off">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
