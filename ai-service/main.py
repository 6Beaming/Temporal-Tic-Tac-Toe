from fastapi import FastAPI
from pydantic import BaseModel
import random

app = FastAPI()

class GameState(BaseModel):
    mode: str
    board: list[str | None]
    x_moves: list[int] 
    o_moves: list[int] 
    dead_index: int | None = None

#  Helper function for the AI to analyze board states
def check_winner(board: list[str | None]):
    # All possible winning cases
    lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], 
        [0, 3, 6], [1, 4, 7], [2, 5, 8], 
        [0, 4, 8], [2, 4, 6]  
    ]
    for a, b, c in lines:
        if board[a] and board[a] == board[b] and board[a] == board[c]:
            return board[a]
    return None

@app.post("/calculate-move")
def calculate_move(state: GameState):
    print(f"[Python AI] Received board for mode: {state.mode}")
    
    if state.mode == "easy":
        empty_squares = [i for i, cell in enumerate(state.board) if cell is None and i != state.dead_index]
        
        if not empty_squares:
            return {"status": "error", "message": "Board is full"}

        # --- AI ALGORITHM ---

        # 1. ATTACK: Can the AI win right now?
        for move in empty_squares:
            test_board = state.board.copy()
            # Simulate the Temporal Rule: AI's oldest piece vanishes
            if len(state.o_moves) == 3:
                test_board[state.o_moves[0]] = None
            test_board[move] = 'O'
            
            # If this move results in a win, take it immediately!
            if check_winner(test_board) == 'O':
                return {"status": "success", "ai_move": move}

        # 2. DEFEND: Can the Player win on their next turn?
        for move in empty_squares:
            test_board = state.board.copy()
            # Simulate the Temporal Rule: Player's oldest piece vanishes
            if len(state.x_moves) == 3:
                test_board[state.x_moves[0]] = None
            test_board[move] = 'X'
            
            # If the player would win by placing an 'X' here, block them!
            if check_winner(test_board) == 'X':
                return {"status": "success", "ai_move": move}

        # 3. STRATEGY: Take the center square if it's available
        if 4 in empty_squares:
            return {"status": "success", "ai_move": 4}

        # 4. FALLBACK: Pick a random available square
        ai_move = random.choice(empty_squares)
        
        return {
            "status": "success", 
            "ai_move": ai_move,
        }
    
    return {"status": "pending", "message": "Hard mode Minimax not implemented yet"}