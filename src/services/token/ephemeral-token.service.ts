import { singleton, inject } from 'tsyringe';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { EphemeralTokensRepository } from '../../db/repositories/ephemeral-tokens.repository';
import { JWT_SECRET_CONSUMER, TOKEN_EXPIRY_MINUTES, TOKEN_USAGE_LIMIT } from '../../config';

export type EphemeralTokenPayload = jwt.JwtPayload & {
  tokenId: string;
  songId: string;
  expiresAt: number;
  usageLimit?: number; // Explicitly add usageLimit to type
};


/**
 * EphemeralTokenService handles generation and verification of consumer ephemeral tokens
 * These are short-lived tokens used for direct song access (streaming, downloading)
 * Tokens are single-use or limited-use by default
 */
@singleton()
export class EphemeralTokenService {
  private secret: string = JWT_SECRET_CONSUMER;
  private expiryMinutes: number = TOKEN_EXPIRY_MINUTES;
  private usageLimit: number = TOKEN_USAGE_LIMIT;

  constructor(
    @inject(EphemeralTokensRepository) private ephemeralTokensRepository: EphemeralTokensRepository
  ) {}

  /**
   * Create or update a token usage record in database
   */
  private async createOrUpdateTokenUsage(tokenId: string, usageCount: number, blacklisted: boolean, expiresAt: number): Promise<void> {
    try {
      const tokenEntity = {
        tokenId,
        usageCount,
        blacklisted,
        createdAt: Date.now(),
        expiresAt
      };
      
      await this.ephemeralTokensRepository.createOrUpdate(tokenEntity);
    } catch (error) {
      console.error(`Error creating/updating token usage: ${error}`);
      throw error;
    }
  }

  /**
   * Get token usage record from database
   */
  private async getTokenUsage(tokenId: string): Promise<{usageCount: number, blacklisted: boolean} | null> {
    try {
      const token = await this.ephemeralTokensRepository.getToken(tokenId);
      if (!token) return null;
      
      return {
        usageCount: token.usageCount,
        blacklisted: token.blacklisted
      };
    } catch (error) {
      console.error(`Error getting token usage: ${error}`);
      throw error;
    }
  }

  /**
   * Blacklist a token in database
   */
  private async blacklistTokenInDb(tokenId: string): Promise<void> {
    try {
      await this.ephemeralTokensRepository.blacklistToken(tokenId);
    } catch (error) {
      console.error(`Error blacklisting token in database: ${error}`);
      throw error;
    }
  }

/**
 * Generate an ephemeral token for a song
 */
  generateToken(data: { songId: string }, overrides?: { 
    tokenExpiryMinutes?: number; 
    tokenUsageLimit?: number 
  }): {
    token: string;
    expiresAt: number;
  } {
    const tokenId = uuidv4();
    // Use override or default for expiry minutes
    const expiryMinutes = overrides?.tokenExpiryMinutes ?? this.expiryMinutes;
    const usageLimit = overrides?.tokenUsageLimit ?? this.usageLimit;
    const expiresAt = Date.now() + expiryMinutes * 60 * 1000;
    console.log(
      `Generating ephemeral token with ID: ${tokenId} for song ID: ${data.songId}`
    );
    console.log(`Token expires at: ${new Date(expiresAt).toISOString()}`);

    const payload: EphemeralTokenPayload = {
      ...data,
      tokenId,
      expiresAt,
      usageLimit // Add the usage limit to the token payload so it can be verified later
    };

    const token = jwt.sign(payload, this.secret, {
      expiresIn: `${expiryMinutes}min`,
    });
    return { token, expiresAt };
  }

  /**
   * Verify an ephemeral token (returns null if expired or blacklisted)
   */
  async verifyToken(token: string): Promise<EphemeralTokenPayload | null> {
    try {
      const decoded = jwt.verify(token, this.secret) as EphemeralTokenPayload;
      console.log(`Decoded ephemeral token: ${JSON.stringify(decoded)}`);

      if (decoded.expiresAt < Date.now()) {
        return null;
      }

      // Check if token has been blacklisted in database
      // We'll delegate this check to isTokenBlacklisted method
      const isBlacklisted = await this.isTokenBlacklisted(decoded.tokenId)
      if (isBlacklisted) {
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
  async verifyAndConsumeToken(token: string): Promise<EphemeralTokenPayload | null> {
    // Reuse verifyToken logic to avoid code duplication
    const verifiedToken = await this.verifyToken(token);

    // If token is invalid/expired/blacklisted, return null
    if (!verifiedToken) {
      return null;
    }

    // Get current usage count for this token from database
    const tokenUsage = await this.getTokenUsage(verifiedToken.tokenId);
    
    let currentUsage = 0;
    let blacklisted = false;
    
    if (tokenUsage) {
      currentUsage = tokenUsage.usageCount;
      blacklisted = tokenUsage.blacklisted;
    }

    // If token already blacklisted, reject
    if (blacklisted) {
      return null;
    }

    // Increment usage count
    const newUsage = currentUsage + 1;

    // Check if usage limit has been reached
    // The usageLimit should come from the token payload if it exists (from override)
    // If not, fallback to class default
    const tokenUsageLimit = verifiedToken.usageLimit ?? this.usageLimit;
    console.log(
      `Ephemeral token ${verifiedToken.tokenId} usage: ${newUsage}/${tokenUsageLimit}`
    );
    
    if (newUsage <= tokenUsageLimit) {
      // Update usage count in database
      await this.createOrUpdateTokenUsage(verifiedToken.tokenId, newUsage, false, verifiedToken.expiresAt);
      // Return the token data
      return verifiedToken;
    }

    // Blacklist token if usage limit is exceeded
    await this.blacklistTokenInDb(verifiedToken.tokenId);
    return null; // Return null to indicate token consumption and blacklisting
  }

  /**
   * Blacklist an ephemeral token
   */
  async blacklistToken(tokenId: string): Promise<void> {
    await this.blacklistTokenInDb(tokenId);
  }

  /**
   * Check if an ephemeral token is blacklisted
   */
  async isTokenBlacklisted(tokenId: string): Promise<boolean> {
    try {
      return await this.ephemeralTokensRepository.isBlacklisted(tokenId);
    } catch (error) {
      console.error(`Error checking if token is blacklisted: ${error}`);
      throw error;
    }
  }

/**
 * Create a new ephemeral token for a song
 */
  createEphemeralToken(data: { songId: string }, overrides?: { 
    tokenExpiryMinutes?: number; 
    tokenUsageLimit?: number 
  }): {
    token: string;
    expiresAt: number;
  } {
    return this.generateToken(data, overrides);
  }

  /**
   * Clear blacklisted tokens (optional cleanup)
   */
  async clearBlacklistedTokens(): Promise<void> {
    // With DB, we don't need to clear, all data should be maintained in DB
    // Just log this action
    console.log("clearBlacklistedTokens called - no-op in DB mode");
  }

  /**
   * Reset usage count for a token (for testing or special cases)
   */
  async resetTokenUsage(tokenId: string): Promise<void> {
    try {
      // Delete the token record from database
      await this.ephemeralTokensRepository.deleteToken(tokenId);
    } catch (error) {
      console.error(`Error resetting token usage: ${error}`);
      throw error;
    }
  }

  /**
   * Get current usage count for an ephemeral token
   */
  async getTokenUsageFromDb(tokenId: string): Promise<number> {
    try {
      const token = await this.ephemeralTokensRepository.getToken(tokenId);
      return token ? token.usageCount : 0;
    } catch (error) {
      console.error(`Error getting token usage from DB: ${error}`);
      throw error;
    }
  }
}
