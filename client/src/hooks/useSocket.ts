import { useEffect, useRef, useCallback } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import { useAuth } from './useAuth';

/**
 * Custom hook that manages the Socket.io connection based on auth state.
 * Automatically connects when authenticated and disconnects on logout.
 */
export function useSocket() {
  const { isAuthenticated, user } = useAuth();
  const socketRef = useRef(getSocket());

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (isAuthenticated && token) {
      socketRef.current = connectSocket(token);
    }

    return () => {
      // Don't disconnect on every re-render; the socket lifecycle
      // is managed by the auth state
    };
  }, [isAuthenticated]);

  // Disconnect on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('join_room', { roomId, userId: user?.id });
    }
  }, [user?.id]);

  const leaveRoom = useCallback((roomId: string) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('leave_room', { roomId, userId: user?.id });
    }
  }, [user?.id]);

  const emit = useCallback((event: string, data?: unknown) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit(event, data);
    }
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    const socket = getSocket();
    socket?.on(event, handler);
    return () => {
      socket?.off(event, handler);
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
    joinRoom,
    leaveRoom,
    emit,
    on,
  };
}
