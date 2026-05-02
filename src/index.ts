import "reflect-metadata";

import path from "node:path";
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// DI Container
import { container } from './di/container';

// API Routes
import requestRouter from './api/request';
import playRouter from './api/play';
import streamRouter from './api/stream';
import healthRouter from './api/health';
import searchRouter from './api/search';

import { CleanupService } from './services/cleanup.service';
import { NODE_ENV, PORT, TOKEN_EXPIRY_MINUTES } from './config';
import { FileHandlerService } from './services/file/file.handler.service';
import { authenticate } from "./middleware/auth.middleware";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

const fileHandlerService = container.resolve(FileHandlerService)

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')))

// Routes
app.get('/', authenticate, (req, res) => {
  const htmlContent = fileHandlerService.getFileHtml('index');
  return res.status(200).type('html').send(htmlContent);
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/request', requestRouter);
app.use('/play', playRouter);
app.use('/stream', streamRouter);
app.use('/health', healthRouter);
app.use('/search', searchRouter);

// Start cleanup timer (runs every 24 hours)
const cleanupService = container.resolve(CleanupService);
setInterval(async () => {
  try {
    await cleanupService.cleanup();
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}, TOKEN_EXPIRY_MINUTES * 1000); // 24 hours in milliseconds

// Export app for testing
export default app;

// Start server if not in test environment
if (NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Run cleanup immediately on startup to clean up any lingering files
    cleanupService.cleanup()
      .catch(error => console.error('Initial cleanup failed:', error));
  });
}