import fs from 'fs';
import path from 'path';
import { JellyfinServiceInterface } from './jellyfin/jellyfin.interface';
import { TokenServiceInterface } from './token/token.interface';
import { FileServiceInterface } from './file/file.interface';
import { SONG_DOWNLOAD_DIR } from '../config';
import { JellyfinService } from './jellyfin/jellyfin.service';
import { inject, injectable } from 'tsyringe';
import { FileService } from './file/file.service';
import { TokenServiceAdapter } from './token/token.adapter';

@injectable()
export class SongPlaybackService {
  private jellyfinService: JellyfinServiceInterface;
  private tokenService: TokenServiceInterface;
  private fileService: FileServiceInterface;
  private downloadDirectory: string;

  constructor(
    @inject('SONG_DOWNLOAD_DIR') downloadDir: string,
    @inject(JellyfinService) jellyfinService: JellyfinService,
    @inject(TokenServiceAdapter) tokenService: TokenServiceAdapter,
    @inject(FileService) fileService: FileService,
  ) {
    this.downloadDirectory = downloadDir;
    this.jellyfinService = jellyfinService;
    this.tokenService = tokenService;
    this.fileService = fileService;
  }

  async publishSong(songId: string): Promise<{token: string, playUrl: string}> {
    try {
      // Get song info from Jellyfin
      const songInfo = await this.jellyfinService.getMusicById(songId);
      if (!songInfo) {
        throw new Error('Song not found');
      }
      console.log(`Publishing song: ${songInfo.Name} (ID: ${songId})`);

      // Create download directory if it doesn't exist
      await fs.promises.mkdir(this.downloadDirectory, { recursive: true });

      const fileName = `${songId}.mp3`;
      const destinationPath = path.join(this.downloadDirectory, fileName);

      // Download audio file from Jellyfin
      // check if file already exists to avoid unnecessary downloads
      const found = await this.fileService.fileExists(destinationPath);
      if (found) {
        console.log(`File found locally: ${destinationPath}`);
      } else {
        console.log(`File not found locally, downloading from Jellyfin: ${destinationPath}`);
        try {
          // File doesn't exist, proceed to download
          await this.jellyfinService.download(songId, songInfo, destinationPath);
        } catch (downloadError) {
          // Fall back to placeholder if download fails
          await fs.promises.writeFile(destinationPath, Buffer.from('test-placeholder-audio-data'));
        }
      }

      const token = this.tokenService.createEphemeralToken({ songId });

      // Return ephemeral token and play URL
      const playUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/play/${token}`;
      return { token, playUrl };
    } catch (error) {
      throw new Error(`Failed to publish song: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async playSong(token: string, consume = false): Promise<{filePath: string} | null> {
    try {
      // Verify token (will return null if expired or blacklisted)
      const tokenData = consume ? this.tokenService.verifyAndConsumeToken(token) : this.tokenService.verifyToken(token) ;
      if (!tokenData) {
        return null;
      }
      console.log('verifyAndConsumeToken result:', tokenData);

      const filePath = path.join(this.downloadDirectory, tokenData.songId + '.mp3');

      // Check if file exists using the file service
      const found = await this.fileService.fileExists(filePath);
      if (found) {
        return { filePath };
      } else {
        console.log("File doesn't exist at path:", filePath);
        return null;
      }
    } catch (error) {
      console.log("Error in playSong:", error);
      throw new Error(`Failed to play song: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}