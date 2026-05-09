import { singleton } from 'tsyringe';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { JWT_SECRET_CONSUMER, TOKEN_EXPIRY_MINUTES, TOKEN_USAGE_DATA_FILE, TOKEN_USAGE_LIMIT } from '../../config';

export type EphemeralTokenPayload = jwt.JwtPayload & {
  tokenId: string;
  songId: string;
  expiresAt: number;
};

export interface TokenUsageData {
  usageCounts: Record<string, number>;
  blacklistedTokens: string[];
}

/**
 * EphemeralTokenService handles generation and verification of consumer ephemeral tokens
 * These are short-lived tokens used for direct song access (streaming, downloading)
 * Tokens are single-use or limited-use by default
 */
@singleton()
export class EphemeralTokenService {
  private blacklistedTokens: Set<string>;
  private usageCounts: Map<string, number>; // Track usage count per token ID
  private secret: string = JWT_SECRET_CONSUMER;
  private expiryMinutes: number = TOKEN_EXPIRY_MINUTES;
  private usageLimit: number = TOKEN_USAGE_LIMIT;
  private dataFilePath: string = TOKEN_USAGE_DATA_FILE;

  constructor() {
    this.blacklistedTokens = new Set<string>();
    this.usageCounts = new Map<string, number>();

    // Load persisted data on initialization
    this.loadUsageData();
  }

  /**
   * Load usage data from file
   */
  private loadUsageData(): void {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const data = fs.readFileSync(this.dataFilePath, 'utf-8');
        const parsed: TokenUsageData = JSON.parse(data);

        // Restore usage counts
        this.usageCounts = new Map(Object.entries(parsed.usageCounts));

        // Restore blacklisted tokens
        this.blacklistedTokens = new Set(parsed.blacklistedTokens);

        console.log(`Loaded ephemeral token usage data from ${this.dataFilePath}`);
        console.log(
          `Restored ${this.usageCounts.size} token usage records and ${this.blacklistedTokens.size} blacklisted tokens`
        );
      } else {
        console.log(
          `Ephemeral token usage file does not exist yet: ${this.dataFilePath}`
        );
      }
    } catch (error) {
      console.error(`Error loading ephemeral token usage data: ${error}`);
      // Continue with empty state if loading fails
    }
  }

  /**
   * Save usage data to file
   */
  private saveUsageData(): void {
    try {
      const dataDir = path.dirname(this.dataFilePath);

      // Create data directory if it doesn't exist
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const data: TokenUsageData = {
        usageCounts: Object.fromEntries(this.usageCounts),
        blacklistedTokens: Array.from(this.blacklistedTokens),
      };

      fs.writeFileSync(this.dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`Saved ephemeral token usage data to ${this.dataFilePath}`);
    } catch (error) {
      console.error(`Error saving ephemeral token usage data: ${error}`);
    }
  }

  /**
   * Generate an ephemeral token for a song
   */
  generateToken(data: { songId: string }): {
    token: string;
    expiresAt: number;
  } {
    const tokenId = uuidv4();
    const expiresAt = Date.now() + this.expiryMinutes * 60 * 1000;
    console.log(
      `Generating ephemeral token with ID: ${tokenId} for song ID: ${data.songId}`
    );
    console.log(`Token expires at: ${new Date(expiresAt).toISOString()}`);

    const payload: EphemeralTokenPayload = {
      ...data,
      tokenId,
      expiresAt,
    };

    const token = jwt.sign(payload, this.secret, {
      expiresIn: `${this.expiryMinutes}min`,
    });
    return { token, expiresAt };
  }

  /**
   * Verify an ephemeral token (returns null if expired or blacklisted)
   */
  verifyToken(token: string): EphemeralTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret) as EphemeralTokenPayload;
      console.log(`Decoded ephemeral token: ${JSON.stringify(decoded)}`);

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
   * Verify and consume an ephemeral token (tracks usage and enforces limits)
   */
  verifyAndConsumeToken(token: string): EphemeralTokenPayload | null {
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

    console.log(
      `Ephemeral token ${verifiedToken.tokenId} usage: ${newUsage}/${this.usageLimit}`
    );

    // Check if usage limit has been reached
    if (newUsage <= this.usageLimit) {
      // Save usage data after incrementing
      this.saveUsageData();
      // Return the token data (without updating usage in JWT as that's not possible)
      return verifiedToken;
    }

    // Blacklist token if usage limit is exceeded
    this.blacklistedTokens.add(verifiedToken.tokenId);
    // Save usage data after blacklisting
    this.saveUsageData();
    return null; // Return null to indicate token consumption and blacklisting
  }

  /**
   * Blacklist an ephemeral token
   */
  blacklistToken(tokenId: string): void {
    this.blacklistedTokens.add(tokenId);
    this.saveUsageData();
  }

  /**
   * Check if an ephemeral token is blacklisted
   */
  isTokenBlacklisted(tokenId: string): boolean {
    return this.blacklistedTokens.has(tokenId);
  }

  /**
   * Create a new ephemeral token for a song
   */
  createEphemeralToken(data: { songId: string }): {
    token: string;
    expiresAt: number;
  } {
    return this.generateToken(data);
  }

  /**
   * Clear blacklisted tokens (optional cleanup)
   */
  clearBlacklistedTokens(): void {
    this.blacklistedTokens.clear();
    this.saveUsageData();
  }

  /**
   * Reset usage count for a token (for testing or special cases)
   */
  resetTokenUsage(tokenId: string): void {
    this.usageCounts.delete(tokenId);
    this.saveUsageData();
  }

  /**
   * Get current usage count for an ephemeral token
   */
  getTokenUsage(tokenId: string): number {
    return this.usageCounts.get(tokenId) || 0;
  }
}
