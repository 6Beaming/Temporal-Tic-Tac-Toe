from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
import random

app = FastAPI()

# Pydantic is used to strictly define the expected JSON payload (like TypeScript interfaces)
class GameState(BaseModel):
    mode: str
    board: list[str | None]

@app.post("/calculate-move")
def calculate_move(state: GameState):
    print(f"[Python AI] Received board for mode: {state.mode}")
    
    # Easy Mode Logic: Pick a random empty square
    if state.mode == "easy":
        # Find all indices where the board is None
        empty_squares = [i for i, cell in enumerate(state.board) if cell is None]
        
        if not empty_squares:
            return {"status": "error", "message": "Board is full"}
            
        # Choose a random move using numpy/random
        ai_move = random.choice(empty_squares)
        
        return {
            "status": "success", 
            "ai_move": ai_move,
            "message": f"Python AI calculated move: {ai_move}"
        }
    
    # Placeholder for Hard Mode
    return {"status": "pending", "message": "Hard mode Minimax not implemented yet"}