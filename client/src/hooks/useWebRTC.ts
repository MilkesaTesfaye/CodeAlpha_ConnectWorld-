import { useRef, useCallback, useEffect, useState } from 'react';
import { getSocket } from '../services/socket';

// ─── Constants ───────────────────────────────────────────────────────────────

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const MEDIA_CONSTRAINTS = {
  video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
  audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
};

// ─── Types ───────────────────────────────────────────────────────────────────

export type ConnectionState = 'new' | 'checking' | 'connected' | 'poor' | 'disconnected' | 'failed';

export interface PeerConnection {
  connection: RTCPeerConnection;
  stream: MediaStream;
  connected: boolean;
  connectionState: ConnectionState;
  poorTimer?: ReturnType<typeof setTimeout> | null;
}

export interface RemoteParticipant {
  userId: string;
  socketId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  stream: MediaStream;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  connectionState: ConnectionState;
}

interface UseWebRTCOptions {
  meetingId: string;
  userId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  localAudioEnabled: boolean;
  localVideoEnabled: boolean;
  isScreenSharing: boolean;
  participants: RemoteParticipant[];
  initializeMedia: () => Promise<void>;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
  joinMeetingRoom: () => void;
  leaveMeetingRoom: () => void;
  error: string | null;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useWebRTC({
  meetingId,
  userId,
  displayName,
  avatarUrl,
}: UseWebRTCOptions): UseWebRTCReturn {
  const peersRef = useRef<Map<string, PeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const participantsMapRef = useRef<Map<string, RemoteParticipant>>(new Map());

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [localAudioEnabled, setLocalAudioEnabled] = useState(true);
  const [localVideoEnabled, setLocalVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Sync participants state from ref
  const syncParticipants = useCallback(() => {
    setParticipants(Array.from(participantsMapRef.current.values()));
  }, []);

  // ─── Media Management ──────────────────────────────────────────────────

  const initializeMedia = useCallback(async () => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setLocalAudioEnabled(stream.getAudioTracks()[0]?.enabled ?? false);
      setLocalVideoEnabled(stream.getVideoTracks()[0]?.enabled ?? false);
      setError(null);
    } catch (err: any) {
      const msg = err instanceof DOMException
        ? err.name === 'NotAllowedError'
          ? 'Camera/microphone access denied. Please allow permissions in your browser settings.'
          : err.name === 'NotFoundError'
          ? 'No camera or microphone found.'
          : `Media error: ${err.message}`
        : 'Failed to access camera and microphone.';
      setError(msg);
    }
  }, []);

  const toggleAudio = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setLocalAudioEnabled(audioTrack.enabled);
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit(audioTrack.enabled ? 'unmute' : 'mute', { meetingId });
      }
    }
  }, [meetingId]);

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setLocalVideoEnabled(videoTrack.enabled);
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit(videoTrack.enabled ? 'camera_on' : 'camera_off', { meetingId });
      }
    }
  }, [meetingId]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const videoTrack = newStream.getVideoTracks()[0];
      if (videoTrack && localStreamRef.current) {
        const oldTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldTrack) {
          localStreamRef.current.removeTrack(oldTrack);
          oldTrack.stop();
        }
        localStreamRef.current.addTrack(videoTrack);
        setLocalStream(localStreamRef.current);
      }
      setIsScreenSharing(false);
      getSocket()?.emit('screen_share_stop', { meetingId });
    } else {
      try {
        const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({
          video: { cursor: 'always' },
          audio: true,
        });
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];
        if (screenTrack && localStreamRef.current) {
          const oldTrack = localStreamRef.current.getVideoTracks()[0];
          if (oldTrack) {
            localStreamRef.current.removeTrack(oldTrack);
            oldTrack.stop();
          }
          localStreamRef.current.addTrack(screenTrack);
          setLocalStream(localStreamRef.current);
        }

        screenTrack.onended = () => { toggleScreenShare(); };

        setIsScreenSharing(true);
        getSocket()?.emit('screen_share_start', { meetingId });

        const screenAudioTrack = screenStream.getAudioTracks()[0];
        if (screenAudioTrack && localStreamRef.current) {
          localStreamRef.current.addTrack(screenAudioTrack);
        }
      } catch {
        setError('Screen sharing was cancelled or not supported.');
      }
    }
  }, [isScreenSharing, meetingId]);

  // ─── Peer Connection Management ────────────────────────────────────────

  const createPeerConnection = useCallback(
    (targetSocketId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          if (localStreamRef.current) {
            pc.addTrack(track, localStreamRef.current);
          }
        });
      }

      // ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          getSocket()?.emit('ice_candidate', {
            meetingId,
            candidate: event.candidate.toJSON(),
            targetSocketId,
          });
        }
      };

      // Connection state — map raw states to our simplified ConnectionState
      const updateConnectionState = () => {
        const rawState = pc.connectionState;
        const peerInfo = peersRef.current.get(targetSocketId);
        if (!peerInfo) return;

        peerInfo.connected = rawState === 'connected';

        let newState: ConnectionState;
        switch (rawState) {
          case 'new':
          case 'connecting':
            newState = 'checking';
            break;
          case 'connected':
            newState = 'connected';
            // Clear any poor-connection timer
            if (peerInfo.poorTimer) {
              clearTimeout(peerInfo.poorTimer);
              peerInfo.poorTimer = null;
            }
            break;
          case 'disconnected':
            // Don't show as 'disconnected' immediately — wait 3 seconds
            // to give the connection a chance to recover
            newState = 'poor';
            if (!peerInfo.poorTimer) {
              peerInfo.poorTimer = setTimeout(() => {
                const pInfo = peersRef.current.get(targetSocketId);
                if (pInfo) {
                  pInfo.connectionState = 'disconnected';
                  const part = participantsMapRef.current.get(targetSocketId);
                  if (part) {
                    part.connectionState = 'disconnected';
                    syncParticipants();
                  }
                }
              }, 3000);
            }
            break;
          case 'failed':
            newState = 'failed';
            // Clean up stale peer
            setTimeout(() => {
              const pInfo = peersRef.current.get(targetSocketId);
              if (pInfo) {
                pInfo.connection.close();
                peersRef.current.delete(targetSocketId);
              }
              participantsMapRef.current.delete(targetSocketId);
              syncParticipants();
            }, 1000);
            break;
          default:
            newState = 'checking';
        }

        peerInfo.connectionState = newState;

        // Update participant state if they exist
        const participant = participantsMapRef.current.get(targetSocketId);
        if (participant) {
          participant.connectionState = newState;
          syncParticipants();
        }
      };

      pc.onconnectionstatechange = updateConnectionState;

      // Incoming streams
      pc.ontrack = (event) => {
        const existing = participantsMapRef.current.get(targetSocketId);
        if (existing) {
          existing.stream = event.streams[0];
        } else {
          const peerInfo = peersRef.current.get(targetSocketId);
          participantsMapRef.current.set(targetSocketId, {
            userId: '',
            socketId: targetSocketId,
            stream: event.streams[0],
            isAudioEnabled: true,
            isVideoEnabled: true,
            isScreenSharing: false,
            connectionState: peerInfo?.connectionState || 'checking',
          });
        }
        syncParticipants();
      };

      // Negotiation needed — send offer
      pc.onnegotiationneeded = async () => {
        try {
          await pc.setLocalDescription();
          getSocket()?.emit('offer', {
            meetingId,
            offer: pc.localDescription!.toJSON(),
            targetSocketId,
          });
        } catch (err) {
          console.error('Negotiation failed:', err);
        }
      };

      return pc;
    },
    [meetingId, syncParticipants]
  );

  /**
   * Create a peer connection to a remote peer and send an offer.
   */
  const connectToPeer = useCallback(
    (remoteSocketId: string) => {
      if (peersRef.current.has(remoteSocketId)) return; // Already connected

      const pc = createPeerConnection(remoteSocketId);
      peersRef.current.set(remoteSocketId, {
        connection: pc,
        stream: new MediaStream(),
        connected: false,
        connectionState: 'checking',
        poorTimer: null,
      });
    },
    [createPeerConnection]
  );

  // ─── Socket Event Handlers ─────────────────────────────────────────────

  const handleOffer = useCallback(
    async (data: { offer: any; fromSocketId: string }) => {
      const { offer, fromSocketId } = data;

      // Create peer connection if we don't have one for this peer
      if (!peersRef.current.has(fromSocketId)) {
        const pc = createPeerConnection(fromSocketId);
        peersRef.current.set(fromSocketId, {
          connection: pc,
          stream: new MediaStream(),
          connected: false,
          connectionState: 'checking',
          poorTimer: null,
        });
      }

      const pc = peersRef.current.get(fromSocketId)!.connection;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await pc.setLocalDescription();
        getSocket()?.emit('answer', {
          meetingId,
          answer: pc.localDescription!.toJSON(),
          targetSocketId: fromSocketId,
        });
      } catch (err) {
        console.error('Failed to handle offer:', err);
      }
    },
    [meetingId, createPeerConnection]
  );

  const handleAnswer = useCallback(
    async (data: { answer: any; fromSocketId: string }) => {
      const { answer, fromSocketId } = data;
      const peerInfo = peersRef.current.get(fromSocketId);
      if (peerInfo && peerInfo.connection.signalingState === 'have-local-offer') {
        try {
          await peerInfo.connection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Failed to set remote description from answer:', err);
        }
      }
    },
    []
  );

  const handleIceCandidate = useCallback(
    async (data: { candidate: any; from: string }) => {
      const peerInfo = peersRef.current.get(data.from);
      if (peerInfo) {
        try {
          await peerInfo.connection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('Failed to add ICE candidate:', err);
        }
      }
    },
    []
  );

  const handleUserJoined = useCallback(
    (data: { userId: string; socketId: string }) => {
      // Update participant info
      const existing = participantsMapRef.current.get(data.socketId);
      if (existing) {
        existing.userId = data.userId;
        syncParticipants();
      }
    },
    [syncParticipants]
  );

  const handleNewPeer = useCallback(
    (data: { userId: string; socketId: string }) => {
      // An existing peer wants us to connect to them
      // Create a peer connection and send an offer
      connectToPeer(data.socketId);
    },
    [connectToPeer]
  );

  const handleUserLeft = useCallback(
    (data: { socketId: string }) => {
      const peerInfo = peersRef.current.get(data.socketId);
      if (peerInfo) {
        peerInfo.connection.close();
        peersRef.current.delete(data.socketId);
      }
      participantsMapRef.current.delete(data.socketId);
      syncParticipants();
    },
    [syncParticipants]
  );

  const handleMediaState = useCallback(
    (event: string, data: { userId: string; socketId?: string }) => {
      const socketId = data.socketId || data.userId;
      // Find participant by socketId or userId
      let found = false;
      participantsMapRef.current.forEach((p, sid) => {
        if (sid === socketId || p.userId === data.userId) {
          switch (event) {
            case 'mute': p.isAudioEnabled = false; break;
            case 'unmute': p.isAudioEnabled = true; break;
            case 'camera_off': p.isVideoEnabled = false; break;
            case 'camera_on': p.isVideoEnabled = true; break;
            case 'screen_share_start': p.isScreenSharing = true; break;
            case 'screen_share_stop': p.isScreenSharing = false; break;
          }
          found = true;
        }
      });
      if (found) syncParticipants();
    },
    [syncParticipants]
  );

  // ─── Room Management ───────────────────────────────────────────────────

  const joinMeetingRoom = useCallback(() => {
    const socket = getSocket();
    if (!socket?.connected) return;

    // Register event listeners (use refs to avoid stale closures)
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice_candidate', handleIceCandidate);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('new_peer', handleNewPeer);
    socket.on('mute', (data) => handleMediaState('mute', data));
    socket.on('unmute', (data) => handleMediaState('unmute', data));
    socket.on('camera_on', (data) => handleMediaState('camera_on', data));
    socket.on('camera_off', (data) => handleMediaState('camera_off', data));
    socket.on('screen_share_start', (data) => handleMediaState('screen_share_start', data));
    socket.on('screen_share_stop', (data) => handleMediaState('screen_share_stop', data));

    // Join the Socket.IO meeting room — this triggers user_joined for existing peers
    socket.emit('join_room', { meetingId });

    // Announce ourselves as a new WebRTC peer
    // Existing peers will receive new_peer and connect to us
    socket.emit('new_peer', { meetingId });

  }, [meetingId, handleOffer, handleAnswer, handleIceCandidate,
      handleUserJoined, handleUserLeft, handleNewPeer, handleMediaState]);

  const leaveMeetingRoom = useCallback(() => {
    const socket = getSocket();

    // Close all peer connections and clear timers
    peersRef.current.forEach((peerInfo) => {
      if (peerInfo.poorTimer) clearTimeout(peerInfo.poorTimer);
      peerInfo.connection.close();
    });
    peersRef.current.clear();
    participantsMapRef.current.clear();
    setParticipants([]);

    // Stop local media
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    setLocalStream(null);
    setIsScreenSharing(false);

    // Leave Socket.IO room and remove listeners
    socket?.emit('leave_room', { meetingId });
    socket?.off('offer', handleOffer);
    socket?.off('answer', handleAnswer);
    socket?.off('ice_candidate', handleIceCandidate);
    socket?.off('user_joined', handleUserJoined);
    socket?.off('user_left', handleUserLeft);
    socket?.off('new_peer', handleNewPeer);
    socket?.off('mute');
    socket?.off('unmute');
    socket?.off('camera_on');
    socket?.off('camera_off');
    socket?.off('screen_share_start');
    socket?.off('screen_share_stop');
  }, [meetingId, handleOffer, handleAnswer, handleIceCandidate,
      handleUserJoined, handleUserLeft, handleNewPeer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      peersRef.current.forEach((p) => {
        if (p.poorTimer) clearTimeout(p.poorTimer);
        p.connection.close();
      });
      peersRef.current.clear();
      participantsMapRef.current.clear();
    };
  }, []);

  return {
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
    error,
  };
}
