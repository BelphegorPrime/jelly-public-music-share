import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';

const whitelistedPaths = [
  '/play',
  '/login',
  '/static',
  '/favicon.svg',
  '/.well-known',
  '/api/auth/login',
  '/api/health',
];

/**
 * JWT Authentication middleware for protecting endpoints
 * Validates JWT token from Authorization header (Bearer scheme)
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log(`Authenticating request for path: ${req.path}`);

    // Check for paths that are whitelisted (e.g., login, health check, static files)
    if (whitelistedPaths.some((path) => req.path.startsWith(path))) {
      console.log(`Path ${req.path} is whitelisted, skipping authentication`);
      return next();
    }

    // Check for Bearer token in Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Bearer token required',
      });
      return;
    }

    // Extract token
    const token = authHeader.slice(7);

    // Verify JWT token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // Attach authenticated user info to request object
      (req as any).user = {
        username: decoded.username,
        userId: decoded.userId,
      };

      next();
    } catch (error) {
      res.status(401).json({
        error: 'Invalid token',
        message: 'Token is invalid or expired',
      });
      return;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Internal server error',
    });
  }
};
