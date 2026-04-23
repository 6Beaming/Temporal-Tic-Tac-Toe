import express, { type Request, type Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

// Middleware
app.use(cors()); // Allows your React app (port 5173) to communicate with this server
app.use(express.json()); // Automatically parses incoming JSON payloads

// The API Endpoint
app.post('/api/v1/game/move', (req: Request, res: Response) => {
    // Destructure the data sent from React
    const { mode, board } = req.body;

    console.log(`[API Gateway] Received request for mode: ${mode}`);
    console.log('[API Gateway] Current Board state:', board);

    // Right now, we just acknowledge receipt. 
    // Later, this router will forward the payload to your Python AI.
    res.json({ 
        status: "success", 
        message: "Data successfully received by the Node.js API Gateway!",
        received_mode: mode
    });
});

app.listen(PORT, () => {
    console.log(`API Gateway is running and listening on http://localhost:${PORT}`);
});