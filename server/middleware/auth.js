import jwt from 'jsonwebtoken';
import { createError } from './errorHandler.js';

/**
 * JWT Authentication Middleware
 * Verifies Bearer token and attaches user to request
 */
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw createError(401, 'unauthorized', 'No authorization header provided');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw createError(401, 'unauthorized', 'Invalid authorization format. Use: Bearer <token>');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw createError(401, 'unauthorized', 'No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = {
      _id: decoded._id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(createError(401, 'invalid_token', 'Invalid authentication token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(createError(401, 'token_expired', 'Authentication token has expired'));
    }
    next(error);
  }
};

/**
 * Generate JWT token for a user
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

export default verifyToken;
