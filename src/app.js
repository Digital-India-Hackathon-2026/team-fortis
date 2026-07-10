import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { NotFoundError } from './utils/apiError.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'UP',
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
app.use('/api', (req, res, next) => {
  if (!req.url.startsWith('/v1')) {
    req.url = '/v1' + req.url;
  }
  next();
}, apiRouter);

app.use('/api/v1', apiRouter);

app.use((_req, _res, next) => {
  next(new NotFoundError('API endpoint not found'));
});

app.use(errorHandler);

export default app;
