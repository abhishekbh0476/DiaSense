import { NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '../lib/jwt.js';
import connectToDatabase from '../lib/mongodb.js';
import User from '../models/User.js';

/**
 * Authentication middleware for API routes
 * @param {Function} handler - The API route handler
 * @returns {Function} Wrapped handler with authentication
 */
export const withAuth = (handler) => {
  return async (request, context) => {
    try {
      // Extract token from Authorization header or cookies
      let token = extractTokenFromHeader(request.headers.get('authorization'));
      
      // Check cookies from request headers
      const cookieHeader = request.headers.get('cookie');
      if (!token && cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {});
        token = cookies.token;
      }
      
      console.log('Auth middleware - Token found:', !!token);

      if (!token) {
        console.log('No token provided');
        return NextResponse.json({
          success: false,
          message: 'Access denied. No token provided.'
        }, { status: 401 });
      }

      // Verify token
      const decoded = verifyToken(token);
      
      // Connect to database
      await connectToDatabase();
      
      // Get user from database
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return NextResponse.json({
          success: false,
          message: 'Invalid token. User not found.'
        }, { status: 401 });
      }

      if (user.accountStatus !== 'active') {
        return NextResponse.json({
          success: false,
          message: 'Account is not active.'
        }, { status: 401 });
      }

      // Add user to request object
      request.user = user;
      request.userId = user._id;

      // Call the original handler with context (for dynamic routes)
      return handler(request, context);
      
    } catch (error) {
      console.error('Auth middleware error:', error);
      
      if (error.message === 'Token has expired') {
        return NextResponse.json({
          success: false,
          message: 'Token has expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        }, { status: 401 });
      }
      
      if (error.message === 'Invalid token') {
        return NextResponse.json({
          success: false,
          message: 'Invalid token. Please login again.',
          code: 'INVALID_TOKEN'
        }, { status: 401 });
      }
      
      return NextResponse.json({
        success: false,
        message: 'Authentication failed. Please try again.'
      }, { status: 500 });
    }
  };
};

/**
 * Optional authentication middleware - doesn't fail if no token
 * @param {Function} handler - The API route handler
 * @returns {Function} Wrapped handler with optional authentication
 */
export const withOptionalAuth = (handler) => {
  return async (req, res) => {
    try {
      // Extract token from Authorization header or cookies
      let token = extractTokenFromHeader(req.headers.authorization);
      
      // If no token in header, check cookies
      if (!token && req.cookies && req.cookies.token) {
        token = req.cookies.token;
      }

      if (token) {
        try {
          // Verify token
          const decoded = verifyToken(token);
          
          // Connect to database
          await connectToDatabase();
          
          // Get user from database
          const user = await User.findById(decoded.userId).select('-password');
          
          if (user && user.accountStatus === 'active') {
            // Add user to request object
            req.user = user;
            req.userId = user._id;
          }
        } catch (error) {
          // Token is invalid, but we continue without authentication
          console.log('Optional auth failed:', error.message);
        }
      }

      // Call the original handler
      return handler(req, res);
      
    } catch (error) {
      console.error('Optional auth middleware error:', error);
      
      // Continue without authentication
      return handler(req, res);
    }
  };
};

/**
 * Role-based authorization middleware
 * @param {Array} allowedRoles - Array of allowed roles
 * @returns {Function} Middleware function
 */
export const withRole = (allowedRoles = []) => {
  return (handler) => {
    return withAuth(async (req, res) => {
      try {
        const userRole = req.user.role || 'user';
        
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. Insufficient permissions.'
          });
        }

        return handler(req, res);
      } catch (error) {
        console.error('Role middleware error:', error);
        return res.status(500).json({
          success: false,
          message: 'Authorization failed. Please try again.'
        });
      }
    });
  };
};

/**
 * Rate limiting middleware (basic implementation)
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} Middleware function
 */
export const withRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (handler) => {
    return async (req, res) => {
      try {
        const clientId = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Clean old entries
        if (requests.has(clientId)) {
          const clientRequests = requests.get(clientId);
          const validRequests = clientRequests.filter(time => time > windowStart);
          requests.set(clientId, validRequests);
        }
        
        // Check current requests
        const currentRequests = requests.get(clientId) || [];
        
        if (currentRequests.length >= maxRequests) {
          return res.status(429).json({
            success: false,
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil(windowMs / 1000)
          });
        }
        
        // Add current request
        currentRequests.push(now);
        requests.set(clientId, currentRequests);
        
        return handler(req, res);
      } catch (error) {
        console.error('Rate limit middleware error:', error);
        return handler(req, res);
      }
    };
  };
};
