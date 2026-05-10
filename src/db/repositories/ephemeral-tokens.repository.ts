import { injectable, inject } from 'tsyringe';
import { eq, lt, gt } from 'drizzle-orm';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../schema';
import { DatabaseService } from '../database.service';

export interface EphemeralTokenEntity {
  tokenId: string;
  usageCount: number;
  blacklisted: boolean;
  createdAt: number;
  expiresAt: number;
}

/**
 * EphemeralTokensRepository
 *
 * Handles all database operations for ephemeral token usage and blacklist.
 * Abstracts away Drizzle ORM details from business logic.
 */
@injectable()
export class EphemeralTokensRepository {
  private db: BetterSQLite3Database<typeof schema>;

  constructor(@inject(DatabaseService) dbService: DatabaseService) {
    this.db = dbService.db;
  }

  /**
   * Create or update a token usage record
   */
  async createOrUpdate(token: EphemeralTokenEntity): Promise<void> {
    try {
      const existing = this.db
        .select()
        .from(schema.ephemeralTokenUsage)
        .where(eq(schema.ephemeralTokenUsage.tokenId, token.tokenId))
        .get();

      if (existing) {
        this.db
          .update(schema.ephemeralTokenUsage)
          .set({
            usageCount: token.usageCount,
            blacklisted: token.blacklisted ? true : false,
            expiresAt: token.expiresAt,
          })
          .where(eq(schema.ephemeralTokenUsage.tokenId, token.tokenId))
          .run();
      } else {
        this.db
          .insert(schema.ephemeralTokenUsage)
          .values({
            tokenId: token.tokenId,
            usageCount: token.usageCount,
            blacklisted: token.blacklisted ? true : false,
            createdAt: token.createdAt,
            expiresAt: token.expiresAt,
          })
          .run();
      }

      console.log(
        `Token ${token.tokenId} usage count: ${token.usageCount}, blacklisted: ${token.blacklisted}`
      );
    } catch (error) {
      console.error(`Error creating/updating token: ${error}`);
      throw error;
    }
  }

  /**
   * Get token usage record
   */
  async getToken(tokenId: string): Promise<EphemeralTokenEntity | null> {
    try {
      const result = this.db
        .select()
        .from(schema.ephemeralTokenUsage)
        .where(eq(schema.ephemeralTokenUsage.tokenId, tokenId))
        .get();

      if (!result) return null;

      return result;
    } catch (error) {
      console.error(`Error fetching token: ${error}`);
      throw error;
    }
  }

  /**
   * Increment token usage count
   */
  async incrementUsage(tokenId: string): Promise<number> {
    try {
      const token = await this.getToken(tokenId);
      if (!token) {
        throw new Error(`Token not found: ${tokenId}`);
      }

      const newCount = token.usageCount + 1;
      this.db
        .update(schema.ephemeralTokenUsage)
        .set({ usageCount: newCount })
        .where(eq(schema.ephemeralTokenUsage.tokenId, tokenId))
        .run();

      console.log(`Incremented usage for token ${tokenId} to ${newCount}`);
      return newCount;
    } catch (error) {
      console.error(`Error incrementing token usage: ${error}`);
      throw error;
    }
  }

  /**
   * Blacklist a token
   */
  async blacklistToken(tokenId: string): Promise<void> {
    try {
      this.db
        .update(schema.ephemeralTokenUsage)
        .set({ blacklisted: true })
        .where(eq(schema.ephemeralTokenUsage.tokenId, tokenId))
        .run();

      console.log(`Blacklisted token: ${tokenId}`);
    } catch (error) {
      console.error(`Error blacklisting token: ${error}`);
      throw error;
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isBlacklisted(tokenId: string): Promise<boolean> {
    try {
      const result = this.db
        .select()
        .from(schema.ephemeralTokenUsage)
        .where(eq(schema.ephemeralTokenUsage.tokenId, tokenId))
        .get();

      return Boolean(result && result.blacklisted);
    } catch (error) {
      console.error(`Error checking blacklist: ${error}`);
      throw error;
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const now = Date.now();
      const result = this.db
        .delete(schema.ephemeralTokenUsage)
        .where(lt(schema.ephemeralTokenUsage.expiresAt, now))
        .run();

      console.log(`Cleaned up ${result.changes} expired tokens`);
      return result.changes;
    } catch (error) {
      console.error(`Error during cleanup: ${error}`);
      throw error;
    }
  }

  /**
   * Delete token record
   */
  async deleteToken(tokenId: string): Promise<boolean> {
    try {
      const result = this.db
        .delete(schema.ephemeralTokenUsage)
        .where(eq(schema.ephemeralTokenUsage.tokenId, tokenId))
        .run();

      return result.changes > 0;
    } catch (error) {
      console.error(`Error deleting token: ${error}`);
      throw error;
    }
  }

  /**
   * Get count of active (non-blacklisted) tokens
   */
  async countActive(): Promise<number> {
    try {
      const result = this.db
        .select()
        .from(schema.ephemeralTokenUsage)
        .where(eq(schema.ephemeralTokenUsage.blacklisted, false))
        .all();

      return result.length;
    } catch (error) {
      console.error(`Error counting active tokens: ${error}`);
      throw error;
    }
  }
}
