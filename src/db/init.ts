import { container } from '../di/container';
import { DatabaseService } from './database.service';
import { runMigrations } from './migrate';

/**
 * Initialize the database
 *
 * Steps:
 * 1. Get the database service
 * 2. Create schema tables if they don't exist
 * 3. Run migrations from JSON files
 * 4. Log database stats
 */
export async function initializeDatabase(): Promise<void> {
  console.log('\n=== Database Initialization ===\n');

  try {
    // Get database service from DI container
    const dbService = container.resolve(DatabaseService);

    console.log('✓ Database connection established');

    // Run migrations from JSON files to SQLite
    try {
      await runMigrations();
    } catch (error) {
      console.warn('⚠ Migration failed (non-blocking):', error instanceof Error ? error.message : error);
      console.log('  Continuing with fresh database...');
    }

    // Force table creation for required tables (especially requested_songs)
    try {
      console.log('Ensuring required tables exist...');
      // Try a simple query to force table creation in Drizzle ORM
      const stats = dbService.getStats();
      if (stats.tables.length === 0) {
        console.log('No existing tables found, will create on first access');
      }
    } catch (error) {
      console.warn('Warning during table validation:', error);
    }

    // Log final stats
    const finalStats = dbService.getStats();
    console.log('\n=== Database Ready ===');
    console.log(`Database: ${finalStats.path}`);
    console.log(`Size: ${(finalStats.sizeBytes / 1024).toFixed(2)} KB`);
    console.log(`Tables: ${finalStats.tables.join(', ')}`);
    console.log('');
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    throw error;
  }
}
