const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

// Import database modules
const { initializeDatabase } = require('./db');
const gameRepository = require('./repositories/gameRepository');
const userRepository = require('./repositories/userRepository');

// Import middleware
const { optionalAuth, requireAuth, validateRegistration, validateLogin } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Share session with socket.io
const sessionMiddleware = session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: path.join(__dirname, 'data')
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
});

// Use session middleware for socket.io
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// Helper function to get user from socket session
function getUserFromSocket(socket) {
  const session = socket.request.session;
  if (session && session.userId) {
    return {
      id: session.userId,
      username: session.username,
      displayName: session.displayName
    };
  }
  return null;
}
const PORT = process.env.PORT || 12000;

// Initialize database
initializeDatabase();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Use the shared session middleware
app.use(sessionMiddleware);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Authentication routes
app.post('/api/auth/register', validateRegistration, async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;
    
    // Check if user already exists
    const existingUser = userRepository.findUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    if (email) {
      const existingEmail = userRepository.findUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }
    
    // Create user
    const userId = userRepository.createUser({
      username,
      email,
      password,
      displayName
    });
    
    // Create session
    req.session.userId = userId;
    req.session.username = username;
    req.session.displayName = displayName || username;
    
    // Update last login
    userRepository.updateLastLogin(userId);
    
    res.json({
      success: true,
      user: {
        id: userId,
        username,
        displayName: displayName || username,
        email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', validateLogin, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = userRepository.findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Verify password
    if (!userRepository.verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Create session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.displayName = user.display_name;
    
    // Update last login
    userRepository.updateLastLogin(user.id);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

app.get('/api/auth/me', optionalAuth, (req, res) => {
  if (!req.user) {
    return res.json({ user: null });
  }
  
  try {
    const user = userRepository.findUserById(req.user.id);
    if (!user) {
      return res.json({ user: null });
    }
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// User statistics and profile routes
app.get('/api/user/stats', requireAuth, (req, res) => {
  try {
    const stats = userRepository.getUserStats(req.user.id);
    res.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get user statistics' });
  }
});

app.get('/api/user/games', requireAuth, (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const games = userRepository.getUserGameHistory(req.user.id, limit);
    res.json({ games });
  } catch (error) {
    console.error('Get user games error:', error);
    res.status(500).json({ error: 'Failed to get user game history' });
  }
});

app.put('/api/user/profile', requireAuth, (req, res) => {
  try {
    const { displayName, email } = req.body;
    
    userRepository.updateUserProfile(req.user.id, {
      displayName,
      email
    });
    
    // Update session
    if (displayName) {
      req.session.displayName = displayName;
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

// Game history endpoints
app.get('/api/games', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const games = gameRepository.getGameHistory(limit);
    res.json({ games });
  } catch (error) {
    console.error('Error fetching game history:', error);
    res.status(500).json({ error: 'Failed to fetch game history' });
  }
});

app.get('/api/games/:id', (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const game = gameRepository.getGameById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const moves = gameRepository.getGameMoves(gameId);
    res.json({ game, moves });
  } catch (error) {
    console.error('Error fetching game details:', error);
    res.status(500).json({ error: 'Failed to fetch game details' });
  }
});

// Game logic functions
function calculateWinner(squares) {
  // All possible winning combinations
  const lines = [
    [0, 1, 2], // top row
    [3, 4, 5], // middle row
    [6, 7, 8], // bottom row
    [0, 3, 6], // left column
    [1, 4, 7], // middle column
    [2, 5, 8], // right column
    [0, 4, 8], // diagonal top-left to bottom-right
    [2, 4, 6]  // diagonal top-right to bottom-left
  ];
  
  // Check each winning combination
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    // If all three squares in a line have the same value (and not null)
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a]; // Return the winner (X or O)
    }
  }
  
  return null; // No winner
}

// Hard AI algorithm - plays optimally
function getHardAiMove(squares) {
  // Check if AI can win
  for (let i = 0; i < 9; i++) {
    if (squares[i] === null) {
      const testSquares = [...squares];
      testSquares[i] = 'O';
      if (calculateWinner(testSquares) === 'O') {
        return i;
      }
    }
  }
  
  // Check if AI needs to block player from winning
  for (let i = 0; i < 9; i++) {
    if (squares[i] === null) {
      const testSquares = [...squares];
      testSquares[i] = 'X';
      if (calculateWinner(testSquares) === 'X') {
        return i;
      }
    }
  }
  
  // Strategic moves in order of preference
  const strategicMoves = [
    4, // Center
    0, 2, 6, 8, // Corners
    1, 3, 5, 7  // Edges
  ];
  
  for (let move of strategicMoves) {
    if (squares[move] === null) {
      return move;
    }
  }
  
  // Fallback to random (shouldn't happen)
  const emptySquares = squares
    .map((square, index) => square === null ? index : null)
    .filter(val => val !== null);
  return emptySquares[Math.floor(Math.random() * emptySquares.length)];
}

// Get AI move based on difficulty
function getAiMove(squares, difficulty) {
  const emptySquares = squares
    .map((square, index) => square === null ? index : null)
    .filter(val => val !== null);
  
  if (emptySquares.length === 0) {
    return null;
  }
  
  if (difficulty === 'hard') {
    return getHardAiMove(squares);
  } else {
    // Easy AI - random move
    const randomIndex = Math.floor(Math.random() * emptySquares.length);
    return emptySquares[randomIndex];
  }
}

// Validate a move
function isValidMove(squares, index) {
  // Check if index is within bounds
  if (index < 0 || index > 8) {
    return false;
  }
  
  // Check if square is already filled
  if (squares[index] !== null) {
    return false;
  }
  
  // Check if game is already won
  if (calculateWinner(squares)) {
    return false;
  }
  
  return true;
}

// Room management
const rooms = new Map();

// Generate a random room code
function generateRoomCode() {
  const adjectives = ['BLUE', 'RED', 'GREEN', 'GOLD', 'SILVER', 'PURPLE', 'ORANGE', 'PINK'];
  const numbers = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  return `${adjective}${numbers}`;
}

// Create a new room
function createRoom(roomName = null) {
  const roomCode = generateRoomCode();
  const room = {
    code: roomCode,
    name: roomName || `Room ${roomCode}`,
    players: [],
    gameState: {
      squares: Array(9).fill(null),
      xIsNext: true,
      winner: null,
      isDraw: false
    },
    createdAt: new Date(),
    lastActivity: new Date()
  };
  
  rooms.set(roomCode, room);
  return room;
}

// Clean up inactive rooms (older than 1 hour)
function cleanupRooms() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [code, room] of rooms.entries()) {
    if (room.lastActivity < oneHourAgo) {
      rooms.delete(code);
    }
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupRooms, 10 * 60 * 1000);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create a new room
  socket.on('create-room', (data) => {
    const { roomName, playerName } = data;
    const room = createRoom(roomName);
    const user = getUserFromSocket(socket);
    
    // Add player to room
    const player = {
      id: socket.id,
      name: playerName || (user ? (user.displayName || user.username) : 'Player 1'),
      symbol: 'X', // First player is always X
      userId: user ? user.id : null,
      username: user ? user.username : null
    };
    
    room.players.push(player);
    socket.join(room.code);
    
    socket.emit('room-created', {
      roomCode: room.code,
      roomName: room.name,
      player: player,
      players: room.players,
      gameState: room.gameState
    });
    
    console.log(`Room ${room.code} created by ${player.name}`);
  });

  // Join an existing room
  socket.on('join-room', (data) => {
    const { roomCode, playerName } = data;
    const room = rooms.get(roomCode);
    const user = getUserFromSocket(socket);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    if (room.players.length >= 2) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }
    
    // Add player to room
    const player = {
      id: socket.id,
      name: playerName || (user ? (user.displayName || user.username) : 'Player 2'),
      symbol: 'O', // Second player is always O
      userId: user ? user.id : null,
      username: user ? user.username : null
    };
    
    room.players.push(player);
    room.lastActivity = new Date();
    socket.join(room.code);
    
    // Notify both players
    socket.emit('room-joined', {
      roomCode: room.code,
      roomName: room.name,
      player: player,
      players: room.players,
      gameState: room.gameState
    });
    
    socket.to(room.code).emit('player-joined', {
      player: player,
      players: room.players,
      gameState: room.gameState
    });
    
    console.log(`${player.name} joined room ${room.code}`);
  });

  // Make a move in a room
  socket.on('make-move', (data) => {
    const { roomCode, index } = data;
    const room = rooms.get(roomCode);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player) {
      socket.emit('error', { message: 'You are not in this room' });
      return;
    }
    
    // Check if it's the player's turn
    const expectedSymbol = room.gameState.xIsNext ? 'X' : 'O';
    if (player.symbol !== expectedSymbol) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }
    
    // Validate the move
    if (!isValidMove(room.gameState.squares, index)) {
      socket.emit('error', { message: 'Invalid move' });
      return;
    }
    
    // Make the move
    const newSquares = [...room.gameState.squares];
    newSquares[index] = player.symbol;
    
    // Update game state
    const winner = calculateWinner(newSquares);
    const isDraw = !winner && !newSquares.includes(null);
    
    // Track move number
    if (!room.moveCount) {
      room.moveCount = 1;
    } else {
      room.moveCount++;
    }
    
    room.gameState = {
      squares: newSquares,
      xIsNext: !room.gameState.xIsNext,
      winner,
      isDraw
    };
    
    room.lastActivity = new Date();
    
    // If game is complete (has winner or is draw), save to database
    let gameId = null;
    if (winner || isDraw) {
      try {
        // Save the completed game
        const playerX = room.players.find(p => p.symbol === 'X');
        const playerO = room.players.find(p => p.symbol === 'O');
        
        gameId = gameRepository.saveGame({
          gameMode: 'online',
          playerX: playerX?.name || 'Player X',
          playerO: playerO?.name || 'Player O',
          playerXUserId: playerX?.userId || null,
          playerOUserId: playerO?.userId || null,
          winner: winner || null,
          isDraw: isDraw
        });
        
        // Update user statistics for both players if they're authenticated
        if (gameId) {
          const userRepository = require('./repositories/userRepository');
          
          if (playerX?.userId) {
            try {
              userRepository.updateUserStats(playerX.userId, {
                gameMode: 'online',
                winner,
                isDraw,
                userSymbol: 'X'
              });
            } catch (error) {
              console.error('Error updating player X stats:', error);
            }
          }
          
          if (playerO?.userId) {
            try {
              userRepository.updateUserStats(playerO.userId, {
                gameMode: 'online',
                winner,
                isDraw,
                userSymbol: 'O'
              });
            } catch (error) {
              console.error('Error updating player O stats:', error);
            }
          }
        }
        
        // Save all moves if we have a game ID
        if (gameId) {
          // Save the current move
          gameRepository.saveMove({
            gameId,
            playerSymbol: player.symbol,
            position: index,
            moveNumber: room.moveCount
          });
          
          // Store game ID in room for potential future use
          room.gameId = gameId;
        }
      } catch (error) {
        console.error('Error saving multiplayer game:', error);
      }
    }
    
    // Broadcast the updated game state to all players in the room
    io.to(room.code).emit('game-updated', {
      gameState: room.gameState,
      lastMove: {
        player: player.name,
        symbol: player.symbol,
        index,
        moveNumber: room.moveCount
      },
      gameId // Include the game ID if it was saved
    });
    
    console.log(`Move made in room ${room.code} by ${player.name}`);
  });

  // Reset game in a room
  socket.on('reset-game', (data) => {
    const { roomCode } = data;
    const room = rooms.get(roomCode);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player) {
      socket.emit('error', { message: 'You are not in this room' });
      return;
    }
    
    // Reset game state
    room.gameState = {
      squares: Array(9).fill(null),
      xIsNext: true,
      winner: null,
      isDraw: false
    };
    
    room.lastActivity = new Date();
    
    // Broadcast reset to all players in the room
    io.to(room.code).emit('game-reset', {
      gameState: room.gameState,
      resetBy: player.name
    });
    
    console.log(`Game reset in room ${room.code} by ${player.name}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Find and remove player from any rooms
    for (const [code, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        room.players.splice(playerIndex, 1);
        
        // Notify remaining players
        socket.to(room.code).emit('player-left', {
          player: player,
          playersRemaining: room.players.length
        });
        
        // Remove empty rooms
        if (room.players.length === 0) {
          rooms.delete(code);
          console.log(`Room ${code} deleted (empty)`);
        }
        
        console.log(`${player.name} left room ${code}`);
        break;
      }
    }
  });
});

// API endpoint for AI move
app.post('/api/ai-move', optionalAuth, (req, res) => {
  const { squares, difficulty } = req.body;
  
  // Validate request body
  if (!squares || !Array.isArray(squares) || squares.length !== 9) {
    return res.status(400).json({ error: 'Invalid board state' });
  }
  
  if (!difficulty || !['easy', 'hard'].includes(difficulty)) {
    return res.status(400).json({ error: 'Invalid difficulty level' });
  }
  
  // Check if game is already won
  const winner = calculateWinner(squares);
  if (winner) {
    return res.status(400).json({ error: 'Game already has a winner' });
  }
  
  // Check if board is full
  if (!squares.includes(null)) {
    return res.status(400).json({ error: 'Board is full' });
  }
  
  // Get AI move
  const aiMove = getAiMove(squares, difficulty);
  
  // Return the move
  res.json({ move: aiMove });
});

// API endpoint for making a move
app.post('/api/make-move', optionalAuth, (req, res) => {
  const { squares, index, player, gameMode, moveNumber } = req.body;
  
  // Validate request body
  if (!squares || !Array.isArray(squares) || squares.length !== 9) {
    return res.status(400).json({ error: 'Invalid board state' });
  }
  
  if (index === undefined || typeof index !== 'number') {
    return res.status(400).json({ error: 'Invalid move index' });
  }
  
  if (!player || !['X', 'O'].includes(player)) {
    return res.status(400).json({ error: 'Invalid player' });
  }
  
  // Validate the move
  if (!isValidMove(squares, index)) {
    return res.status(400).json({ error: 'Invalid move' });
  }
  
  // Make the move
  const newSquares = [...squares];
  newSquares[index] = player;
  
  // Check for winner
  const winner = calculateWinner(newSquares);
  const isDraw = !winner && !newSquares.includes(null);
  
  // If game is complete (has winner or is draw) and gameMode is provided, save to database
  let gameId = null;
  if ((winner || isDraw) && gameMode) {
    try {
      // Save the completed game
      gameId = gameRepository.saveGame({
        gameMode,
        playerX: req.user ? req.user.displayName || req.user.username : 'Player 1',
        playerO: gameMode === 'easy' || gameMode === 'hard' ? 'AI' : 'Player 2',
        playerXUserId: req.user ? req.user.id : null,
        playerOUserId: null, // AI or anonymous player
        winner: winner || null,
        isDraw: isDraw
      });
      
      // Update user statistics if user is authenticated
      if (req.user && gameId) {
        try {
          const userRepository = require('./repositories/userRepository');
          userRepository.updateUserStats(req.user.id, {
            gameMode,
            winner,
            isDraw,
            userSymbol: 'X' // User is always X in single player
          });
        } catch (error) {
          console.error('Error updating user stats:', error);
        }
      }
      
      // If we have move history, save all moves
      if (moveNumber !== undefined && gameId) {
        // Save the current move
        gameRepository.saveMove({
          gameId,
          playerSymbol: player,
          position: index,
          moveNumber: moveNumber
        });
      }
    } catch (error) {
      console.error('Error saving game:', error);
      // Continue with the response even if saving fails
    }
  }
  
  // Return updated board and game status
  res.json({
    squares: newSquares,
    winner,
    isDraw,
    gameId // Include the game ID if it was saved
  });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/public')));
app.use('/dist', express.static(path.join(__dirname, '../client/dist')));

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});