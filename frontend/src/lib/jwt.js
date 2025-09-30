import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for user
 * @param {Object} payload - User data to encode in token
 * @returns {string} JWT token
 */
export const generateToken = (payload) => {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'glucotrack',
      audience: 'glucotrack-users'
    });
  } catch (error) {
    throw new Error('Token generation failed');
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'glucotrack',
      audience: 'glucotrack-users'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Generate refresh token
 * @param {Object} payload - User data to encode in token
 * @returns {string} Refresh token
 */
export const generateRefreshToken = (payload) => {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '30d',
      issuer: 'glucotrack',
      audience: 'glucotrack-refresh'
    });
  } catch (error) {
    throw new Error('Refresh token generation failed');
  }
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'glucotrack',
      audience: 'glucotrack-refresh'
    });
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null if not found
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};
