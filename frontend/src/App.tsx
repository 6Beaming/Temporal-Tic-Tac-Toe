import { useState, useEffect } from 'react';
import './App.css';

// MODIFIED: Now returns both the winner ('X' or 'O') and the winning line array
function calculateWinner(squares: (string | null)[]) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], 
    [0, 3, 6], [1, 4, 7], [2, 5, 8], 
    [0, 4, 8], [2, 4, 6]  
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: lines[i] }; 
    }
  }
  return null; 
}

// NEW: Helper to translate the winning line array into a CSS class name
function getLineClass(line: number[]) {
  const key = line.join(',');
  const lineMap: Record<string, string> = {
    '0,1,2': 'strike-row-0', '3,4,5': 'strike-row-1', '6,7,8': 'strike-row-2',
    '0,3,6': 'strike-col-0', '1,4,7': 'strike-col-1', '2,5,8': 'strike-col-2',
    '0,4,8': 'strike-diag-0', '2,4,6': 'strike-diag-1'
  };
  return lineMap[key];
}

function App() {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(() => Math.random() < 0.5); 
  const [xMoves, setXMoves] = useState<number[]>([]);
  const [oMoves, setOMoves] = useState<number[]>([]);

  // 1. Calculate win state first, ignoring the physical 'dead' spot temporarily
  const boardForWinCheck = [...board];
  // We approximate the dead spot for the win check if someone has 3 pieces
  const tempDeadIndex = isXNext 
    ? (xMoves.length === 3 ? xMoves[0] : null) 
    : (oMoves.length === 3 ? oMoves[0] : null);
    
  if (tempDeadIndex !== null) {
    boardForWinCheck[tempDeadIndex] = null;
  }

  const winningData = calculateWinner(boardForWinCheck);
  const winner = winningData?.winner;
  const winningLine = winningData?.line;
  
  const isDraw = !winner && board.every(cell => cell !== null);
  const isGameStart = board.every(cell => cell === null);

  // FIXED: If there is a winner, force both of these to null so the UI freezes normally
  const deadIndex = winner ? null : tempDeadIndex;
  const pulsingIndex = winner ? null : (isXNext 
    ? (oMoves.length === 3 ? oMoves[0] : null) 
    : (xMoves.length === 3 ? xMoves[0] : null));

  const handleClick = (index: number) => {
    if (board[index] || !isXNext || winner) return; 

    const newBoard = [...board];
    const newXMoves = [...xMoves];

    if (newXMoves.length === 3) {
      const expiredIndex = newXMoves.shift(); 
      if (expiredIndex !== undefined) {
        newBoard[expiredIndex] = null; 
      }
    }

    newBoard[index] = 'X'; 
    newXMoves.push(index); 
    
    setBoard(newBoard);
    setXMoves(newXMoves);
    setIsXNext(false); 
  };

  useEffect(() => {
    if (!isXNext && !winner && !isDraw) {
      const getAIMove = async () => {
        try {
          const response = await fetch('http://localhost:5000/api/v1/game/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: "easy", board: board, x_moves: xMoves, o_moves: oMoves })
          });

          const data = await response.json();
          
          if (data.status === "success" && data.ai_move !== undefined) {
            setTimeout(() => {
              const newBoard = [...board];
              const newOMoves = [...oMoves];
              
              if (newOMoves.length === 3) {
                const expiredIndex = newOMoves.shift();
                if (expiredIndex !== undefined) {
                  newBoard[expiredIndex] = null;
                }
              }
              
              newBoard[data.ai_move] = 'O'; 
              newOMoves.push(data.ai_move);
              
              setBoard(newBoard);
              setOMoves(newOMoves);
              setIsXNext(true); 
            }, 500);
          }
        } catch (error) {
          console.error("Error getting AI move:", error);
        }
      };
      getAIMove();
    }
  }, [isXNext, board, winner, isDraw, xMoves, oMoves]);

  let statusMessage;
  if (winner) {
    statusMessage = `Winner: ${winner}!`;
  } else if (isDraw) {
    statusMessage = "It's a Draw!";
  } else if (isGameStart) {
    statusMessage = isXNext ? "Game Start: You go first (X)" : "Game Start: AI goes first...";
  } else {
    statusMessage = isXNext ? "Your Turn (X)" : "AI is thinking...";
  }

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXMoves([]);
    setOMoves([]);
    setIsXNext(Math.random() < 0.5); 
  };

  return (
    <div className="game-container">
      <h1>Temporal Tic-Tac-Toe</h1>
      
      <div className={`status ${winner || isDraw ? 'game-over' : ''}`}>
        {statusMessage}
      </div>

      <div className="board">
        {board.map((cell, index) => {
          let displayContent = cell;
          if (index === deadIndex) {
            displayContent = '△';
          }

          // Check if this specific cell is part of the winning line
          const isWinningCell = winningLine?.includes(index);

          return (
            <button 
              key={index} 
              // Add the fancy winning-cell class if it's part of the win
              className={`cell ${index === pulsingIndex ? 'pulsing' : ''} ${index === deadIndex ? 'dead-triangle' : ''} ${isWinningCell ? 'winning-cell' : ''}`} 
              onClick={() => handleClick(index)}
              disabled={!!winner || !!isDraw} 
            >
              {displayContent}
            </button>
          );
        })}
        
        {/* NEW: Render the animated strike-through line if there is a winner */}
        {winningLine && <div className={`strike-line ${getLineClass(winningLine)}`}></div>}
      </div>

      {(winner || isDraw) && (
        <button className="reset-button" onClick={resetGame} style={{ marginTop: '20px', padding: '10px 20px', fontSize: '1.2rem', cursor: 'pointer' }}>
          Play Again
        </button>
      )}
    </div>
  );
}

export default App;