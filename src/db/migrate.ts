import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema';
import { DATA_DIR } from '../config';

/**
 * Migration script to move data from JSON files to SQLite
 * Run this once before deploying to ensure data is preserved
 */

interface LegacyRequestedSong {
  songId: string;
  token: string;
  playUrl: string;
  requestedAt: number;
  expiresAt: number;
}

interface LegacyRequestedSongsData {
  songs: LegacyRequestedSong[];
}

async function migrateRequestedSongs() {
  console.log('Starting migration: requested songs...');

  const dataDir = DATA_DIR || '/data';
  const jsonPath = path.join(dataDir, 'requested-songs.json');

  if (!fs.existsSync(jsonPath)) {
    console.log('  ✓ No legacy requested-songs.json found, skipping');
    return 0;
  }

  try {
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    const legacy: LegacyRequestedSongsData = JSON.parse(jsonData);

    if (!legacy.songs || legacy.songs.length === 0) {
      console.log('  ✓ Legacy file is empty, no data to migrate');
      return 0;
    }

    const dbPath = path.join(dataDir, 'app.sqlite');
    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite, { schema });

    // Insert all songs
    let inserted = 0;
    for (const song of legacy.songs) {
      try {
        db.insert(schema.requestedSongs)
          .values({
            token: song.token,
            songId: song.songId,
            playUrl: song.playUrl,
            requestedAt: song.requestedAt,
            expiresAt: song.expiresAt,
          })
          .run();
        inserted++;
      } catch (error: any) {
        if (error.message?.includes('UNIQUE constraint failed')) {
          console.log(`  ⚠ Token already exists, skipping: ${song.token}`);
        } else {
          console.error(`  ✗ Error inserting song ${song.songId}:`, error);
        }
      }
    }

    sqlite.close();

    console.log(`  ✓ Migrated ${inserted}/${legacy.songs.length} requested songs`);

    // Backup the old file
    const backupPath = jsonPath + '.backup';
    fs.copyFileSync(jsonPath, backupPath);
    console.log(`  ✓ Backup created: ${backupPath}`);

    return inserted;
  } catch (error) {
    console.error('  ✗ Error migrating requested songs:', error);
    throw error;
  }
}

async function migrateTokenUsage() {
  console.log('Starting migration: token usage...');

  const dataDir = DATA_DIR || '/data';
  const jsonPath = path.join(dataDir, 'tokens.json');

  if (!fs.existsSync(jsonPath)) {
    console.log('  ✓ No legacy tokens.json found, skipping');
    return 0;
  }

  try {
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    const legacy: Record<string, any> = JSON.parse(jsonData);

    const dbPath = path.join(dataDir, 'app.sqlite');
    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite, { schema });

    // Extract unique tokens with their usage data
    let inserted = 0;
    for (const [tokenId, data] of Object.entries(legacy)) {
      try {
        db.insert(schema.ephemeralTokenUsage)
          .values({
            tokenId,
            usageCount: (data as any).usageCount || 0,
            blacklisted: (data as any).blacklisted === true,
            createdAt: (data as any).createdAt || Date.now(),
            expiresAt: (data as any).expiresAt || Date.now() + 24 * 60 * 60 * 1000,
          })
          .run();
        inserted++;
      } catch (error: any) {
        if (error.message?.includes('UNIQUE constraint failed')) {
          console.log(`  ⚠ Token already exists, skipping: ${tokenId}`);
        } else {
          console.error(`  ✗ Error inserting token ${tokenId}:`, error);
        }
      }
    }

    sqlite.close();

    console.log(`  ✓ Migrated ${inserted} token usage records`);

    // Backup the old file
    const backupPath = jsonPath + '.backup';
    fs.copyFileSync(jsonPath, backupPath);
    console.log(`  ✓ Backup created: ${backupPath}`);

    return inserted;
  } catch (error) {
    console.error('  ✗ Error migrating token usage:', error);
    throw error;
  }
}

/**
 * @deprecated starting version 0.2.0
 */
export async function runMigrations(): Promise<void> {
  console.log('\n=== Database Migrations ===\n');

  try {
    const songsCount = await migrateRequestedSongs();
    const tokensCount = await migrateTokenUsage();

    console.log(`\n=== Migration Complete ===`);
    console.log(`Total records migrated: ${songsCount + tokensCount}\n`);
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  runMigrations().catch(console.error);
}
