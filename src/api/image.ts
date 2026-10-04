import express, { Request, Response } from 'express';
import { container } from '../di/container';
import path from 'node:path';

const router = express.Router();
const downloadDir = container.resolve('SONG_DOWNLOAD_DIR') as string;

// GET /api/image/:songId - get picture files directly
router.get('/:songId', async (req: Request, res: Response) => {
  const { songId } = req.params;

  if (!songId) {
    return res.status(400).json({ error: 'Song ID is required' });
  }

  try {
    const imageFileName = path.join(downloadDir, `${songId}_cover.jpg`);
    
    // send image from location
    res.sendFile(imageFileName, (error) => {
      console.error({ error })
    })
  } catch (error) {
    console.log("Error in /api/image/:songId route:", error);
    res.status(500).send('Internal server error');
  }
});

export default router;