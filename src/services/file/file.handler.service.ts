import fs from 'fs';
import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { SongPlaybackService } from '../song.playback.service';

export interface FileHandlerServiceInterface {
  validateFileExists(filePath: string): Promise<boolean>;
  handleFileStream(token: string, res: Response): Promise<void>;
}

@injectable()
export class FileHandlerService implements FileHandlerServiceInterface {
  private playbackService: SongPlaybackService;

  constructor(
    @inject(SongPlaybackService) playbackService: SongPlaybackService
  ) {
    this.playbackService = playbackService;
  }

  async validateFileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async handleFileStream(token: string, res: Response): Promise<void> {
    // Shared file handling logic for streaming
    const result = await this.playbackService.playSong(token);

    if (!result) {
      res.status(401).json({error: 'Token is invalid or expired' });
      return;
    }

    const { filePath } = result;

    if (!(await this.validateFileExists(filePath))) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    // Continue with streaming logic from api/stream.ts
    res.type('audio/mpeg');
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Handle stream errors
    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      res.status(500).send('Internal server error while streaming file');
    });
  }
}