import React, { useState, useEffect } from 'react';

// API URL - adjust if needed
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:12000/api' 
  : '/api';

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
  // Track API errors
  const [error, setError] = useState(null);
  // Track loading state
  const [isLoading, setIsLoading] = useState(false);

  // Handle click on a square
  const handleClick = async (i) => {
    // Don't allow clicks if AI is thinking or loading
    if (aiThinking || isLoading) {
      return;
    }
    
    // Create a copy of the squares array
    const newSquares = [...squares];
    
    // Return early if there's a winner or the square is already filled
    if (newSquares[i]) {
      return;
    }
    
    // In AI mode, prevent human from playing as O
    if ((gameMode === 'easy' || gameMode === 'hard') && !xIsNext) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Make API call to validate and make the move
      const response = await fetch(`${API_URL}/make-move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          squares: newSquares,
          index: i,
          player: xIsNext ? 'X' : 'O'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to make move');
      }
      
      const data = await response.json();
      
      // Update state with validated move
      setSquares(data.squares);
      setXIsNext(!xIsNext);
    } catch (err) {
      setError(err.message);
      console.error('Error making move:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Make AI move
  const makeAiMove = async () => {
    if (aiThinking || isLoading) {
      return;
    }
    
    try {
      setAiThinking(true);
      setIsLoading(true);
      setError(null);
      
      // Random delay between 300-1000ms to simulate "thinking"
      const delay = Math.random() * 700 + 300;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Make API call to get AI move
      const response = await fetch(`${API_URL}/ai-move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          squares,
          difficulty: gameMode
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI move');
      }
      
      const data = await response.json();
      
      // Make the AI move
      const aiMoveResponse = await fetch(`${API_URL}/make-move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          squares,
          index: data.move,
          player: 'O'
        }),
      });
      
      if (!aiMoveResponse.ok) {
        const errorData = await aiMoveResponse.json();
        throw new Error(errorData.error || 'Failed to make AI move');
      }
      
      const moveData = await aiMoveResponse.json();
      
      // Update state with AI move
      setSquares(moveData.squares);
      setXIsNext(true);
    } catch (err) {
      setError(err.message);
      console.error('Error making AI move:', err);
    } finally {
      setAiThinking(false);
      setIsLoading(false);
    }
  };

  // Effect to trigger AI moves
  useEffect(() => {
    if ((gameMode === 'easy' || gameMode === 'hard') && !xIsNext && !aiThinking && !isLoading) {
      // Check if there are empty squares and no winner
      const winner = calculateWinner(squares);
      if (!winner && squares.includes(null)) {
        makeAiMove();
      }
    }
  }, [gameMode, xIsNext, squares, aiThinking, isLoading]);

  // Reset the game
  const resetGame = () => {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
    setAiThinking(false);
    setError(null);
    setIsLoading(false);
  };

  // Handle game mode change
  const handleModeChange = (mode) => {
    setGameMode(mode);
    resetGame();
  };

  // Calculate the winner (client-side for UI purposes)
  const calculateWinner = (squares) => {
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
  };

  // Calculate the winner
  const winner = calculateWinner(squares);
  
  // Determine status message
  let status;
  if (error) {
    status = `Error: ${error}`;
  } else if (winner) {
    if (gameMode === 'easy' || gameMode === 'hard') {
      status = winner === 'X' ? 'You Win!' : 'AI Wins!';
    } else {
      status = `Winner: ${winner}`;
    }
  } else if (squares.every(square => square !== null)) {
    status = 'Draw!';
  } else if (aiThinking || isLoading) {
    status = 'Thinking...';
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
      <div className={`status ${error ? 'error' : ''}`}>{status}</div>
      <Board 
        squares={squares} 
        onClick={handleClick} 
        disabled={aiThinking || isLoading || ((gameMode === 'easy' || gameMode === 'hard') && !xIsNext)}
      />
      <button className="reset-button" onClick={resetGame}>
        Reset Game
      </button>
    </div>
  );
};

export default App;