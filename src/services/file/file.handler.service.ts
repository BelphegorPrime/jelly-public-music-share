import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { SongPlaybackService } from '../song.playback.service';

export interface FileHandlerServiceInterface {
  validateFileExists(filePath: string): Promise<boolean>;
  getFileErrorHtml(errorType: 'expired' | 'not-found' | 'access-denied'): string;
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

  getFileHtml(errorType: 'index'): string {
    switch (errorType) {
      case 'index':
        return fs.readFileSync(path.join(__dirname, '../../templates/index.html'), 'utf8');
      default:
        return this.getFileErrorHtml('not-found');
    }
  }

  getFileErrorHtml(errorType: 'expired' | 'not-found' | 'access-denied'): string {
    switch (errorType) {
      case 'expired':
        return fs.readFileSync(path.join(__dirname, '../../templates/expired.html'), 'utf8');
      case 'not-found':
        return fs.readFileSync(path.join(__dirname, '../../templates/not-found.html'), 'utf8');
      case 'access-denied':
        return fs.readFileSync(path.join(__dirname, '../../templates/error.html'), 'utf8');
      default:
        throw new Error(`Unknown error type: ${errorType}`);
    }
  }

  async handleFileStream(token: string, res: Response): Promise<void> {
    // Shared file handling logic for streaming
    const result = await this.playbackService.playSong(token);

    if (!result) {
      res.status(401).send(this.getFileErrorHtml('expired'));
      return;
    }

    const { filePath } = result;

    if (!(await this.validateFileExists(filePath))) {
      res.status(404).send(this.getFileErrorHtml('not-found'));
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