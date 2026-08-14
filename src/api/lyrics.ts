import express, { Request, Response } from 'express';
import { container } from '../di/container';
import { MediaService } from '../services/media/media.service';
import { EphemeralTokenService } from '../services/token/ephemeral-token.service';

const router = express.Router();
const mediaService = container.resolve(MediaService);
const ephemeralTokenService = container.resolve(EphemeralTokenService);

// GET /api/lyrics/:token - Get lyrics for a song using a valid one-time token
router.get('/:token', async (req: Request, res: Response) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    // Verify token - it should be valid and not expired
    const tokenData = await ephemeralTokenService.verifyToken(token);

    if (!tokenData) {
      return res.status(401).json({ error: 'Token is invalid or expired' });
    }

    const { songId } = tokenData;

    // Fetch lyrics from media service (Jellyfin or Navidrome)
    const lyricsData = await mediaService.getLyrics(songId);
    
    // Note: Lyrics are only available from Jellyfin, so we'll need to handle this differently
    // For now, we'll just return the basic song info
    res.json({
        lyrics: lyricsData?.lyrics || null,
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
