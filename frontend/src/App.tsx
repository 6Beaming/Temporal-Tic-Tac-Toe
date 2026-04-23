import { useState } from 'react';
import './App.css';

function App() {
  // Create an array of 9 nulls to represent our empty 3x3 grid
  const [board, setBoard] = useState<string[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);

  // Function to handle clicking a square
  const handleClick = (index: number) => {
    // If the square is already filled, do nothing
    if (board[index]) return; 

    // Create a copy of the board to mutate (React best practice)
    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    
    // Update the state
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  // The API fetch function
  const testAPIConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/game/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: "easy",
          board: board
        })
      });

      const data = await response.json();
      console.log("Response from Node.js API:", data);
      alert(data.message); // Pop-up to prove it works
    } catch (error) {
      console.error("Error connecting to API:", error);
    }
  };

  return (
    <div className="game-container">
      <h1>Temporal Tic-Tac-Toe</h1>
      {/* Button to manually trigger the API call */}
      <button onClick={testAPIConnection} style={{ marginBottom: '20px', padding: '10px' }}>
        Send Board to API
      </button>
      <div className="board">
        {board.map((cell, index) => (
          <button 
            key={index} 
            className="cell" 
            onClick={() => handleClick(index)}
          >
            {cell}
          </button>
        ))}
      </div>
      <div className="status">
        Next player: {isXNext ? 'X' : 'O'}
      </div>
    </div>
  );
}

export default App;