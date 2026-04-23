from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
import random

app = FastAPI()

class GameState(BaseModel):
    mode: str
    board: list[str | None]
    x_moves: list[int] 
    o_moves: list[int] 
    dead_index: int | None = None # NEW: Accept the dead index

@app.post("/calculate-move")
def calculate_move(state: GameState):
    print(f"[Python AI] Received board for mode: {state.mode}")
    
    if state.mode == "easy":
        # NEW: Filter out the dead_index so the AI cannot choose the triangle spot
        empty_squares = [i for i, cell in enumerate(state.board) if cell is None and i != state.dead_index]
        
        if not empty_squares:
            return {"status": "error", "message": "Board is full"}
            
        ai_move = random.choice(empty_squares)
        
        return {
            "status": "success", 
            "ai_move": ai_move,
        }
    
    return {"status": "pending", "message": "Hard mode Minimax not implemented yet"}