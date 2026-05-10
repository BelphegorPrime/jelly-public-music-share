# Multi-stage build
FROM node:24-alpine AS backend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client .
RUN npm run build

# Production stage
FROM node:24-alpine
WORKDIR /app
# Install dependencies
RUN apk add --no-cache ffmpeg sqlite curl
# Copy package files
COPY package*.json ./
# Install dependencies
RUN npm ci --only=production
# Copy dependencies from backend stage
COPY --from=backend /app/dist ./dist
COPY --from=frontend /app/client/dist ./client/dist

# Create data directory
RUN mkdir -p /data

EXPOSE 3000
CMD [ "npm", "start" ]