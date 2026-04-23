import express, { type Request, type Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

app.use(cors()); 
app.use(express.json()); 

app.post('/api/v1/game/move', async (req: Request, res: Response) => {
    const { mode, board } = req.body;
    console.log(`[Node.js Gateway] Received from React. Forwarding to Python...`);

    try {
        // Node.js makes an internal API call to the Python service
        const pythonResponse = await fetch('http://localhost:8000/calculate-move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: mode, board: board })
        });

        // Get the response back from Python
        const aiData = await pythonResponse.json();
        console.log(`[Node.js Gateway] Received response from Python AI:`, aiData);

        // Send the final result back to the React frontend
        res.json({
            status: "success",
            message: "Successfully routed through Node to Python and back!",
            ai_move: aiData.ai_move
        });

    } catch (error) {
        console.error("[Node.js Gateway] Error communicating with Python:", error);
        res.status(500).json({ status: "error", message: "AI Service Down" });
    }
});

app.listen(PORT, () => {
    console.log(`API Gateway is running on http://localhost:${PORT}`);
});