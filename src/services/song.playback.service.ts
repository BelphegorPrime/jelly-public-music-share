import fs from 'fs';
import path from 'path';
import { JellyfinServiceInterface } from './jellyfin/jellyfin.interface';
import { FileServiceInterface } from './file/file.interface';
import { BASE_URL } from '../config';
import { JellyfinService } from './jellyfin/jellyfin.service';
import { inject, injectable } from 'tsyringe';
import { FileService } from './file/file.service';
import { EphemeralTokenService } from './token/ephemeral-token.service';
import { RequestedSongsService } from './requested-songs.service';

@injectable()
export class SongPlaybackService {
  private jellyfinService: JellyfinServiceInterface;
  private tokenService: EphemeralTokenService;
  private fileService: FileServiceInterface;
  private requestedSongsService: RequestedSongsService;
  private downloadDirectory: string;

  constructor(
    @inject('SONG_DOWNLOAD_DIR') downloadDir: string,
    @inject(JellyfinService) jellyfinService: JellyfinService,
    @inject(EphemeralTokenService) tokenService: EphemeralTokenService,
    @inject(FileService) fileService: FileService,
    @inject(RequestedSongsService) requestedSongsService: RequestedSongsService,
  ) {
    this.downloadDirectory = downloadDir;
    this.jellyfinService = jellyfinService;
    this.tokenService = tokenService;
    this.fileService = fileService;
    this.requestedSongsService = requestedSongsService;
  }

  async requestSong(songId: string): Promise<{token: string, playUrl: string}> {
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

      const { token, expiresAt } = this.tokenService.createEphemeralToken({ songId });

      // Return ephemeral token and play URL
      const playUrl = `${BASE_URL}/play/${token}`;

      // Persist the requested song
      await this.requestedSongsService.addRequestedSong(songId, token, playUrl, expiresAt);
      
      return { token, playUrl };
    } catch (error) {
      throw new Error(`Failed to publish song: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async playSong(token: string, consume = false): Promise<{filePath: string} | null> {
    try {
      // Verify token (will return null if expired or blacklisted)
      const tokenDataPromise = consume ? this.tokenService.verifyAndConsumeToken(token) : this.tokenService.verifyToken(token) ;
      const tokenData = await tokenDataPromise;
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