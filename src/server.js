import app from './app.js';
import { logger } from './utils/logger.js';
import { prisma } from './config/database.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await prisma.$disconnect();
      logger.info('Database connection disconnected.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during database disconnection:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

import http from 'http';
import https from 'https';

// Keep-Alive Self-Ping Job
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes
const BACKEND_URL = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL || `http://localhost:${PORT}`;
const FRONTEND_URL = process.env.FRONTEND_URL;

const pingUrl = (url) => {
  if (!url || url.includes('localhost') || url.includes('127.0.0.1')) return;
  
  logger.info(`[Keep-Alive]: Pinging ${url} to prevent sleep...`);
  const client = url.startsWith('https') ? https : http;
  
  client.get(url, (res) => {
    logger.info(`[Keep-Alive]: Ping response from ${url}: ${res.statusCode}`);
  }).on('error', (err) => {
    logger.error(`[Keep-Alive]: Ping failed for ${url}:`, err.message);
  });
};

setInterval(() => {
  // Ping backend
  if (BACKEND_URL && !BACKEND_URL.includes('localhost')) {
    pingUrl(`${BACKEND_URL.replace(/\/$/, '')}/health`);
  }
  // Ping frontend if provided in env
  if (FRONTEND_URL && !FRONTEND_URL.includes('localhost')) {
    pingUrl(FRONTEND_URL);
  }
}, PING_INTERVAL);
