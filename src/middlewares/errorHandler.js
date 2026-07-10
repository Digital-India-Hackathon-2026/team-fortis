import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  if (!(err instanceof ApiError)) {
    logger.error(`Unhandled Error: ${err.message}`, err);
    statusCode = 500;
    message = 'Something went wrong on the server';
  } else {
    logger.warn(`API Error [${statusCode}]: ${message}`, errors);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
