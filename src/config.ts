import dotenv from 'dotenv';
dotenv.config();

export const DATA_DIR = process.env.DATA_DIR || '/data';
export const SONG_DOWNLOAD_DIR = process.env.SONG_DOWNLOAD_DIR || `${DATA_DIR}/songs`;

export const JELLYFIN_URL = process.env.JELLYFIN_URL || '';
export const JELLYFIN_USERNAME = process.env.JELLYFIN_USERNAME || '';
export const JELLYFIN_API_KEY = process.env.JELLYFIN_API_KEY || '';

export const NAVIDROME_URL = process.env.NAVIDROME_URL || '';
export const NAVIDROME_USERNAME = process.env.NAVIDROME_USERNAME || '';
export const NAVIDROME_PASSWORD = process.env.NAVIDROME_PASSWORD || '';

export const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Separate JWT secrets for owner (authentication) and consumer (ephemeral song tokens)
export const JWT_SECRET_OWNER = process.env.JWT_SECRET_OWNER || process.env.JWT_SECRET || 'default-owner-secret-key';
export const JWT_SECRET_CONSUMER = process.env.JWT_SECRET_CONSUMER || process.env.JWT_SECRET || 'default-consumer-secret-key';

export const TOKEN_EXPIRY_MINUTES = process.env.TOKEN_EXPIRY_MINUTES ?
  parseInt(process.env.TOKEN_EXPIRY_MINUTES) :
  1440; // 24 hours
export const TOKEN_USAGE_LIMIT = process.env.TOKEN_USAGE_LIMIT ?
  parseInt(process.env.TOKEN_USAGE_LIMIT) :
  1; // Default to 1 use before blacklisting

export const AUTH_USERNAME = process.env.AUTH_USERNAME || 'admin';
export const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'password';

export const PORT = process.env.PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';

const isJellyfinConfigured = JELLYFIN_URL && JELLYFIN_USERNAME && JELLYFIN_API_KEY;
const isNavidromeConfigured = NAVIDROME_URL && NAVIDROME_USERNAME && NAVIDROME_PASSWORD;

// Validate required environment variables only in non-test environments
if (NODE_ENV !== 'test' && (!isJellyfinConfigured && !isNavidromeConfigured)) {
  const errorMessage = `
Missing required environment variables for jellyfin OR navidrome.
Please set either 
  JELLYFIN_URL, JELLYFIN_USERNAME, JELLYFIN_API_KEY
or
  NAVIDROME_URL, NAVIDROME_USERNAME, NAVIDROME_PASSWORD
in your .env file.
  `
  throw new Error(errorMessage);
}
