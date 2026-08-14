# Jelly Public Music Share

[![Under Construction](https://img.shields.io/badge/Status-Stable-green)](https://github.com/BelphegorPrime/jelly-public-music-share)

A self-hosted music sharing platform that allows you to share individual songs from your Jellyfin library with others through secure, one-time use links.

## Why I created this project

I use Jellyfin for my personal music library and wanted an easy way to share rare tracks that are not available on Spotify or YouTube.

Creating full Jellyfin accounts just to send someone a single song felt unnecessary, so I built a small server that searches my library and generates secure, shareable links on demand.

To keep it private and simple, links are intended to be one-time usable. Each link is backed by a JWT token, and the audio is streamed through a protected endpoint when opened.

## Features

- Secure music sharing from Jellyfin libraries
- Secure music sharing from Navidrome libraries (experimental)
- Self-hosted deployment
- Docker container support
- Docker Compose support
- Pre-built container on GHCR.io
- One-time use tokens for enhanced security
- Built-in authentication system
- Client-side streaming interface

## Getting Started

### Docker First Approach (Recommended)

The easiest way to get started is using the pre-built Docker container from GitHub Container Registry:

1. Download the `.env` file:
```bash
wget https://raw.githubusercontent.com/BelphegorPrime/jelly-public-music-share/main/.env.example -O .env
```

2. Edit the `.env` file with your Jellyfin details:
```bash
nano .env
```

3. Run with Docker Compose:
```bash
wget https://raw.githubusercontent.com/BelphegorPrime/jelly-public-music-share/main/docker-compose.yml
docker compose up -d
```

### Navidrome Support (Experimental)

To use Navidrome instead of Jellyfin, uncomment the Navidrome configuration in your `.env` file and provide the required Navidrome credentials:

```
# Navidrome Configuration
NAVIDROME_URL=http://localhost:4533
NAVIDROME_USERNAME=your_navidrome_username
NAVIDROME_PASSWORD=your_navidrome_password
```

The application will automatically detect which media server is configured and use the appropriate service. If both services are configured, both can be searched.

### Manual Setup (Alternative)

#### Prerequisites

- Docker (recommended)

OR

- Node.js (v24+)
- npm
- FFmpeg (for audio transcoding)
- SQLite (for database storage)

#### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Start the server: `npm start`

#### Development

To run in development mode:
```bash
npm run dev
```

### Docker Deployment

For local Docker deployment:
```bash
docker build -t jelly-public-music-share .
docker run -p 3000:3000 jelly-public-music-share
```

The application will be available at `http://localhost:3000`

## Development

### Running Locally

```bash
npm run dev
```

### Build Process

```bash
npm run build
```

### Database Management

The application uses SQLite with Drizzle ORM. Useful commands:

```bash
# Generate migrations
npm run db:generate

# Apply migrations
npm run db:migrate

# Push schema changes
npm run db:push
```

## License

MIT
