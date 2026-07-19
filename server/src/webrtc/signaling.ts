import { Server, Socket } from 'socket.io';
import logger from '../utils/logger';

/**
 * Type for WebRTC signaling data.
 * Uses Record<string, unknown> since RTCSessionDescriptionInit/RTCIceCandidateInit
 * are browser-only types not available in Node.js.
 */
type RTCSessionDescription = Record<string, unknown>;
type RTCIceCandidate = Record<string, unknown>;

/**
 * Setup WebRTC signaling handlers for a socket connection.
 * Manages peer-to-peer connection setup via offer/answer/ICE candidate exchange.
 */
export function setupSignalingHandlers(socket: Socket, io: Server): void {
  const userId = (socket as any).user?.id;

  /**
   * Handle incoming WebRTC offer.
   * Forwards the offer to the target peer in the meeting room.
   */
  socket.on('offer', (data: { meetingId: string; offer: RTCSessionDescription; targetSocketId: string }) => {
    const { meetingId, offer, targetSocketId } = data;
    const roomName = `meeting:${meetingId}`;

    // Send the offer directly to the target socket
    io.to(targetSocketId).emit('offer', {
      offer,
      from: userId,
      fromSocketId: socket.id,
    });

    logger.debug(`📞 Offer: ${userId} -> socket ${targetSocketId} in meeting ${meetingId}`);
  });

  /**
   * Handle new peer joining — existing users should connect to them.
   */
  socket.on('new_peer', (data: { meetingId: string }) => {
    const { meetingId } = data;
    const roomName = `meeting:${meetingId}`;

    // Notify existing peers that a new peer has joined and wants WebRTC connections
    socket.to(roomName).emit('new_peer', {
      userId: (socket as any).user?.id,
      socketId: socket.id,
    });

    logger.debug(`🆕 New peer: ${(socket as any).user?.id} (socket: ${socket.id}) in meeting ${meetingId}`);
  });

  /**
   * Handle incoming WebRTC answer.
   * Forwards the answer to the target peer.
   */
  socket.on('answer', (data: { meetingId: string; answer: RTCSessionDescription; targetSocketId: string }) => {
    const { meetingId, answer, targetSocketId } = data;

    io.to(targetSocketId).emit('answer', {
      answer,
      from: userId,
      fromSocketId: socket.id,
    });

    logger.debug(`📞 Answer: ${userId} -> socket ${targetSocketId}`);
  });

  /**
   * Handle incoming ICE candidate.
   * Forwards the candidate to the target peer.
   */
  socket.on('ice_candidate', (data: { meetingId: string; candidate: RTCIceCandidate; targetSocketId: string }) => {
    const { candidate, targetSocketId } = data;

    io.to(targetSocketId).emit('ice_candidate', {
      candidate,
      from: userId,
    });
  });

  /**
   * Screen sharing started/stopped.
   */
  socket.on('screen_share_start', (data: { meetingId: string }) => {
    const roomName = `meeting:${data.meetingId}`;
    socket.to(roomName).emit('screen_share_start', {
      userId,
      socketId: socket.id,
    });
  });

  socket.on('screen_share_stop', (data: { meetingId: string }) => {
    const roomName = `meeting:${data.meetingId}`;
    socket.to(roomName).emit('screen_share_stop', {
      userId,
    });
  });

  /**
   * Media state changes (mute/unmute, camera on/off).
   */
  socket.on('mute', (data: { meetingId: string }) => {
    const roomName = `meeting:${data.meetingId}`;
    socket.to(roomName).emit('mute', { userId });
  });

  socket.on('unmute', (data: { meetingId: string }) => {
    const roomName = `meeting:${data.meetingId}`;
    socket.to(roomName).emit('unmute', { userId });
  });

  socket.on('camera_on', (data: { meetingId: string }) => {
    const roomName = `meeting:${data.meetingId}`;
    socket.to(roomName).emit('camera_on', { userId });
  });

  socket.on('camera_off', (data: { meetingId: string }) => {
    const roomName = `meeting:${data.meetingId}`;
    socket.to(roomName).emit('camera_off', { userId });
  });

  /**
   * Meeting control events.
   */
  socket.on('meeting_end', (data: { meetingId: string }) => {
    const roomName = `meeting:${data.meetingId}`;
    io.to(roomName).emit('meeting_end', {
      endedBy: userId,
    });
  });
}
