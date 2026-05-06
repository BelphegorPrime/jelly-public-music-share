import express, { Request, Response } from 'express';
import { container } from '../di/container';
import { JellyfinService } from '../services/jellyfin/jellyfin.service';
import { JELLYFIN_URL } from '../config';
import { authenticate } from '../middleware/auth.middleware';
import { getDurartionInMinutesAndSeconds } from '../utils/getDurartionInMinutesAndSeconds';
import { getSongData } from '../utils/getSongData';

const router = express.Router();
const jellyfinService = container.resolve(JellyfinService);

// GET /api/search - Search for music
router.get('/', authenticate, async (req: Request, res: Response) => {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    // Search for music using Jellyfin service
    const results = await jellyfinService.searchMusic(query);
    
    // Format results to include essential information
    const formattedResults = results.map(item => getSongData(item));

    res.json({ results: formattedResults });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to search for music',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;