import { Request, Response, NextFunction } from 'express';
import { container } from '../di/container';
import { AuthTokenService } from '../services/token/auth-token.service';

const whitelistedPaths = ['/play', '/login', '/static', '/favicon.svg', '/.well-known', '/api/auth/login', '/api/health'];

// Get auth token service instance for middleware
const authTokenService = container.resolve(AuthTokenService);

/**
 * JWT Authentication middleware for protecting endpoints
 * Validates owner authentication tokens from Authorization header (Bearer scheme)
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        console.log(`Authenticating request for path: ${req.path}`);

        // Check for paths that are whitelisted (e.g., login, health check, static files)
        if (whitelistedPaths.some(path => req.path.startsWith(path))) {
            console.log(`Path ${req.path} is whitelisted, skipping authentication`);
            return next();
        }

        // Check for Bearer token in Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ 
                error: 'Authentication required',
                message: 'Bearer token required'
            });
            return;
        }

        // Extract token
        const token = authHeader.slice(7);

        // Verify owner authentication token
        const decoded = authTokenService.verifyToken(token);

        if (!decoded) {
            res.status(401).json({ 
                error: 'Invalid token',
                message: 'Token is invalid or expired'
            });
            return;
        }

        // Attach authenticated user info to request object
        (req as any).user = { 
            username: decoded.username,
            userId: decoded.userId
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Internal server error'
        });
    }
};
