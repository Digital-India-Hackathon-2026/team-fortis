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

// Keep-Alive Self-Ping Job
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes
const APP_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

setInterval(() => {
  if (APP_URL.includes('localhost') || APP_URL.includes('127.0.0.1')) return; // Don't self-ping on localhost
  
  logger.info(`[Keep-Alive]: Pinging server at ${APP_URL} to prevent sleep...`);
  
  http.get(`${APP_URL}/health`, (res) => {
    logger.info(`[Keep-Alive]: Ping response status: ${res.statusCode}`);
  }).on('error', (err) => {
    logger.error('[Keep-Alive]: Ping failed:', err.message);
  });
}, PING_INTERVAL);
