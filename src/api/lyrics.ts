import express, { Request, Response } from 'express';
import { container } from '../di/container';
import { JellyfinService } from '../services/jellyfin/jellyfin.service';
import { TokenServiceAdapter } from '../services/token/token.adapter';

const router = express.Router();
const jellyfinService = container.resolve(JellyfinService);
const tokenService = container.resolve(TokenServiceAdapter);

// GET /api/lyrics/:token - Get lyrics for a song using a valid one-time token
router.get('/:token', async (req: Request, res: Response) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    // Verify token - it should be valid and not expired
    const tokenData = tokenService.verifyToken(token);

    if (!tokenData) {
      return res.status(401).json({ error: 'Token is invalid or expired' });
    }

    const { songId } = tokenData;

    // Fetch lyrics from Jellyfin
    const lyricsDto = await jellyfinService.getLyrics(songId);

    if (!lyricsDto) {
      return res.status(404).json({ error: 'Lyrics not found for this song' });
    }

    res.json({
        songId,
        ...lyricsDto
    });
  } catch (error) {
    console.error('Error in /api/lyrics/:token route:', error);
    res.status(500).json({
      error: 'Failed to fetch lyrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
