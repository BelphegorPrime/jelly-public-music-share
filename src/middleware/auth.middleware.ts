import { Request, Response, NextFunction } from 'express';
import { BASIC_AUTH_PASSWORD, BASIC_AUTH_USERNAME } from '../config';

const whitelistedPaths = ['/play', '/static', '/favicon.svg', '/.well-known'];

/**
 * Basic Authentication middleware for protecting endpoints
 * This middleware validates basic auth credentials
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        console.log(`Authenticating request for path: ${req.path}`);

        // check for paths that are whitelisted (e.g., health check, static files)
        if (whitelistedPaths.some(path => req.path.startsWith(path))) {
            console.log(`Path ${req.path} is whitelisted, skipping authentication`);
            return next();
        }

        // Check for basic auth header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Basic ')) {
            res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
            res.status(401).json({ 
            error: 'Authentication required',
            message: 'Basic auth credentials required'
            });
            return;
        }

        // Decode base64 credentials
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [username, password] = credentials.split(':');

        // Validate credentials
        if (username !== BASIC_AUTH_USERNAME || password !== BASIC_AUTH_PASSWORD) {
            res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
            res.status(401).json({ 
            error: 'Invalid credentials',
            message: 'Username or password incorrect'
            });
            return;
        }

        // Attach authenticated user info to request object
        (req as any).user = { username };

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Internal server error'
        });
    }
};
