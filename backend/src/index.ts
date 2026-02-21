import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import cron from 'node-cron';
import { join } from 'node:path';

import { runMigrations } from './db/migrate.js';
import { cleanupExpiredFiles } from './services/cleanup.js';
import { createWebSocketServer, handleUpgrade } from './services/websocket.js';
import { PORT } from './utils/constants.js';

import uploadRoutes from './routes/upload.js';
import downloadRoutes from './routes/download.js';
import fileRoutes from './routes/files.js';
import statsRoutes from './routes/stats.js';
import migrateSessionRoutes from './routes/migrate-session.js';
import healthRoutes from './routes/health.js';

const app = new Hono();

// CORS for development
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization', 'X-Session-Id'],
}));

// API routes
const api = new Hono();
api.route('/', healthRoutes);
api.route('/', uploadRoutes);
api.route('/', downloadRoutes);
api.route('/', fileRoutes);
api.route('/', statsRoutes);
api.route('/', migrateSessionRoutes);

app.route('/api', api);

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  app.use('*', serveStatic({ root: './public' }));

  // SPA fallback: serve index.html for all non-API routes
  app.get('*', serveStatic({ root: './public', path: 'index.html' }));
}

async function main() {
  // Run database migrations
  await runMigrations();

  // Run cleanup on startup
  await cleanupExpiredFiles();

  // Schedule cleanup every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    await cleanupExpiredFiles();
  });

  // Create WebSocket server
  const wsServer = createWebSocketServer();

  // Start HTTP server
  const server = serve({
    fetch: app.fetch,
    port: PORT,
  }, (info) => {
    console.log(`Server running on http://localhost:${info.port}`);
  });

  // Handle WebSocket upgrades
  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    if (url.pathname === '/api/ws') {
      handleUpgrade(request, socket, head);
    } else {
      socket.destroy();
    }
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
