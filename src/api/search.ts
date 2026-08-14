import express, { Request, Response } from 'express';
import { container } from '../di/container';
import { MediaService } from '../services/media/media.service';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();
const mediaService = container.resolve(MediaService);

// GET /api/search - Search for music
router.get('/', authenticate, async (req: Request, res: Response) => {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    // Search for music using media service
    const results = await mediaService.searchMusic(query);
    
    res.json({ results });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to search for music',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
