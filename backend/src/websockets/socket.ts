import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { NotificationModel } from '../models';
import { JwtPayload } from '../types';

let io: Server;

export function initializeWebSockets(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Security Middleware - JWT handshake verification
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication failed: Token missing'));
    }

    try {
      const decoded = jwt.verify(token as string, config.jwt.secret) as JwtPayload;
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication failed: Invalid signature'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user.id;
    const role = socket.data.user.role;

    console.log(`[WS] User connected: ${socket.data.user.username} (${role})`);

    // Direct room assignment for targeted messages
    socket.join(`user:${userId}`);

    // Dynamic role-based channels
    if (role === 'student') socket.join('students_channel');
    if (role === 'teacher') socket.join('teachers_channel');
    if (role === 'admin' || role === 'superadmin') {
      socket.join('admins_channel');
      socket.join('teachers_channel');
      socket.join('students_channel');
    }

    // Handle typing indicators
    socket.on('typing:start', (data: { courseId?: string }) => {
      if (data.courseId) {
        socket.to(`course:${data.courseId}`).emit('typing:update', {
          userId,
          username: socket.data.user.username,
          isTyping: true,
        });
      }
    });

    socket.on('typing:stop', (data: { courseId?: string }) => {
      if (data.courseId) {
        socket.to(`course:${data.courseId}`).emit('typing:update', {
          userId,
          username: socket.data.user.username,
          isTyping: false,
        });
      }
    });

    // Join course room
    socket.on('course:join', (courseId: string) => {
      socket.join(`course:${courseId}`);
    });

    socket.on('course:leave', (courseId: string) => {
      socket.leave(`course:${courseId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[WS] User disconnected: ${socket.data.user.username}`);
    });
  });

  return io;
}

// Helper to send notification to a specific user via WebSocket + DB
export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'warning' | 'success' | 'error' = 'info'
): Promise<void> {
  // Persist to database
  await NotificationModel.create({ userId, title, message, type });

  // Emit in real-time
  if (io) {
    io.to(`user:${userId}`).emit('notification', { title, message, type, timestamp: new Date() });
  }
}

// Broadcast to all users with a specific role
export async function broadcastToRole(
  role: string,
  title: string,
  message: string,
  type: 'info' | 'warning' | 'success' | 'error' = 'info'
): Promise<void> {
  await NotificationModel.broadcastToRole(role, title, message, type);

  if (io) {
    const channel = role === 'student' ? 'students_channel'
      : role === 'teacher' ? 'teachers_channel'
      : 'admins_channel';

    io.to(channel).emit('notification', { title, message, type, timestamp: new Date() });
  }
}

export { io };
