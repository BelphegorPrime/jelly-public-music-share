import {
    sqliteTable,
    text,
    integer,
} from "drizzle-orm/sqlite-core";

export const createRequestSongsTableQuery = `
    CREATE TABLE IF NOT EXISTS requested_songs (
        token TEXT PRIMARY KEY,
        song_id TEXT NOT NULL,
        play_url TEXT NOT NULL,
        requested_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
    )
`

export const requestedSongs = sqliteTable(
    "requested_songs",
    {
        token: text("token").primaryKey(),
        songId: text("song_id").notNull(),
        playUrl: text("play_url").notNull(),
        requestedAt: integer("requested_at").notNull(),
        expiresAt: integer("expires_at").notNull(),
    }
);
