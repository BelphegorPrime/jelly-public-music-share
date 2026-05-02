import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { JWT_SECRET, TOKEN_EXPIRY_MINUTES, TOKEN_USAGE_LIMIT } from '../../config';

export interface TokenPayload {
  tokenId: string;
  songId: string;
  expiresAt: number;
}

export class TokenService {
  private secret: string;
  private blacklistedTokens: Set<string>;
  private tokenExpiryMinutes: number;
  private tokenUsageLimit: number;
  private usageCounts: Map<string, number>; // Track usage count per token ID

  // Singleton instance
  private static instance: TokenService;

  private constructor(secret: string = JWT_SECRET, expiryMinutes: number = TOKEN_EXPIRY_MINUTES, usageLimit: number = TOKEN_USAGE_LIMIT) {
    this.secret = secret;
    this.blacklistedTokens = new Set<string>();
    this.tokenExpiryMinutes = expiryMinutes;
    this.tokenUsageLimit = usageLimit;
    this.usageCounts = new Map<string, number>(); // Initialize usage tracking
  }

  /**
   * Get the singleton instance of TokenService
   */
  public static getInstance(secret?: string, expiryMinutes?: number, usageLimit?: number): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService(secret, expiryMinutes, usageLimit);
    }
    return TokenService.instance;
  }

  /**
   * Generate a JWT token
   */
  generateToken(data: { songId: string }): string {
    const tokenId = uuidv4();
    const payload: TokenPayload = {
      ...data,
      tokenId,
      expiresAt: Date.now() + (this.tokenExpiryMinutes * 60 * 1000),
    };

    return jwt.sign(payload, this.secret, { expiresIn: `${this.tokenExpiryMinutes}min` });
  }

  /**
   * Verify a token (returns null if expired or blacklisted)
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret) as TokenPayload;

      // Check if token has expired
      if (decoded.expiresAt < Date.now()) {
        return null;
      }

      // Check if token has been blacklisted
      if (this.blacklistedTokens.has(decoded.tokenId)) {
        return null;
      }

      return decoded;
    } catch (error) {
      // Token is invalid or expired
      return null;
    }
  }

  /**
   * Verify a token and consume it (returns null if expired, blacklisted, or usage limit reached)
   */
  verifyAndConsumeToken(token: string): TokenPayload | null {
    // Reuse verifyToken logic to avoid code duplication
    const verifiedToken = this.verifyToken(token);

    // If token is invalid/expired/blacklisted, return null
    if (!verifiedToken) {
      return null;
    }

    // Get current usage count for this token
    const currentUsage = this.usageCounts.get(verifiedToken.tokenId) || 0;

    // Increment usage count
    const newUsage = currentUsage + 1;
    this.usageCounts.set(verifiedToken.tokenId, newUsage);

    console.log(`Token ${verifiedToken.tokenId} usage: ${newUsage}/${this.tokenUsageLimit}`);

    // Check if usage limit has been reached
    if (newUsage <= this.tokenUsageLimit) {
      // Return the token data (without updating usage in JWT as that's not possible)
      return verifiedToken;
    }

    // Blacklist token if usage limit is exceeded
    this.blacklistedTokens.add(verifiedToken.tokenId);
    return null; // Return null to indicate token consumption and blacklisting
  }

  /**
   * Blacklist a token
   */
  blacklistToken(tokenId: string): void {
    this.blacklistedTokens.add(tokenId);
  }

  /**
   * Check if token is blacklisted
   */
  isTokenBlacklisted(tokenId: string): boolean {
    return this.blacklistedTokens.has(tokenId);
  }

  /**
   * Generate a new ephemeral token for a song
   */
  createEphemeralToken(data: { songId: string }): string {
    // Token valid for 1 day (1440 minutes)
    return this.generateToken(data);
  }

  /**
   * Clear blacklisted tokens (optional cleanup)
   */
  clearBlacklistedTokens(): void {
    this.blacklistedTokens.clear();
  }

  /**
   * Reset usage count for a token (for testing or special cases)
   */
  resetTokenUsage(tokenId: string): void {
    this.usageCounts.delete(tokenId);
  }

  /**
   * Get current usage count for a token
   */
  getTokenUsage(tokenId: string): number {
    return this.usageCounts.get(tokenId) || 0;
  }
}