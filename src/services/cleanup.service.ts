import fs from 'fs';
import path from 'path';
import { injectable, inject } from 'tsyringe';
import { SONG_DOWNLOAD_DIR, TOKEN_EXPIRY_MINUTES } from '../config';
import { RequestedSongsService } from './requested-songs.service';

@injectable()
export class CleanupService {
  private readonly MAX_AGE_MS = TOKEN_EXPIRY_MINUTES * 60 * 1000; // 24 hours

  constructor(
    @inject(RequestedSongsService) private requestedSongsService: RequestedSongsService
  ) {}

  /**
   * Remove old transcoded files from the song download directory
   */
  async cleanupSongFiles(): Promise<number> {
    try {
      const files = await fs.promises.readdir(SONG_DOWNLOAD_DIR);
      let cleanedCount = 0;

      for (const file of files) {
        // Only clean files that end with .mp3 (transcoded files)
        if (file.endsWith('.mp3') || file.endsWith("_cover.jpg")) {
          const filePath = path.join(SONG_DOWNLOAD_DIR, file);
          try {
            const stats = await fs.promises.stat(filePath);

            // Check if file is older than MAX_AGE_MS
            if (Date.now() - stats.mtime.getTime() > this.MAX_AGE_MS) {
              await fs.promises.unlink(filePath);
              cleanedCount++;
            }
          } catch (error) {
            // Silently ignore errors when accessing individual files
            continue;
          }
        }
      }

      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning song files:', error);
      return 0;
    }
  }

  /**
   * Clean up expired requested songs
   */
  async cleanupExpiredRequests(): Promise<number> {
    return await this.requestedSongsService.cleanupExpiredRequests();
  }

  /**
   * Perform all cleanup operations
   */
  async cleanup(): Promise<{ songs: number; requestedSongs: number }> {
    const songsCleaned = await this.cleanupSongFiles();
    const requestedSongsCleaned = await this.cleanupExpiredRequests();

    console.log(`Cleanup completed: ${songsCleaned} song files removed, ${requestedSongsCleaned} expired requests removed`);

    return {
      songs: songsCleaned,
      requestedSongs: requestedSongsCleaned
    };
  }
}