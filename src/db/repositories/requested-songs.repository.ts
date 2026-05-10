import { injectable, inject } from 'tsyringe';
import { eq, lt, gt } from 'drizzle-orm';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../schema';
import { DatabaseService } from '../database.service';

export interface RequestedSongEntity {
  token: string;
  songId: string;
  playUrl: string;
  requestedAt: number;
  expiresAt: number;
}

/**
 * RequestedSongsRepository
 *
 * Handles all database operations for requested songs.
 * Abstracts away Drizzle ORM details from business logic.
 */
@injectable()
export class RequestedSongsRepository {
  private db: BetterSQLite3Database<typeof schema>;

  constructor(@inject(DatabaseService) dbService: DatabaseService) {
    this.db = dbService.db;
  }

  /**
   * Add a new requested song
   */
  async addRequestedSong(song: RequestedSongEntity): Promise<void> {
    try {
      this.db
        .insert(schema.requestedSongs)
        .values(song)
        .run();

      console.log(
        `Added requested song: ${song.songId} (token: ${song.token}, expires: ${new Date(song.expiresAt).toISOString()})`
      );
    } catch (error) {
      console.error(`Error adding requested song: ${error}`);
      throw error;
    }
  }

  /**
   * Get a requested song by token
   */
  async getByToken(token: string): Promise<RequestedSongEntity | null> {
    try {
      const result = this.db
        .select()
        .from(schema.requestedSongs)
        .where(eq(schema.requestedSongs.token, token))
        .get();

      return result || null;
    } catch (error) {
      console.error(`Error fetching requested song: ${error}`);
      throw error;
    }
  }

  /**
   * Get all currently valid (non-expired) requested songs
   */
  async getCurrentRequests(): Promise<RequestedSongEntity[]> {
    try {
      const now = Date.now();
       const results = this.db
         .select()
         .from(schema.requestedSongs)
         .where(gt(schema.requestedSongs.expiresAt, now))
         .all();

      return results;
    } catch (error) {
      console.error(`Error fetching current requests: ${error}`);
      throw error;
    }
  }

  /**
   * Clean up expired requested songs
   */
  async cleanupExpiredRequests(): Promise<number> {
    try {
      const now = Date.now();
      const result = this.db
        .delete(schema.requestedSongs)
        .where(lt(schema.requestedSongs.expiresAt, now))
        .run();

      console.log(`Cleaned up ${result.changes} expired requested songs`);
      return result.changes;
    } catch (error) {
      console.error(`Error during cleanup: ${error}`);
      throw error;
    }
  }

  /**
   * Delete a requested song by token
   */
  async deleteByToken(token: string): Promise<boolean> {
    try {
      const result = this.db
        .delete(schema.requestedSongs)
        .where(eq(schema.requestedSongs.token, token))
        .run();

      return result.changes > 0;
    } catch (error) {
      console.error(`Error deleting requested song: ${error}`);
      throw error;
    }
  }

  /**
   * Get count of all requested songs
   */
  async count(): Promise<number> {
    try {
      const result = this.db
        .select({ count: schema.requestedSongs.token })
        .from(schema.requestedSongs)
        .all();

      return result.length;
    } catch (error) {
      console.error(`Error counting requested songs: ${error}`);
      throw error;
    }
  }
}
