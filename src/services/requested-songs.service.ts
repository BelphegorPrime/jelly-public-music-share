import fs from 'fs';
import path from 'path';
import { injectable, inject } from 'tsyringe';
import { REQUESTED_SONGS_DATA_FILE } from '../config';

export interface RequestedSong {
  songId: string;
  token: string;
  playUrl: string;
  requestedAt: number;
  expiresAt: number;
}

export interface RequestedSongsData {
  songs: RequestedSong[];
}

@injectable()
export class RequestedSongsService {
  private dataFilePath: string;

  constructor(
    @inject('REQUESTED_SONGS_DATA_FILE') dataFilePath?: string
  ) {
    this.dataFilePath = dataFilePath || REQUESTED_SONGS_DATA_FILE;
  }

  /**
   * Load requested songs from file
   */
  private loadData(): RequestedSongsData {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const data = fs.readFileSync(this.dataFilePath, 'utf-8');
        const parsed: RequestedSongsData = JSON.parse(data);
        return parsed;
      }
      return { songs: [] };
    } catch (error) {
      console.error(`Error loading requested songs data: ${error}`);
      return { songs: [] };
    }
  }

  /**
   * Save requested songs to file
   */
  private saveData(data: RequestedSongsData): void {
    try {
      const dataDir = path.dirname(this.dataFilePath);

      // Create data directory if it doesn't exist
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(this.dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`Saved requested songs data to ${this.dataFilePath}`);
    } catch (error) {
      console.error(`Error saving requested songs data: ${error}`);
    }
  }

  /**
   * Add a requested song
   */
  addRequestedSong(songId: string, token: string, playUrl: string, expiresAt: number): void {
    const data = this.loadData();

    const requestedSong: RequestedSong = {
      songId,
      token,
      playUrl,
      requestedAt: Date.now(),
      expiresAt,
    };

    data.songs.push(requestedSong);
    this.saveData(data);

    console.log(`Added requested song: ${songId} (expires at ${new Date(expiresAt).toISOString()})`);
  }

  /**
   * Get all currently valid (non-expired) requested songs
   */
  getCurrentRequests(): RequestedSong[] {
    const data = this.loadData();
    const now = Date.now();

    // Filter out expired songs
    const validSongs = data.songs.filter(song => song.expiresAt > now);

    return validSongs;
  }

  /**
   * Clean up expired requested songs
   */
  cleanupExpiredRequests(): number {
    const data = this.loadData();
    const now = Date.now();

    const beforeCount = data.songs.length;
    data.songs = data.songs.filter(song => song.expiresAt > now);
    const afterCount = data.songs.length;

    if (beforeCount > afterCount) {
      this.saveData(data);
      const removedCount = beforeCount - afterCount;
      console.log(`Cleaned up ${removedCount} expired requested songs`);
      return removedCount;
    }

    return 0;
  }
}
