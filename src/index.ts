import "reflect-metadata";

import path from "node:path";
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// DI Container
import { container } from './di/container';

// API Routes
import healthRouter from './api/health';
import authRouter from './api/auth';
import searchRouter from './api/search';
import requestRouter from './api/request';
import validateRouter from './api/validate';
import streamRouter from './api/stream';

import { CleanupService } from './services/cleanup.service';
import { NODE_ENV, PORT, TOKEN_EXPIRY_MINUTES } from './config';
import { authenticate } from "./middleware/auth.middleware";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", "https:", "data:"],
        mediaSrc: ["'self'", "https:", "blob:", "data:"],
      },
    },
  })
);
app.use(cors());
app.use(express.json());

const clientPath = path.join(process.cwd(), 'client/dist');
app.use(express.static(clientPath));

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/search', searchRouter);
app.use('/api/request', requestRouter);
app.use('/api/validate', validateRouter);
app.use('/api/stream', streamRouter);

app.get('*', authenticate, (_, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Start cleanup timer (runs every 24 hours)
const cleanupService = container.resolve(CleanupService);
setInterval(async () => {
  try {
    await cleanupService.cleanup();
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}, TOKEN_EXPIRY_MINUTES * 60 * 1000); // 24 hours in milliseconds

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