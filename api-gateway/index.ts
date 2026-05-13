import express, { type Request, type Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT;

app.use(cors()); 
app.use(express.json()); 

app.post('/api/v1/game/move', async (req: Request, res: Response) => {
    const { mode, board, x_moves, o_moves, dead_index } = req.body;
    
    console.log(`[Node.js Gateway] Received from React. Forwarding to Python...`);

    try {
        // Node.js makes an internal API call to the Python service
        const pythonResponse = await fetch('https://temporal-tic-tac-toe.onrender.com/calculate-move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Passing the new arrays into the Python payload
            body: JSON.stringify({ 
                mode: mode, 
                board: board, 
                x_moves: x_moves, 
                o_moves: o_moves,
                dead_index: dead_index 
            })
        });

        // Safety check: If Python crashes, Node.js will no longer hide it.
        if (!pythonResponse.ok) {
            console.error("[Node.js Gateway] Python AI rejected the payload.");
            return res.status(500).json({ status: "error", message: "AI Service rejected payload" });
        }

        // Get the response back from Python
        const aiData = await pythonResponse.json();
        
        // Send the final result back to the React frontend
        res.json({
            status: "success",
            ai_move: aiData.ai_move 
        });

    } catch (error) {
        console.error("[Node.js Gateway] Error communicating with Python:", error);
        res.status(500).json({ status: "error", message: "AI Service Down" });
    }
});

app.listen(PORT, () => {
    console.log(`API Gateway is running on https://temporal-tic-tac-toe.onrender.com`);
});