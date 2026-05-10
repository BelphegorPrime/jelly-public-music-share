CREATE TABLE `requested_songs` (
	`token` text PRIMARY KEY NOT NULL,
	`song_id` text NOT NULL,
	`play_url` text NOT NULL,
	`requested_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ephemeral_token_usage` (
	`token_id` text PRIMARY KEY NOT NULL,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`blacklisted` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
