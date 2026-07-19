import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import prisma from '../config/database';
import logger from '../utils/logger';
import { setupSignalingHandlers } from '../webrtc/signaling';

let io: Server;

/**
 * Create and configure the Socket.IO server.
 * Handles authentication, room management, and real-time events.
 */
export function createSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: true, // Allow all origins (already enforced by Express CORS middleware)
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
    transports: ['websocket', 'polling'],
  });

  // ─── Authentication Middleware ──────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, isActive: true, isBanned: true },
      });

      if (!user || !user.isActive || user.isBanned) {
        return next(new Error('Account is disabled'));
      }

      // Attach user data to socket
      (socket as any).user = {
        id: user.id,
        email: user.email,
      };

      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ─── Connection Handler ─────────────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).user?.id;
    logger.info(`🔌 User connected: ${userId} (socket: ${socket.id})`);

    // Update online status
    updateUserStatus(userId, 'online');

    // Join user to their personal room
    socket.join(`user:${userId}`);

    // Setup event handlers
    setupRoomHandlers(socket, io);
    setupSignalingHandlers(socket, io);
    setupChatHandlers(socket, io);
    setupWhiteboardHandlers(socket, io);

    // ─── Disconnect Handler ─────────────────────────────────────────────
    socket.on('disconnect', async () => {
      logger.info(`🔌 User disconnected: ${userId} (socket: ${socket.id})`);

      // Update online status
      const connectedSockets = await io.in(`user:${userId}`).fetchSockets();
      if (connectedSockets.length === 0) {
        updateUserStatus(userId, 'offline');
      }

      // Notify rooms that user left
      socket.rooms.forEach((room) => {
        if (room !== socket.id && room.startsWith('meeting:')) {
          io.to(room).emit('user_left', {
            userId,
            socketId: socket.id,
          });
        }
      });
    });
  });

  logger.info('✅ Socket.IO server initialized');
  return io;
}

/**
 * Update user's online status in the database.
 */
async function updateUserStatus(userId: string, status: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        onlineStatus: status,
        lastSeenAt: status === 'offline' ? new Date() : undefined,
      },
    });
  } catch (error) {
    logger.error('Failed to update user status:', error);
  }
}

/**
 * Room management handlers.
 */
function setupRoomHandlers(socket: Socket, io: Server): void {
  // Join a meeting room
  socket.on('join_room', async ({ meetingId, participantId }) => {
    const roomName = `meeting:${meetingId}`;
    socket.join(roomName);

    // Notify others
    socket.to(roomName).emit('user_joined', {
      userId: (socket as any).user?.id,
      participantId,
      socketId: socket.id,
    });

    logger.info(`👤 ${(socket as any).user?.id} joined meeting ${meetingId}`);
  });

  // Leave a meeting room
  socket.on('leave_room', ({ meetingId }) => {
    const roomName = `meeting:${meetingId}`;
    socket.leave(roomName);

    io.to(roomName).emit('user_left', {
      userId: (socket as any).user?.id,
      socketId: socket.id,
    });
  });

  // Raise hand
  socket.on('raise_hand', ({ meetingId, isRaised }) => {
    const roomName = `meeting:${meetingId}`;
    socket.to(roomName).emit('hand_raised', {
      userId: (socket as any).user?.id,
      isRaised,
    });
  });

  // Send reaction
  socket.on('reaction', ({ meetingId, emoji }) => {
    const roomName = `meeting:${meetingId}`;
    io.to(roomName).emit('reaction_received', {
      userId: (socket as any).user?.id,
      emoji,
    });
  });
}

/**
 * Chat message handlers.
 */
function setupChatHandlers(socket: Socket, io: Server): void {
  // Send chat message
  socket.on('chat_message', ({ meetingId, message }) => {
    const roomName = `meeting:${meetingId}`;
    io.to(roomName).emit('chat_message', {
      ...message,
      senderId: (socket as any).user?.id,
      timestamp: new Date().toISOString(),
    });
  });

  // Typing indicator
  socket.on('typing', ({ meetingId, isTyping }) => {
    const roomName = `meeting:${meetingId}`;
    socket.to(roomName).emit('typing', {
      userId: (socket as any).user?.id,
      isTyping,
    });
  });
}

/**
 * Whiteboard drawing handlers.
 */
function setupWhiteboardHandlers(socket: Socket, io: Server): void {
  // Draw on whiteboard
  socket.on('whiteboard_draw', ({ meetingId, drawingData }) => {
    const roomName = `meeting:${meetingId}`;
    socket.to(roomName).emit('whiteboard_draw', drawingData);
  });

  // Cursor position for collaboration
  socket.on('cursor_move', ({ meetingId, position }) => {
    const roomName = `meeting:${meetingId}`;
    socket.to(roomName).emit('cursor_move', {
      userId: (socket as any).user?.id,
      position,
    });
  });
}

/**
 * Get the IO server instance.
 */
export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO server not initialized');
  }
  return io;
}
