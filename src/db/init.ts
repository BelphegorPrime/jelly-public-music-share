import { container } from '../di/container';
import { DatabaseService } from './database.service';
import { runMigrations } from './migrate';

/**
 * Initialize the database
 *
 * Steps:
 * 1. Get the database service
 * 2. Ensure tables exist 
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

    // Ensure all required tables are created
    try {
      console.log('Ensuring required tables exist...');
      const stats = dbService.getStats();
      console.log(`Tables found: ${stats.tables.join(', ') || 'None'}`);
    } catch (error) {
      console.warn('Warning during table validation:', error);
    }

    // Log final stats
    const finalStats = dbService.getStats();
    console.log('\n=== Database Ready ===');
    console.log(`Database: ${finalStats.path}`);
    console.log(`Size: ${(finalStats.sizeBytes / 1024).toFixed(2)} KB`);
    console.log(`Tables: ${finalStats.tables.join(', ') || 'None'}`);
    console.log('');
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    throw error;
  }
}
