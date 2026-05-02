import dotenv from 'dotenv';
dotenv.config();

export const JELLYFIN_URL = process.env.JELLYFIN_URL || '';
export const JELLYFIN_USERNAME = process.env.JELLYFIN_USERNAME || '';
export const JELLYFIN_API_KEY = process.env.JELLYFIN_API_KEY || '';

export const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
export const TOKEN_EXPIRY_MINUTES = process.env.TOKEN_EXPIRY_MINUTES ?
  parseInt(process.env.TOKEN_EXPIRY_MINUTES) :
  1440; // 24 hours
export const TOKEN_USAGE_LIMIT = process.env.TOKEN_USAGE_LIMIT ?
  parseInt(process.env.TOKEN_USAGE_LIMIT) :
  1; // Default to 1 use before blacklisting
export const SONG_DOWNLOAD_DIR = process.env.SONG_DOWNLOAD_DIR || '/public/songs';

// Validate required environment variables only in non-test environments
if (process.env.NODE_ENV !== 'test' && (!JELLYFIN_URL || !JELLYFIN_USERNAME || !JELLYFIN_API_KEY)) {
  throw new Error('Missing required Jellyfin environment variables');
}