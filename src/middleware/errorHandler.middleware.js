/**
 * Error Handler Middleware
 * @description Global error handling for the application
 */

const { logger } = require('../config/logger');

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(`${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ApiError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new ApiError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    const message = messages.join(', ');
    error = new ApiError(message, 400);
  }

  // Zod validation error
  if (err.name === 'ZodError') {
    const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    const message = messages.join(', ');
    error = new ApiError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError('Token expired', 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Async handler wrapper to avoid try-catch in controllers
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { errorHandler, ApiError, asyncHandler };

