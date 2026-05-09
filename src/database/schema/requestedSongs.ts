import {
    sqliteTable,
    text,
    integer,
} from "drizzle-orm/sqlite-core";

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
