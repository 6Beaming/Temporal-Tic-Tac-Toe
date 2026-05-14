import { useState, useEffect } from 'react';
import './App.css';

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
  const [gameMode, setGameMode] = useState<'bot' | 'friend' | null>(null);
  const [assistMode, setAssistMode] = useState<boolean>(false);
  
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(() => Math.random() < 0.5); 
  const [xMoves, setXMoves] = useState<number[]>([]);
  const [oMoves, setOMoves] = useState<number[]>([]);
  const [isBotThinking, setIsBotThinking] = useState<boolean>(false);
  const [showLoader, setShowLoader] = useState<boolean>(false);

  const boardForWinCheck = [...board];
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

  const deadIndex = winner ? null : tempDeadIndex;
  const pulsingIndex = winner ? null : (isXNext 
    ? (oMoves.length === 3 ? oMoves[0] : null) 
    : (xMoves.length === 3 ? xMoves[0] : null));


  const getMoveProbability = (targetIndex: number) => {
    // 1. Immediate Win? (Guaranteed 100%)
    const testBoardX = [...board];
    if (xMoves.length === 3) testBoardX[xMoves[0]] = null; 
    testBoardX[targetIndex] = 'X';
    if (calculateWinner(testBoardX)?.winner === 'X') return 100;

    // 2. Fatal Blunder Check? (If X plays here, can O win immediately next turn?)
    // We simulate O's available moves AFTER X plays at targetIndex
    let oDeadIdx = oMoves.length === 3 ? oMoves[0] : null;
    const availableForO = testBoardX
      .map((val, idx) => (val === null && idx !== oDeadIdx ? idx : null))
      .filter((val) => val !== null) as number[];

    for (const oMove of availableForO) {
      const boardAfterO = [...testBoardX];
      if (oDeadIdx !== null) boardAfterO[oDeadIdx] = null; // O's oldest decays
      boardAfterO[oMove] = 'O';
      
      // If O playing here results in a win, X's original move is a fatal blunder
      if (calculateWinner(boardAfterO)?.winner === 'O') {
        return 0; // 0% Probability 
      }
    }

    // 3. Critical Block? (Guaranteed 95% to force player attention)
    const testBoardO = [...board];
    if (oMoves.length === 3) testBoardO[oMoves[0]] = null; 
    testBoardO[targetIndex] = 'O';
    if (calculateWinner(testBoardO)?.winner === 'O') return 95; 

    // 4. Monte Carlo Simulation (Calculates Actual Probability)
    let wins = 0;
    const SIMULATION_COUNT = 100; // React plays 100 random futures in the background
    const MAX_DEPTH = 10; // Look 10 moves ahead (prevents infinite temporal loops)

    for (let i = 0; i < SIMULATION_COUNT; i++) {
      // Create a fresh timeline for this simulation
      let simBoard = [...testBoardX]; // Start from the state where X just played
      let simXMoves = [...xMoves];
      if (simXMoves.length === 3) simXMoves.shift();
      simXMoves.push(targetIndex);
      let simOMoves = [...oMoves];

      let currentTurn: 'O' | 'X' = 'O'; // O's turn to respond
      let simWinner: string | null = null;

      // Play out the game randomly until someone wins or we hit MAX_DEPTH
      for (let depth = 0; depth < MAX_DEPTH; depth++) {
        // Identify the dead index to prevent illegal moves in the simulation
        let deadIdx = null;
        if (currentTurn === 'O' && simOMoves.length === 3) deadIdx = simOMoves[0];
        if (currentTurn === 'X' && simXMoves.length === 3) deadIdx = simXMoves[0];

        // Find all playable squares
        const emptySquares = simBoard
          .map((val, idx) => (val === null && idx !== deadIdx ? idx : null))
          .filter((val) => val !== null) as number[];

        if (emptySquares.length === 0) break;

        // Pick a totally random move
        const randomMove = emptySquares[Math.floor(Math.random() * emptySquares.length)];

        // Apply the move and the temporal decay rules
        if (currentTurn === 'O') {
          if (simOMoves.length === 3) simBoard[simOMoves.shift() as number] = null;
          simBoard[randomMove] = 'O';
          simOMoves.push(randomMove);
        } else {
          if (simXMoves.length === 3) simBoard[simXMoves.shift() as number] = null;
          simBoard[randomMove] = 'X';
          simXMoves.push(randomMove);
        }

        // Check for a winner
        const winCheck = calculateWinner(simBoard);
        if (winCheck?.winner) {
          simWinner = winCheck.winner;
          break; // End this simulation
        }

        // Pass turn to next player
        currentTurn = currentTurn === 'X' ? 'O' : 'X';
      }

      // If X survived the chaos and won, tally it up!
      if (simWinner === 'X') wins++;
    }

    // Convert to percentage. 
    // We cap it at 89% so it doesn't visually override our guaranteed 100% or 95% moves.
    const rawProb = Math.round((wins / SIMULATION_COUNT) * 100);
    return Math.min(rawProb, 89);
  };

  const handleClick = (index: number) => {
    if (board[index] || winner) return; 
    if (gameMode === 'bot' && !isXNext) return;

    const currentPlayer = isXNext ? 'X' : 'O';
    const activeMovesQueue = isXNext ? xMoves : oMoves;
    
    const newBoard = [...board];
    const newMovesQueue = [...activeMovesQueue];

    if (newMovesQueue.length === 3) {
      const expiredIndex = newMovesQueue.shift(); 
      if (expiredIndex !== undefined) {
        newBoard[expiredIndex] = null; 
      }
    }

    newBoard[index] = currentPlayer; 
    newMovesQueue.push(index); 
    
    setBoard(newBoard);
    
    if (isXNext) {
      setXMoves(newMovesQueue);
    } else {
      setOMoves(newMovesQueue);
    }
    
    setIsXNext(!isXNext); 
  };

  useEffect(() => {
    if (gameMode === 'bot' && !isXNext && !winner && !isDraw) {
      // Create a timer variable we can track
      let loaderTimer: ReturnType<typeof setTimeout>;

      const getAIMove = async () => {
        setIsBotThinking(true); // 1. Lock the board immediately
        
        // 2. Start the stopwatch: Only show the spinner if 800ms passes!
        loaderTimer = setTimeout(() => {
          setShowLoader(true); 
        }, 800);
        
        try {
          const response = await fetch('https://temporal-tic-tac-toe.onrender.com/api/v1/game/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              mode: "bot", 
              board: board, 
              x_moves: xMoves, 
              o_moves: oMoves, 
              dead_index: deadIndex 
            }) 
          });

          const data = await response.json();
          
          if (data.status === "success" && data.ai_move !== undefined) {
            const isFirstMove = board.every(cell => cell === null);
            const thinkingTime = isFirstMove ? 0 : 500;

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
              
              // 3. Move is done! Cancel the stopwatch and hide the loader
              clearTimeout(loaderTimer);
              setShowLoader(false);
              setIsBotThinking(false); 
            }, thinkingTime);
          }
        } catch (error) {
          console.error("Error getting Bot move:", error);
          // 4. Cancel the stopwatch if the server crashes
          clearTimeout(loaderTimer);
          setShowLoader(false);
          setIsBotThinking(false); 
        }
      };
      getAIMove();

      // Cleanup function to prevent memory leaks if the component unmounts early
      return () => clearTimeout(loaderTimer);
    }
  }, [isXNext, board, winner, isDraw, xMoves, oMoves, deadIndex, gameMode]);

  let statusMessage;
  if (winner) {
    statusMessage = `Winner: ${winner}!`;
  } else if (isDraw) {
    statusMessage = "It's a Draw!";
  } else if (isGameStart) {
    if (gameMode === 'bot') {
      statusMessage = isXNext ? "Game Start: You go first (X)" : "Game Start: Bot goes first...";
    } else {
      statusMessage = isXNext ? "Game Start: Player 1 goes first (X)" : "Game Start: Player 2 goes first (O)";
    }
  } else {
    if (gameMode === 'bot') {
      statusMessage = isXNext ? "Your Turn (X)" : "Bot is thinking...";
    } else {
      statusMessage = isXNext ? "Player 1's Turn (X)" : "Player 2's Turn (O)";
    }
  }

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXMoves([]);
    setOMoves([]);
    setIsXNext(Math.random() < 0.5); 
  };

  const startGame = (mode: 'bot' | 'friend') => {
    setGameMode(mode);
    resetGame();
  };

  const backToMenu = () => {
    setGameMode(null);
    setBoard(Array(9).fill(null));
    setXMoves([]);
    setOMoves([]);
    setAssistMode(false); 
  };
  // --- Screen 1: Main Menu ---
  if (!gameMode) {
    return (
      <div className="menu-container">
        <h1 className="title">Temporal Tic-Tac-Toe</h1>
        <p className="subtitle">The classic game, but pieces vanish after 3 turns.</p>
        <div className="menu-buttons">
          <button className="menu-btn primary" onClick={() => startGame('bot')}>
            Play with Bot
          </button>
          <button className="menu-btn secondary" onClick={() => startGame('friend')}>
            Play with Friend
          </button>
        </div>
      </div>
    );
  }
  // --- Screen 2: Game Board ---
  return (
    <div className="game-container">
      <button className="back-btn" onClick={backToMenu}>
        ← Back to Menu
      </button>

      <h2>{gameMode === 'bot' ? 'You vs Bot🤖' : 'Local 2-Player'}</h2>
      
      <div className={`status ${winner || isDraw ? 'game-over' : ''}`}>
        {statusMessage}
      </div>

      <div className="board-container" style={{ position: 'relative' }}>
        
        {/* The Loading Overlay only shows if showLoader is true (after 800ms) */}
        {showLoader && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p className="loading-text">Bot is thinking...<br/><span style={{fontSize: '0.8rem'}}>(First move may take 50 seconds to wake up the server)</span></p>
          </div>
        )}

        <div className="board">
          {board.map((cell, index) => {
            let displayContent = cell;
            if (index === deadIndex) {
              displayContent = '🙅';
            }
            const isWinningCell = winningLine?.includes(index);
            
            const showHint = assistMode && isXNext && !board[index] && index !== deadIndex && !winner;
            const probability = showHint ? getMoveProbability(index) : null;

            return (
              <button 
                key={index} 
                className={`cell ${index === pulsingIndex ? 'pulsing' : ''} ${index === deadIndex ? 'dead-triangle' : ''} ${isWinningCell ? 'winning-cell' : ''}`} 
                onClick={() => handleClick(index)}
                // UPDATED: Disable the buttons while the bot is thinking so the user can't click!
                disabled={!!winner || !!isDraw || isBotThinking} 
              >
                {displayContent}
                
                {probability !== null && (
                  <span 
                    className="hint-score"
                    style={{ color: probability === 0 ? '#ff4757' : probability >= 80 ? '#2ed573' : probability >= 50 ? '#ffa502' : '#a4b0be' }}
                  >
                    {probability}%
                  </span>
                )}
              </button>
            );
          })}
          {winningLine && <div className={`strike-line ${getLineClass(winningLine)}`}></div>}
        </div>
      </div>

      {gameMode === 'bot' && !winner && (
         <div className="assist-toggle">
           <label className="toggle-label">
             <input type="checkbox" checked={assistMode} onChange={(e) => setAssistMode(e.target.checked)} />
             <div className="toggle-text">
               <span className="toggle-maintext">Show Win Probability to Defeat the Bot</span>
               <span className="toggle-subtext">(based on 100 Monte Carlo simulations per cell)</span>
             </div>
           </label>
         </div>
      )}

      {(winner || isDraw) && (
        <button className="reset-button" onClick={resetGame} style={{ marginTop: '20px', padding: '10px 20px', fontSize: '1.2rem', cursor: 'pointer' }}>
          Play Again
        </button>
      )}
    </div>
  );
}

export default App;