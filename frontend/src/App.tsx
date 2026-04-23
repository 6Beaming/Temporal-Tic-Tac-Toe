import { useState, useEffect } from 'react';
import './App.css';

// Helper function to check all 8 winning combinations
function calculateWinner(squares: (string | null)[]) {
  const lines = [
    [0, 1, 2], // Top row
    [3, 4, 5], // Middle row
    [6, 7, 8], // Bottom row
    [0, 3, 6], // Left column
    [1, 4, 7], // Middle column
    [2, 5, 8], // Right column
    [0, 4, 8], // Diagonal 1
    [2, 4, 6]  // Diagonal 2
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    // If square 'a' has a piece, and it matches 'b' and 'c', we have a winner
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a]; // Returns 'X' or 'O'
    }
  }
  return null; // Returns null if no winner yet
}

function App() {
  // Create an array of 9 nulls to represent our empty 3x3 grid
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true); // True = Player (X), False = AI (O)

  // Calculate game status on every render
  const winner = calculateWinner(board);
  // It is a draw if there is no winner and every cell is filled
  const isDraw = !winner && board.every(cell => cell !== null);

  const handleClick = (index: number) => {
    // Prevent clicking if the square is taken OR if it's the AI's turn or game over
    if (board[index] || !isXNext || winner) return; 

    // Create a copy of the board to mutate (React best practice)
    const newBoard = [...board];
    newBoard[index] = 'X'; // You are always 'X' in this test
    
    setBoard(newBoard);
    setIsXNext(false); // Hand the turn over to the AI
  };

  // This hook automatically runs whenever `isXNext` changes
  useEffect(() => {
    // Stop the AI from asking for a move if the game is already over
    if (!isXNext && !winner && !isDraw) {
      const getAIMove = async () => {
        try {
          const response = await fetch('http://localhost:5000/api/v1/game/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: "easy", board: board })
          });

          const data = await response.json();
          
          if (data.status === "success") {
            // Add a 500ms delay so it feels like the AI is "thinking"
            setTimeout(() => {
              setBoard((prevBoard) => {
                const newBoard = [...prevBoard];
                newBoard[data.ai_move] = 'O'; // Place the AI's move
                return newBoard;
              });
              setIsXNext(true); // Give the turn back to the player
            }, 500);
          }
        } catch (error) {
          console.error("Error getting AI move:", error);
        }
      };

      getAIMove();
    }
  }, [isXNext, board, winner, isDraw]);

  // Dynamically change the UI text based on the game state
  let statusMessage;
  if (winner) {
    statusMessage = `Winner: ${winner}!`;
  } else if (isDraw) {
    statusMessage = "It's a Draw!";
  } else {
    statusMessage = isXNext ? "Your Turn (X)" : "AI is thinking...";
  }

  // A simple function to reset the board
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true); // True = Player (X), False = AI (O)
  };

  return (
    <div className="game-container">
      <h1>Temporal Tic-Tac-Toe</h1>
      
      {/* We apply a special CSS class if the game is over to highlight the text */}
      <div className={`status ${winner || isDraw ? 'game-over' : ''}`}>
        {statusMessage}
      </div>

      <div className="board">
        {board.map((cell, index) => (
          <button 
            key={index} 
            className="cell" 
            onClick={() => handleClick(index)}
            // Disable button visually if game is over
            disabled={!!winner || !!isDraw} 
          >
            {cell}
          </button>
        ))}
      </div>

      {/* Play again button that only shows up when the game is over */}
      {(winner || isDraw) && (
        <button className="reset-button" onClick={resetGame} style={{ marginTop: '20px', padding: '10px 20px', fontSize: '1.2rem', cursor: 'pointer' }}>
          Play Again
        </button>
      )}
    </div>
  );
}

export default App;