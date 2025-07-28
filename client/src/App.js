import React, { useState, useEffect } from 'react';

// Square component for each cell in the grid
const Square = ({ value, onClick, disabled }) => {
  return (
    <button 
      className="square" 
      onClick={onClick}
      disabled={disabled}
    >
      {value}
    </button>
  );
};

// Board component that renders the 3x3 grid
const Board = ({ squares, onClick, disabled }) => {
  return (
    <div className="board">
      {squares.map((value, index) => (
        <Square 
          key={index} 
          value={value} 
          onClick={() => onClick(index)}
          disabled={disabled && !value}
        />
      ))}
    </div>
  );
};

// Game Mode Selector component
const GameModeSelector = ({ gameMode, onModeChange }) => {
  return (
    <div className="game-mode-selector">
      <h3>Game Mode</h3>
      <div className="mode-options">
        <label className="mode-option">
          <input
            type="radio"
            value="human"
            checked={gameMode === 'human'}
            onChange={(e) => onModeChange(e.target.value)}
          />
          Human vs Human
        </label>
        <label className="mode-option">
          <input
            type="radio"
            value="easy"
            checked={gameMode === 'easy'}
            onChange={(e) => onModeChange(e.target.value)}
          />
          Easy AI
        </label>
        <label className="mode-option">
          <input
            type="radio"
            value="hard"
            checked={gameMode === 'hard'}
            onChange={(e) => onModeChange(e.target.value)}
          />
          Hard AI
        </label>
      </div>
    </div>
  );
};

// Main App component
const App = () => {
  // Initialize state for the board (9 squares)
  const [squares, setSquares] = useState(Array(9).fill(null));
  // Track whose turn it is (X starts)
  const [xIsNext, setXIsNext] = useState(true);
  // Track game mode
  const [gameMode, setGameMode] = useState('human');
  // Track if AI is thinking
  const [aiThinking, setAiThinking] = useState(false);

  // Handle click on a square
  const handleClick = (i) => {
    // Don't allow clicks if AI is thinking
    if (aiThinking) {
      return;
    }
    
    // Create a copy of the squares array
    const newSquares = [...squares];
    
    // Return early if there's a winner or the square is already filled
    if (calculateWinner(newSquares) || newSquares[i]) {
      return;
    }
    
    // In AI mode, prevent human from playing as O
    if ((gameMode === 'easy' || gameMode === 'hard') && !xIsNext) {
      return;
    }
    
    // Set the square to X or O based on whose turn it is
    newSquares[i] = xIsNext ? 'X' : 'O';
    
    // Update state
    setSquares(newSquares);
    setXIsNext(!xIsNext);
  };

  // Hard AI algorithm - plays optimally
  const getHardAiMove = (squares) => {
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
  };

  // AI move logic
  const makeAiMove = () => {
    const newSquares = [...squares];
    const emptySquares = newSquares
      .map((square, index) => square === null ? index : null)
      .filter(val => val !== null);
    
    if (emptySquares.length === 0) {
      return;
    }
    
    // Choose move based on difficulty
    let aiMove;
    if (gameMode === 'hard') {
      aiMove = getHardAiMove(squares);
    } else {
      // Easy AI - random move
      const randomIndex = Math.floor(Math.random() * emptySquares.length);
      aiMove = emptySquares[randomIndex];
    }
    
    // Set AI thinking state
    setAiThinking(true);
    
    // Random delay between 300-1000ms
    const delay = Math.random() * 700 + 300;
    
    setTimeout(() => {
      const updatedSquares = [...squares];
      updatedSquares[aiMove] = 'O';
      setSquares(updatedSquares);
      setXIsNext(true);
      setAiThinking(false);
    }, delay);
  };

  // Effect to trigger AI moves
  useEffect(() => {
    if ((gameMode === 'easy' || gameMode === 'hard') && !xIsNext && !calculateWinner(squares) && !aiThinking) {
      // Check if there are empty squares
      if (squares.some(square => square === null)) {
        makeAiMove();
      }
    }
  }, [gameMode, xIsNext, squares, aiThinking]);

  // Reset the game
  const resetGame = () => {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
    setAiThinking(false);
  };

  // Handle game mode change
  const handleModeChange = (mode) => {
    setGameMode(mode);
    resetGame();
  };

  // Calculate the winner
  const winner = calculateWinner(squares);
  
  // Determine status message
  let status;
  if (winner) {
    if (gameMode === 'easy' || gameMode === 'hard') {
      status = winner === 'X' ? 'You Win!' : 'AI Wins!';
    } else {
      status = `Winner: ${winner}`;
    }
  } else if (squares.every(square => square !== null)) {
    status = 'Draw!';
  } else if (aiThinking) {
    status = 'AI Thinking...';
  } else {
    if (gameMode === 'easy' || gameMode === 'hard') {
      status = xIsNext ? 'Your Turn (X)' : 'AI Turn (O)';
    } else {
      status = `Next player: ${xIsNext ? 'X' : 'O'}`;
    }
  }

  return (
    <div className="game">
      <h1>Tic Tac Toe</h1>
      <GameModeSelector gameMode={gameMode} onModeChange={handleModeChange} />
      <div className="status">{status}</div>
      <Board 
        squares={squares} 
        onClick={handleClick} 
        disabled={aiThinking || ((gameMode === 'easy' || gameMode === 'hard') && !xIsNext)}
      />
      <button className="reset-button" onClick={resetGame}>
        Reset Game
      </button>
    </div>
  );
};

// Helper function to calculate winner
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

export default App;