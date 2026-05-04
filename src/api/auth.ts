import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import {
  JWT_SECRET,
  TOKEN_EXPIRY_MINUTES,
  AUTH_USERNAME,
  AUTH_PASSWORD,
} from '../config';

const router = express.Router();

export type AuthToken = jwt.JwtPayload & {
  userId: string;
  username: string;
  issuedAt: number;
};

// POST /api/auth/login - Authenticate with username/password, return JWT
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: 'Username and password are required' });
    }

    // Validate credentials against environment variables
    if (username !== AUTH_USERNAME || password !== AUTH_PASSWORD) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const payload: AuthToken = {
      userId: username, // Can be expanded to a proper user ID later
      username,
      issuedAt: Date.now(),
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: `${TOKEN_EXPIRY_MINUTES}min`,
    });

    res.json({ token, expiresIn: TOKEN_EXPIRY_MINUTES * 60 });
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
    const decoded = jwt.verify(token, JWT_SECRET) as AuthToken;
    res.json({ valid: true, username: decoded.username });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

export default router;
