import express, { Request, Response } from 'express';
import { container } from '../di/container';
import { FileHandlerService } from '../services/file/file.handler.service';

const router = express.Router();
const fileHandlerService = container.resolve(FileHandlerService);

// GET /api/stream/:token - Stream audio file directly
router.get('/:token', async (req: Request, res: Response) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    // Use centralized file handler service
    await fileHandlerService.handleFileStream(token, res);
  } catch (error) {
    console.log("Error in /api/stream/:token route:", error);
    res.status(500).send('Internal server error');
  }
});

export default router;