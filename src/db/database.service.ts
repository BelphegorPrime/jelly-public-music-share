import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import { singleton } from 'tsyringe';

import fs from 'fs';
import path from 'path';

import * as schema from './schema';
import { DATA_DIR } from '../config';

/**
 * DatabaseService
 *
 * Centralized SQLite + Drizzle service.
 *
 * Responsibilities:
 * - SQLite connection lifecycle
 * - Drizzle ORM initialization
 * - database pragmas
 * - cleanup tasks
 * - transactions
 * - health checks
 */
@singleton()
export class DatabaseService {
    private readonly sqlite: Database.Database;

    private readonly drizzleDb: BetterSQLite3Database<typeof schema>;

    private readonly dbPath: string;

    constructor() {
        const dataDir = DATA_DIR || '/data';

        fs.mkdirSync(dataDir, {
            recursive: true,
        });

        this.dbPath = path.join(dataDir, 'app.sqlite');

        this.sqlite = new Database(this.dbPath, {
            fileMustExist: false,
            timeout: 5000,
            verbose:
                process.env.NODE_ENV === 'development'
                    ? console.log
                    : undefined,
        });

        this.configureDatabase();

        this.drizzleDb = drizzle(this.sqlite, {
            schema,
        });

        console.log(`Database initialized: ${this.dbPath}`);
    }

    /**
     * Configure SQLite pragmas
     */
    private configureDatabase(): void {
        this.sqlite.pragma('foreign_keys = ON');

        this.sqlite.pragma('journal_mode = WAL');

        this.sqlite.pragma('synchronous = NORMAL');

        this.sqlite.pragma('temp_store = MEMORY');

        this.sqlite.pragma('mmap_size = 268435456');

        this.sqlite.pragma('wal_autocheckpoint = 1000');

        this.sqlite.pragma('cache_size = -32000');

        console.log('SQLite pragmas configured');
    }

    /**
     * Get Drizzle database instance
     */
    get db(): BetterSQLite3Database<typeof schema> {
        return this.drizzleDb;
    }

    /**
     * Get raw SQLite connection
     *
     * Useful for:
     * - backup APIs
     * - sqlite pragmas
     * - low-level operations
     */
    get raw(): Database.Database {
        return this.sqlite;
    }

    /**
     * Run a transaction
     */
    transaction<T>(
        fn: (
            tx: BetterSQLite3Database<typeof schema>
        ) => T
    ): T {
        return this.sqlite.transaction(() => {
            return fn(this.drizzleDb);
        })();
    }

    /**
     * Cleanup expired records
     */
    cleanupExpiredRecords(): number {
        const now = Date.now();

        try {
            const deletedCount = this.transaction((tx) => {
                let deleted = 0;

                try {
                    const ephemeralResult = tx.run(sql`
           DELETE FROM ephemeral_token_usage
           WHERE expires_at < ${now}
         `);

                    deleted += ephemeralResult.changes;
                } catch (error) {
                    // Tables may not exist yet, ignore if this is a fresh DB
                    if ((error as any)?.message?.includes('no such table')) {
                        console.log('WARNING: ephemeral_token_usage table does not exist yet');
                    } else {
                        throw error;
                    }
                }

                try {
                    const requestedSongsResult = tx.run(sql`
          DELETE FROM requested_songs
          WHERE expires_at < ${now}
        `);

                    deleted += requestedSongsResult.changes;
                } catch (error) {
                    // Tables may not exist yet, ignore if this is a fresh DB
                    if ((error as any)?.message?.includes('no such table')) {
                        console.log('WARNING: requested_songs table does not exist yet');
                    } else {
                        throw error;
                    }
                }

                try {
                    const authResult = tx.run(sql`
          DELETE FROM auth_tokens
          WHERE expires_at < ${now}
        `);

                    deleted += authResult.changes;
                } catch (error) {
                    // Tables may not exist yet, ignore if this is a fresh DB
                    if ((error as any)?.message?.includes('no such table')) {
                        console.log('WARNING: auth_tokens table does not exist yet');
                    } else {
                        throw error;
                    }
                }

                return deleted;
            });

            if (deletedCount > 0) {
                console.log(
                    `Cleanup completed (${deletedCount} expired records removed)`
                );
            }

            return deletedCount;
        } catch (error) {
            console.error('Database cleanup failed with unexpected error', error);
            return 0;
        }
    }

    /**
     * Run WAL checkpoint
     */
    checkpoint(): void {
        try {
            this.sqlite.pragma('wal_checkpoint(TRUNCATE)');

            console.log('WAL checkpoint completed');
        } catch (error) {
            console.error('Checkpoint failed', error);
        }
    }

    /**
     * Vacuum database
     */
    vacuum(): void {
        try {
            this.sqlite.exec('VACUUM');

            console.log('Database vacuum completed');
        } catch (error) {
            console.error('VACUUM failed', error);
        }
    }

    /**
     * Health check
     */
    healthCheck(): boolean {
        try {
            const result = this.sqlite
                .prepare('SELECT 1 as ok')
                .get() as { ok: number };

            return result.ok === 1;
        } catch {
            return false;
        }
    }

    /**
     * Database statistics
     */
    getStats(): {
        path: string;
        sizeBytes: number;
        walBytes: number;
        tables: string[];
    } {
        try {
            const tables = this.sqlite
                .prepare(`
          SELECT name
          FROM sqlite_master
          WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
        `)
                .all() as Array<{ name: string }>;

            const dbStats = fs.statSync(this.dbPath);

            const walPath = `${this.dbPath}-wal`;

            const walBytes = fs.existsSync(walPath)
                ? fs.statSync(walPath).size
                : 0;

            return {
                path: this.dbPath,
                sizeBytes: dbStats.size,
                walBytes,
                tables: tables.map((t) => t.name),
            };
        } catch (error) {
            console.error('Failed to get database stats', error);

            return {
                path: this.dbPath,
                sizeBytes: 0,
                walBytes: 0,
                tables: [],
            };
        }
    }


    /**
     * Gracefully close database
     */
    close(): void {
        try {
            this.checkpoint();

            this.sqlite.close();

            console.log('Database connection closed');
        } catch (error) {
            console.error('Failed to close database', error);
        }
    }
}