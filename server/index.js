const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 12000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
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

// API endpoint for AI move
app.post('/api/ai-move', (req, res) => {
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
app.post('/api/make-move', (req, res) => {
  const { squares, index, player } = req.body;
  
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
  
  // Return updated board and game status
  res.json({
    squares: newSquares,
    winner,
    isDraw: !winner && !newSquares.includes(null)
  });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/public')));
app.use('/dist', express.static(path.join(__dirname, '../client/dist')));

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});