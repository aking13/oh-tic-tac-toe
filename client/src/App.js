import React, { useState } from 'react';

// Square component for each cell in the grid
const Square = ({ value, onClick }) => {
  return (
    <button className="square" onClick={onClick}>
      {value}
    </button>
  );
};

// Board component that renders the 3x3 grid
const Board = ({ squares, onClick }) => {
  return (
    <div className="board">
      {squares.map((value, index) => (
        <Square 
          key={index} 
          value={value} 
          onClick={() => onClick(index)} 
        />
      ))}
    </div>
  );
};

// Main App component
const App = () => {
  // Initialize state for the board (9 squares)
  const [squares, setSquares] = useState(Array(9).fill(null));
  // Track whose turn it is (X starts)
  const [xIsNext, setXIsNext] = useState(true);

  // Handle click on a square
  const handleClick = (i) => {
    // Create a copy of the squares array
    const newSquares = [...squares];
    
    // Return early if there's a winner or the square is already filled
    if (calculateWinner(newSquares) || newSquares[i]) {
      return;
    }
    
    // Set the square to X or O based on whose turn it is
    newSquares[i] = xIsNext ? 'X' : 'O';
    
    // Update state
    setSquares(newSquares);
    setXIsNext(!xIsNext);
  };

  // Reset the game
  const resetGame = () => {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
  };

  // Calculate the winner
  const winner = calculateWinner(squares);
  
  // Determine status message
  let status;
  if (winner) {
    status = `Winner: ${winner}`;
  } else if (squares.every(square => square !== null)) {
    status = 'Draw!';
  } else {
    status = `Next player: ${xIsNext ? 'X' : 'O'}`;
  }

  return (
    <div className="game">
      <h1>Tic Tac Toe</h1>
      <div className="status">{status}</div>
      <Board squares={squares} onClick={handleClick} />
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