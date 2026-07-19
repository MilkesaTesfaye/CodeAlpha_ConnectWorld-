import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socket: Socket | null = null;

/**
 * Initialize the socket connection with auth token.
 */
export function connectSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
  });

  return socket;
}

/**
 * Get the current socket instance.
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Disconnect the socket.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Update the socket auth token (e.g., after token refresh).
 */
export function updateSocketToken(token: string): void {
  if (socket) {
    socket.auth = { token };
    if (socket.connected) {
      socket.emit('authenticate', { token });
    }
  }
}
