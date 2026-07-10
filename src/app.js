import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { NotFoundError } from './utils/apiError.js';

import { prisma } from './config/database.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

app.get('/health', async (_req, res) => {
  let dbStatus = 'UP';
  try {
    await prisma.user.count();
  } catch (err) {
    dbStatus = 'DOWN';
  }

  res.status(dbStatus === 'UP' ? 200 : 500).json({
    status: 'UP',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    service: 'CiviqAI Backend Service',
  });
});

app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'Welcome to CiviqAI REST API. Version 1 is live.',
    documentation: '/api/v1',
  });
});

// Route rewriting compatibility for React frontend calling /api instead of /api/v1
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);

app.use((_req, _res, next) => {
  next(new NotFoundError('API endpoint not found'));
});

app.use(errorHandler);

export default app;
