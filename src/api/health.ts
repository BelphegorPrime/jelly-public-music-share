import express, { Request, Response } from 'express';

const router = express.Router();

// GET /health - Health check endpoint
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Jelly Public Music Share'
  });
});

export default router;