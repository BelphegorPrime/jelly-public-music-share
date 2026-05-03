import fs from 'fs';
import path from 'path';
import { SONG_DOWNLOAD_DIR, TOKEN_EXPIRY_MINUTES } from '../config';

export class CleanupService {
  private readonly MAX_AGE_MS = TOKEN_EXPIRY_MINUTES * 60 * 1000; // 24 hours

  /**
   * Remove old transcoded files from the song download directory
   */
  async cleanupSongFiles(): Promise<number> {
    try {
      const files = await fs.promises.readdir(SONG_DOWNLOAD_DIR);
      let cleanedCount = 0;

      for (const file of files) {
        // Only clean files that end with .mp3 (transcoded files)
        if (file.endsWith('.mp3')) {
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
   * Perform all cleanup operations
   */
  async cleanup(): Promise<{ songs: number }> {
    const songsCleaned = await this.cleanupSongFiles();

    console.log(`Cleanup completed: ${songsCleaned} song files removed`);

    return {
      songs: songsCleaned
    };
  }
}