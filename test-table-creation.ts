import "reflect-metadata";

// Mock the config for testing
process.env.DATA_DIR = './test-db';
process.env.NODE_ENV = 'test';

// Import our modules
import { DatabaseService } from './src/db/database.service';
import { container } from './src/di/container';

async function testTableCreation() {
  console.log('Testing table creation...');
  
  try {
    // Resolve database service from DI container
    const dbService = container.resolve(DatabaseService);
    
    // Get database stats to verify tables exist
    const stats = dbService.getStats();
    console.log('Database stats:');
    console.log('- Path:', stats.path);
    console.log('- Size:', stats.sizeBytes, 'bytes');
    console.log('- Tables:', stats.tables);
    
    if (stats.tables.length > 0) {
      console.log('✅ SUCCESS: Tables were created successfully');
      stats.tables.forEach(table => {
        console.log(`   - ${table}`);
      });
    } else {
      console.log('❌ FAILURE: No tables found');
    }
    
    // Close database connection
    dbService.close();
    
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

testTableCreation();