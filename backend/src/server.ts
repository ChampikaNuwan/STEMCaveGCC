import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { config } from './config/env';
import { migrate } from './config/migrate';
import { initializeWebSockets } from './websockets/socket';
import authRoutes from './routes/auth.routes';
import courseRoutes from './routes/course.routes';
import assessmentRoutes from './routes/assessment.routes';

const app = express();
const server = http.createServer(app);

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '..', config.upload.dir)));

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, message: 'STEM Cave API is running', timestamp: new Date() });
});

// API Routes
app.use('/api/v1', authRoutes);
app.use('/api/v1', courseRoutes);
app.use('/api/v1', assessmentRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Initialize WebSocket server
const io = initializeWebSockets(server);

// Startup
async function start() {
  try {
    // Run migrations on startup
    await migrate();

    server.listen(config.port, () => {
      console.log(`
╔══════════════════════════════════════════╗
║        🧪 STEM Cave LMS Backend         ║
║        Server running on port ${config.port}     ║
║        Environment: ${config.nodeEnv.padEnd(17)}║
║        WebSocket: Ready                  ║
╚══════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export { app, server, io };
