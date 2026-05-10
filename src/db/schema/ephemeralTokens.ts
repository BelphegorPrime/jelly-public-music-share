import {
    sqliteTable,
    text,
    integer,
} from "drizzle-orm/sqlite-core";

export const createEphemeralTokenUsageTableQuery = `
    CREATE TABLE IF NOT EXISTS ephemeral_token_usage (
        token_id TEXT PRIMARY KEY,
        usage_count INTEGER NOT NULL DEFAULT 0,
        blacklisted INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
    )
`

export const ephemeralTokenUsage = sqliteTable(
    "ephemeral_token_usage",
    {
        tokenId: text("token_id").primaryKey(),
        usageCount: integer("usage_count").notNull().default(0),
        blacklisted: integer("blacklisted", { mode: "boolean" }).notNull().default(false),
        createdAt: integer("created_at").notNull(),
        expiresAt: integer("expires_at").notNull(),
    }
);
