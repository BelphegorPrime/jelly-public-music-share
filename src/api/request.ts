import express, { Request, Response } from 'express';
import { container } from '../di/container';
import { SongPlaybackService } from '../services/song.playback.service';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();
const playbackService = container.resolve(SongPlaybackService);

// POST /api/request - Request access to play a song
router.post('/', authenticate, async (req: Request, res: Response) => {
  const { songId } = req.body;

  if (!songId) {
    return res.status(400).json({ error: 'songId is required' });
  }

  try {
    // Publish song and get token and play URL
    const { token, playUrl } = await playbackService.publishSong(songId);

    res.json({ token, playUrl });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to publish song',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;