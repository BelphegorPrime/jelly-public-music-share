import express, { Request, Response } from 'express';
import { container } from '../di/container';
import { AuthTokenService } from '../services/token/auth-token.service';
import { AUTH_USERNAME, AUTH_PASSWORD, TOKEN_EXPIRY_MINUTES } from '../config';

const router = express.Router();
const authTokenService = container.resolve(AuthTokenService);

export type AuthToken = {
  userId: string;
  username: string;
  issuedAt: number;
};

// POST /api/auth/login - Authenticate with username/password, return JWT
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Validate credentials against environment variables
    if (username !== AUTH_USERNAME || password !== AUTH_PASSWORD) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate auth token using AuthTokenService
    const { token, expiresAt } = authTokenService.generateToken({
      userId: username, // Can be expanded to a proper user ID later
      username,
    });

    res.json({ token, expiresIn: TOKEN_EXPIRY_MINUTES * 60, expiresAt });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout - Logout (client-side primarily)
router.post('/logout', (req: Request, res: Response) => {
  // Token invalidation could be handled via blacklist if needed
  res.json({ message: 'Logout successful' });
});

// GET /api/auth/verify - Verify token validity
router.get('/verify', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false, error: 'No token provided' });
    }

    const token = authHeader.slice(7);
    const decoded = authTokenService.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ valid: false, error: 'Invalid token' });
    }

    res.json({ valid: true, username: decoded.username });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

export default router;
