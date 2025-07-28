# Multi-stage Dockerfile for Tic Tac Toe app

# Stage 1: Build the React client
FROM node:18-alpine AS client-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install client dependencies
RUN npm ci

# Copy client source code
COPY client/ ./

# Build the client
RUN npm run build

# Stage 2: Production server
FROM node:18-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy server package files
COPY server/package*.json ./server/

# Install production dependencies only
RUN npm ci --only=production && \
    cd server && npm ci --only=production

# Copy server code
COPY server/ ./server/

# Copy built client files from previous stage
COPY --from=client-builder /app/client/dist ./client/dist

# Copy client public files
COPY client/public ./client/public

# Expose the port the app runs on
EXPOSE 12000

# Start the server directly (client is already built)
CMD ["npm", "run", "start-server"]