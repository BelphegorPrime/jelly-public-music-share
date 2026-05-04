import express, { Request, Response } from 'express';
import { container } from '../di/container';
import { SongPlaybackService } from '../services/song.playback.service';
import { RequestedSongsService } from '../services/requested-songs.service';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();
const playbackService = container.resolve(SongPlaybackService);
const requestedSongsService = container.resolve(RequestedSongsService);

// POST /api/request - Request access to play a song
router.post('/', authenticate, async (req: Request, res: Response) => {
  const { songId } = req.body;

  if (!songId) {
    return res.status(400).json({ error: 'songId is required' });
  }

  try {
    // Request song and get token and play URL
    const { token, playUrl } = await playbackService.requestSong(songId);

    res.json({ token, playUrl });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to request song',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/request - Get all currently requested songs
router.get('/', authenticate, (req: Request, res: Response) => {
  try {
    const requestedSongs = requestedSongsService.getCurrentRequests();
    res.json(requestedSongs);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch requested songs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;