import express, { Request, Response } from 'express';
import { container } from '../di/container';
import { SongPlaybackService } from '../services/song.playback.service';
import { FileHandlerService } from '../services/file/file.handler.service';

type ValidateResponse = {
  valid: boolean;
  expired?: boolean;
  notFound?: boolean;
  error?: string | null;
};

const router = express.Router();
const playbackService = container.resolve(SongPlaybackService);
const fileHandlerService = container.resolve(FileHandlerService);

// GET /play/:token - Play a song using token
router.get('/:token', async (req: Request, res: Response<ValidateResponse>) => {
  const { token } = req.params;

  if (!token) {
      return res.status(400).json({ valid: false, expired: false, notFound: false, error: 'Token is required' });
  }

  try {
    // Play song and get file path
    const result = await playbackService.playSong(token, true);

    if (!result) {
        return res.status(401).json({ valid: false, expired: true, notFound: false, error: 'Token is invalid or expired' });
    }
    console.log('Play song result:', result);
    const { filePath } = result;

    // Check if file exists before attempting to stream
    try {
        await fileHandlerService.validateFileExists(filePath);
        console.log(`File exists, allow playback: ${filePath}`);
    } catch (error) {
        console.log(`File doesn't exist: ${filePath}`);
        return res.status(404).json({ valid: false, expired: false, notFound: true, error: 'File not found' });
    }

    return res.status(200).json({ valid: true });
  } catch (error) {
    console.log("Error in /play/:token route:", error);
    return res.status(200).json({ valid: false, expired: false, notFound: false, error: "Internal Server Error" });
  }
});

export default router;