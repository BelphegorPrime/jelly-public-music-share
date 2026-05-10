# Deployment Guide

## Quick Start with Docker Compose

### Prerequisites
- Docker and Docker Compose installed
- Jellyfin server running and accessible
- Environment file with Jellyfin credentials

### 1. Prepare Environment

Copy the example configuration and edit with your Jellyfin details:

```bash
cp .env.example .env
nano .env
```

Required environment variables:
```
JELLYFIN_URL=http://jellyfin.local:8096
JELLYFIN_USERNAME=your-username
JELLYFIN_API_KEY=your-api-key
BASE_URL=http://localhost:3000
AUTH_USERNAME=admin
AUTH_PASSWORD=secure-password
```

Optional:
```
NODE_ENV=production
DATA_DIR=/data
SONG_DOWNLOAD_DIR=/data/songs
TOKEN_USAGE_LIMIT=1
TOKEN_EXPIRY_MINUTES=1440
```

### 2. Deploy with Docker Compose

```bash
# Start the service
docker compose up -d

# View logs
docker compose logs -f jpms

# Check status
docker compose ps
```

### 3. Database

The application automatically initializes SQLite on first startup:

```
✓ Database connection established
✓ Tables created
✓ Migrations run (if legacy JSON files exist)
✓ Database ready for operations
```

**Data Location**: `/data/app.sqlite` (inside container, persisted via Docker volume)

### 4. Database Management

Access the database CLI:

```bash
# View statistics
docker compose exec jpms npm run db -- stats

# Check health
docker compose exec jpms npm run db -- health

# Run cleanup
docker compose exec jpms npm run db -- cleanup

# Optimize database
docker compose exec jpms npm run db -- vacuum
```

### 5. Backup & Restore

**Backup the data volume:**

```bash
docker run --rm -v jelly-public-music-share_data:/data \
  -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz -C /data .

# Or on Linux:
docker run --rm -v jelly-public-music-share_data:/data \
  -v /tmp:/backup ubuntu tar czf /backup/backup.tar.gz -C /data .
```

**Restore from backup:**

```bash
docker run --rm -v jelly-public-music-share_data:/data \
  -v /tmp:/backup alpine tar xzf /backup/backup.tar.gz -C /data
```

## Database Migration from JSON Files

If upgrading from the previous JSON-based version:

1. **Stop the service**:
   ```bash
   docker compose down
   ```

2. **Backup your data**:
   ```bash
   cp -r /path/to/data /path/to/data.backup
   ```

3. **Start the new version**:
   ```bash
   docker compose up -d
   ```

   The application automatically:
   - Creates SQLite database
   - Migrates data from `tokens.json` and `requested-songs.json`
   - Backs up old JSON files to `.backup` extension
   - Removes the old JSON files after migration

4. **Verify migration**:
   ```bash
   docker compose exec jpms npm run db -- stats
   ```

## Volume Management

The service uses a single `data` volume for all persistent data:

```
/data
├── app.sqlite          # SQLite database
├── app.sqlite-wal      # Write-Ahead Log (auto-managed)
├── app.sqlite-shm      # Shared memory file (auto-managed)
└── songs/              # Downloaded music files
    ├── song-id-1.mp3
    ├── song-id-2.mp3
    └── ...
```

### View Volume Info

```bash
docker volume inspect jelly-public-music-share_data
```

### Clean Up (WARNING: Removes all data!)

```bash
docker compose down -v
```

## Troubleshooting

### Database is locked

SQLite uses WAL mode with auto-checkpointing. If you see lock errors:

```bash
docker compose exec jpms npm run db -- checkpoint
```

### Database file is large

Run optimization:

```bash
docker compose exec jpms npm run db -- vacuum
```

### Check database health

```bash
docker compose exec jpms npm run db -- health
```

### Access SQLite directly

```bash
docker compose exec jpms sqlite3 /data/app.sqlite

# Inside sqlite3:
# .tables              # List tables
# .schema              # Show schema
# SELECT COUNT(*) FROM ephemeral_token_usage;
# .quit                # Exit
```

## Performance Tips

1. **WAL Mode**: Already enabled. Provides better concurrency.
2. **Regular Cleanup**: Scheduled automatically every 24 hours.
3. **Backups**: Consider automated backups of the `data` volume.
4. **Monitoring**: Use `npm run db -- stats` to monitor database growth.

## Updating the Image

```bash
# Pull latest image
docker compose pull

# Rebuild and restart
docker compose up -d --build
```

The database will persist through restarts and updates.
