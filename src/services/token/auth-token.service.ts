import { singleton } from 'tsyringe';
import jwt from 'jsonwebtoken';
import { JWT_SECRET_OWNER, TOKEN_EXPIRY_MINUTES } from '../../config';

export type AuthTokenPayload = jwt.JwtPayload & {
  userId: string;
  username: string;
  issuedAt: number;
};

/**
 * AuthTokenService handles generation and verification of owner authentication tokens
 * These are long-lived tokens used for API authentication (owner/admin access)
 */
@singleton()
export class AuthTokenService {
  private secret: string = JWT_SECRET_OWNER;
  private expiryMinutes: number = TOKEN_EXPIRY_MINUTES;

  constructor() {}

  /**
   * Generate an authentication token for owner/admin login
   */
  generateToken(payload: {
    userId: string;
    username: string;
  }): { token: string; expiresAt: number } {
    const expiresAt = Date.now() + this.expiryMinutes * 60 * 1000;

    const tokenPayload: AuthTokenPayload = {
      ...payload,
      issuedAt: Date.now(),
    };

    console.log(
      `Generating auth token for user: ${payload.username} (ID: ${payload.userId})`
    );

    const token = jwt.sign(tokenPayload, this.secret, {
      expiresIn: `${this.expiryMinutes}min`,
    });

    return { token, expiresAt };
  }

  /**
   * Verify an authentication token
   */
  verifyToken(token: string): AuthTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret) as AuthTokenPayload;
      console.log(`Auth token verified for user: ${decoded.username}`);
      return decoded;
    } catch (error) {
      console.log('Auth token verification failed:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }
}
