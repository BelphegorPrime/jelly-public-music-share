import express, { Request, Response } from 'express';
import { container } from '../di/container';
import { JellyfinService } from '../services/jellyfin/jellyfin.service';
import { JELLYFIN_URL } from '../config';
import { authenticate } from '../middleware/auth.middleware';

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

    const getDurartionInMinutesAndSeconds = (ticks: number): [number, number] => {
      const totalSeconds = Math.floor(ticks / 10000000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return [minutes, seconds];
    };
    
    // Format results to include essential information
    const formattedResults = results.map(item => ({
      id: item.Id,
      name: item.Name,
      album: item.Album,
      artist: item.ArtistItems?.[0]?.Name || 'Unknown Artist',
      duration: item.RunTimeTicks ? getDurartionInMinutesAndSeconds(item.RunTimeTicks) : 0, // Convert ticks to seconds
      type: item.Type,
      image: item.ImageTags?.Primary ? `${JELLYFIN_URL}/Items/${item.Id}/Images/Primary?tag=${item.ImageTags.Primary}&maxWidth=200` : null
    }));

    res.json({ results: formattedResults });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to search for music',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;