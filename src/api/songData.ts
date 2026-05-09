import express, { Request, Response } from 'express';
import { container } from '../di/container';
import { JellyfinService } from '../services/jellyfin/jellyfin.service';
import { EphemeralTokenService } from '../services/token/ephemeral-token.service';
import { getSongData } from '../utils/getSongData';

const router = express.Router();
const jellyfinService = container.resolve(JellyfinService);
const ephemeralTokenService = container.resolve(EphemeralTokenService);

// GET /api/songData/:token - Get lyrics for a song using a valid one-time token
router.get('/:token', async (req: Request, res: Response) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    // Verify token - it should be valid and not expired
    const tokenData = ephemeralTokenService.verifyToken(token);

    if (!tokenData) {
      return res.status(401).json({ error: 'Token is invalid or expired' });
    }

    const { songId } = tokenData;

    const itemInfo = await jellyfinService.getMusicById(songId)
    
    res.json({
        itemInfo: itemInfo ? getSongData(itemInfo) : null 
    });
  } catch (error) {
    console.error('Error in /api/songData/:token route:', error);
    res.status(500).json({
      error: 'Failed to fetch lyrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
