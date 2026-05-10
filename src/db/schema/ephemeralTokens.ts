import {
    sqliteTable,
    text,
    integer,
} from "drizzle-orm/sqlite-core";

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
