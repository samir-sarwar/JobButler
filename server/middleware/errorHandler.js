/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    const details = {};
    for (const field in err.errors) {
      details[field] = err.errors[field].message;
    }
    return res.status(400).json({
      error: 'validation_error',
      message: 'Validation failed',
      details,
    });
  }

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({
      error: 'invalid_id',
      message: 'Invalid ID format',
    });
  }

  if (err.code === 11000) {
    // MongoDB duplicate key error
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      error: 'duplicate_error',
      message: `${field} already exists`,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'invalid_token',
      message: 'Invalid authentication token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'token_expired',
      message: 'Authentication token has expired',
    });
  }

  // Custom error with status code
  if (err.status) {
    return res.status(err.status).json({
      error: err.code || 'error',
      message: err.message,
      ...(err.details && { details: err.details }),
      ...(err.log && { log: err.log }),
    });
  }

  // Default server error
  res.status(500).json({
    error: 'server_error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'not_found',
    message: `Route ${req.method} ${req.path} not found`,
  });
};

/**
 * Create a custom error with status code
 */
export const createError = (status, code, message, details = null) => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  if (details) error.details = details;
  return error;
};
