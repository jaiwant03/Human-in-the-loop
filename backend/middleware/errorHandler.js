/**
 * Centralized Error Handling Middleware
 * Prevents credential leaks and hides internal stack traces in production.
 */
const errorHandler = (err, req, res, next) => {
  console.error('[API Error]:', err.message);

  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'An unexpected server error occurred.';

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map(val => val.message)
      .join(', ');
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found: Invalid identifier provided.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { devHint: err.name }),
  });
};

module.exports = errorHandler;
