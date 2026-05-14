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

    // Set token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: TOKEN_EXPIRY_MINUTES * 60 * 1000,
    });

    res.json({ token, expiresIn: TOKEN_EXPIRY_MINUTES * 60, expiresAt });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout - Logout (client-side primarily)
router.post('/logout', (req: Request, res: Response) => {
  // Clear the token cookie
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
});

// GET /api/auth/verify - Verify token validity
 router.get('/verify', async (req: Request, res: Response) => {
   try {
     // Try to get token from Authorization header first (Bearer scheme)
     let token: string | null = null;
     const authHeader = req.headers.authorization;
     
     if (authHeader && authHeader.startsWith('Bearer ')) {
       token = authHeader.slice(7);
     } else if (req.cookies?.token) {
       // Fall back to token from cookie
       token = req.cookies.token;
     }

     if (!token) {
       return res.status(401).json({ valid: false, error: 'No token provided' });
     }

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
