import { injectable, inject } from 'tsyringe';
import { RequestedSongsRepository } from '../db/repositories/requested-songs.repository';

export interface RequestedSong {
  songId: string;
  token: string;
  playUrl: string;
  requestedAt: number;
  expiresAt: number;
}


@injectable()
export class RequestedSongsService {
  constructor(
    @inject(RequestedSongsRepository) private requestedSongsRepository: RequestedSongsRepository
  ) {
  }

  /**
   * Add a requested song
   */
  async addRequestedSong(songId: string, token: string, playUrl: string, expiresAt: number): Promise<void> {
    const requestedSongEntity = {
      token,
      songId,
      playUrl,
      requestedAt: Date.now(),
      expiresAt
    };

    try {
      await this.requestedSongsRepository.addRequestedSong(requestedSongEntity);
      console.log(`Added requested song: ${songId} (token: ${token}, expires at ${new Date(expiresAt).toISOString()})`);
    } catch (error) {
      console.error(`Error adding requested song to database: ${error}`);
      throw error;
    }
  }

  /**
   * Get all currently valid (non-expired) requested songs
   */
  async getCurrentRequests(): Promise<RequestedSong[]> {
    try {
      const songs = await this.requestedSongsRepository.getCurrentRequests();
      
      // Convert the database entities to our service format
      return songs.map(song => ({
        songId: song.songId,
        token: song.token,
        playUrl: song.playUrl,
        requestedAt: song.requestedAt,
        expiresAt: song.expiresAt
      }));
    } catch (error) {
      console.error(`Error getting current requests from database: ${error}`);
      throw error;
    }
  }

  /**
   * Clean up expired requested songs
   */
  async cleanupExpiredRequests(): Promise<number> {
    try {
      const deletedCount = await this.requestedSongsRepository.cleanupExpiredRequests();
      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} expired requested songs`);
      }
      return deletedCount;
    } catch (error) {
      console.error(`Error cleaning up expired requests: ${error}`);
      throw error;
    }
  }
}
