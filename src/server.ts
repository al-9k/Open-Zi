import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import { db } from './index.js'; 
import { DictionaryEngine } from './engine.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize a single global instance of your stateless engine
const engine = new DictionaryEngine(db);

// Middleware to parse incoming JSON bodies
app.use(express.json());

/**
 * POST /api/characters
 * Adds new characters to the user's bank and triggers the word sync.
 */
app.post('/api/characters', async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.body.userId as string;
        const input = req.body.input as string;

        if (!userId || !input) {
            return res.status(400).json({ error: "Missing 'userId' or 'input' in request body." });
        }

        const success = await engine.addCharacters(userId, input);
        if (!success) {
            return res.status(400).json({ error: "No valid simplified Chinese characters found in input." });
        }

        return res.json({ success: true, message: "Characters processed and bank synced successfully." });
    } catch (error) {
        console.error("[POST /api/characters] Error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

/**
 * DELETE /api/characters
 * Removes a specific character from the user's bank.
 */
app.delete('/api/characters', async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.body.userId as string;
        const char = req.body.char as string;

        if (!userId || !char) {
            return res.status(400).json({ error: "Missing 'userId' or 'char' in request body." });
        }

        const success = await engine.removeCharacter(userId, char);
        if (!success) {
            return res.status(404).json({ error: "Character not found in user's bank." });
        }

        return res.json({ success: true, message: `Character '${char}' removed.` });
    } catch (error) {
        console.error("[DELETE /api/characters] Error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

/**
 * GET /api/users/:userId/stats
 * Aggregates user stats and their dictionary coverage percentage.
 */
app.get('/api/users/:userId/stats', async (req: Request, res: Response): Promise<any> => {
    try {
        // Force the parameter to be treated as a strict string
        const userId = req.params.userId as string;

        const [stats, coverage] = await Promise.all([
            engine.getStats(userId),
            engine._compute_coverage(userId)
        ]);

        return res.json({
            ...stats,
            coverage_percentage: coverage
        });
    } catch (error) {
        console.error("[GET /api/users/:userId/stats] Error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

/**
 * GET /api/users/:userId/recommendation
 * Calculates and returns the single highest value character for the user to learn next.
 */
app.get('/api/users/:userId/recommendation', async (req: Request, res: Response): Promise<any> => {
    try {
        // Force the parameter to be treated as a strict string
        const userId = req.params.userId as string;
        const recommendation = await engine.getHighestValueChar(userId);

        if (!recommendation) {
            return res.status(404).json({ message: "No recommendations available at this time." });
        }

        return res.json(recommendation);
    } catch (error) {
        console.error("[GET /api/users/:userId/recommendation] Error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

/**
 * GET /api/search
 * Searches the dictionary.
 */
app.get('/api/search', async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.query.userId as string;
        const q = (req.query.q as string) || "";
        const searchAll = req.query.all !== "false"; 

        if (!userId) {
            return res.status(400).json({ error: "Missing 'userId' query parameter." });
        }

        const results = await engine.search(userId, q, searchAll);
        return res.json(results);
    } catch (error) {
        console.error("[GET /api/search] Error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

/**
 * GET /api/dictionary
 * Returns paginated dictionary entries with ownership info.
 */
app.get('/api/dictionary', async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.query.userId as string;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 250;

        if (!userId) {
            return res.status(400).json({ error: "Missing 'userId' query parameter." });
        }

        const result = await engine.getDictionaryPage(userId, page, pageSize);
        return res.json(result);
    } catch (error) {
        console.error("[GET /api/dictionary] Error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Open-Zi API is running on http://localhost:${PORT}`);
});