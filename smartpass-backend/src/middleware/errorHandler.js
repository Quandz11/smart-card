/**
 * Central error handling middleware.
 * Ensures consistent JSON response: { success: false, message: "..." }
 * Never leaks database details, internal stacks, or sensitive error messages.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'Field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // Handle Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Handle invalid ObjectId cast error
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field: ${err.path}`;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  }

  // Sanitize internal server errors to prevent leaking stack traces or internal DB info
  if (statusCode === 500) {
    message = 'Internal server error';
  }

  const responseBody = {
    success: false,
    message,
  };

  if (err.code && typeof err.code === 'string') {
    responseBody.code = err.code;
  }

  res.status(statusCode).json(responseBody);
};

module.exports = errorHandler;

