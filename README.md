# Tic Tac Toe Game

A simple full-stack tic-tac-toe game with Express server and React frontend.

## Features

- Express server with health check endpoint
- React frontend with a 3x3 clickable grid
- Full game logic implementation
- Responsive design

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm run install-all
   ```
3. Build and start the server:
   ```
   npm start
   ```
4. Access the game at http://localhost:12000 (or the port specified in your environment)

## Deployment to Render

This application is ready to deploy to Render with minimal configuration:

1. Create a new Web Service in Render
2. Connect your GitHub repository
3. Use the following settings:
   - **Build Command**: `npm run install-all && npm run build`
   - **Start Command**: `npm run start-server`
   - **Environment Variables**: None required (Render will set PORT automatically)

Render will automatically detect the Node.js environment and deploy your application.