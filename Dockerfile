# Multi-stage build
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the project
RUN npm run build



# Production stage
FROM node:24-alpine

WORKDIR /app

# Install ffmpeg
RUN apk add --no-cache ffmpeg

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy dependencies from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/templates ./dist/templates

EXPOSE 3000

CMD [ "npm", "start" ]