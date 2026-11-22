const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect middleware: validates JWT Bearer token and attaches user to req.user.
 * Missing, invalid, or expired token returns 401.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    const error = new Error('Not authenticated, token missing');
    error.statusCode = 401;
    return next(error);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      const error = new Error('User not found or account deactivated');
      error.statusCode = 401;
      return next(error);
    }

    req.user = user;
    next();
  } catch (err) {
    const error = new Error('Invalid or expired token');
    error.statusCode = 401;
    return next(error);
  }
};

/**
 * Authorize middleware: checks if req.user.role is in allowed roles.
 * Authenticated user with disallowed role returns 403.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const error = new Error('You do not have permission for this action');
      error.statusCode = 403;
      return next(error);
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};

