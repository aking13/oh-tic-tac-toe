# Tic Tac Toe Game

A simple full-stack tic-tac-toe game with Express server and React frontend.

## Features

- Express server with Socket.IO for real-time multiplayer
- React frontend with a 3x3 clickable grid
- Single-player mode with AI (Easy and Hard difficulty)
- Multiplayer mode with room-based system
- Full game logic implementation
- Responsive design
- Docker support for easy deployment

## Prerequisites

Choose one of the following options:

### Option 1: Traditional Setup
- Node.js (v18.0.0 or higher)
- npm

### Option 2: Docker Setup (Recommended)
- Docker Desktop installed and running
- No need to install Node.js or npm!

## Running the Application

### Using Docker (Recommended for Testing)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd oh-tic-tac-toe
   ```

2. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

3. Open your browser and navigate to `http://localhost:12000`

4. To stop the application:
   ```bash
   # Press Ctrl+C in the terminal, then:
   docker-compose down
   ```

#### Alternative Docker Commands

If you prefer using Docker directly without docker-compose:

```bash
# Build the image
docker build -t tic-tac-toe .

# Run the container
docker run -p 12000:12000 tic-tac-toe

# Run with custom port (e.g., 8080)
docker run -p 8080:12000 -e PORT=12000 tic-tac-toe
```

### Using Traditional Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm run install-all
   ```
3. Build and start the server:
   ```
   npm start
   ```
4. Access the game at http://localhost:12000

## Docker Details

The application uses a multi-stage Docker build for optimal image size:
- **Stage 1**: Builds the React client with all dev dependencies
- **Stage 2**: Creates a lean production image with only runtime dependencies

The Docker setup:
- Uses Node.js 18 Alpine Linux for smaller image size
- Automatically builds the client during image creation
- Exposes port 12000 (configurable via PORT environment variable)
- Includes health check endpoint at `/api/health`
- Ready for deployment to any Docker-compatible platform

## Deployment Options

### Deploy to Render

This application is ready to deploy to Render with minimal configuration:

1. Create a new Web Service in Render
2. Connect your GitHub repository
3. Use the following settings:
   - **Build Command**: `npm run install-all && npm run build`
   - **Start Command**: `npm run start-server`
   - **Environment Variables**: None required (Render will set PORT automatically)

### Deploy with Docker

The Docker image can be deployed to:
- AWS ECS / Fargate
- Google Cloud Run
- Azure Container Instances
- Kubernetes clusters
- Any VPS with Docker installed

## Project Structure

- `/client` - React frontend application
- `/server` - Express.js backend with Socket.IO
- `/client/dist` - Built frontend files (generated after build)
- `Dockerfile` - Multi-stage Docker configuration
- `docker-compose.yml` - Docker Compose configuration for easy local testing
- `.dockerignore` - Excludes unnecessary files from Docker build context