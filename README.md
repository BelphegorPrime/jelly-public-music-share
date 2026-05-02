# Jelly Public Music Share

A self-hosted music sharing platform.

## Features

- Public music sharing
- Self-hosted deployment
- Docker container support
- Docker Compose support
- Pre-built container on GHCR.io

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

### Manual Setup (Alternative)

#### Prerequisites

- Node.js (v24+)
- npm
- Docker (for container deployment)

#### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Start the server: `npm start`

### Docker Deployment

```bash
docker build -t jelly-public-music-share .
docker run -p 3000:3000 jelly-public-music-share
```

## Development

### Running Locally

```bash
npm run dev
```

### Build Process

```bash
npm run build
```

## License

MIT
