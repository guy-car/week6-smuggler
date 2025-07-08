import { Request, Response, Router } from 'express';
import { MockAIService } from '../ai/mock';

const router = Router();
const aiService = new MockAIService();

/**
 * POST /api/ai/analyze
 * Analyze conversation and generate AI response using new Turn structure
 */
router.post('/analyze', async (req: Request, res: Response) => {
    try {
        const { gameId, conversationHistory } = req.body;

        if (!gameId || typeof gameId !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'gameId is required and must be a string'
            });
        }

        if (!conversationHistory || !Array.isArray(conversationHistory)) {
            return res.status(400).json({
                success: false,
                error: 'conversationHistory is required and must be an array'
            });
        }

        // Validate conversation history structure
        for (let i = 0; i < conversationHistory.length; i++) {
            const turn = conversationHistory[i];
            if (!turn || typeof turn !== 'object' || !turn.type) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid turn at index ${i}: missing type field`
                });
            }

            if (!['outsider_hint', 'ai_analysis', 'insider_guess'].includes(turn.type)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid turn type at index ${i}: ${turn.type}`
                });
            }

            if (turn.turnNumber !== i + 1) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid turn number at index ${i}: expected ${i + 1}, got ${turn.turnNumber}`
                });
            }
        }

        const aiResponse = await aiService.analyzeConversation(
            conversationHistory,
            'mock-secret-word', // Mock secret word for now
            { currentRound: 1, score: 5, gameStatus: 'active' }
        );

        return res.json({
            success: true,
            data: aiResponse
        });
    } catch (error) {
        console.error('Error in AI analyze endpoint:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * POST /api/ai/thinking
 * Generate thinking process for AI analysis using new Turn structure
 */
router.post('/thinking', async (req: Request, res: Response) => {
    try {
        const { conversationHistory, gameContext } = req.body;

        if (!conversationHistory || !Array.isArray(conversationHistory)) {
            return res.status(400).json({
                success: false,
                error: 'conversationHistory is required and must be an array'
            });
        }

        // Validate conversation history structure
        for (let i = 0; i < conversationHistory.length; i++) {
            const turn = conversationHistory[i];
            if (!turn || typeof turn !== 'object' || !turn.type) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid turn at index ${i}: missing type field`
                });
            }

            if (!['outsider_hint', 'ai_analysis', 'insider_guess'].includes(turn.type)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid turn type at index ${i}: ${turn.type}`
                });
            }
        }

        const thinking = await aiService.generateThinkingProcess(
            conversationHistory,
            gameContext
        );

        return res.json({
            success: true,
            data: { thinking }
        });
    } catch (error) {
        console.error('Error in AI thinking endpoint:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * POST /api/ai/guess
 * Generate AI guess based on conversation using new Turn structure
 */
router.post('/guess', async (req: Request, res: Response) => {
    try {
        const { conversationHistory, availableWords, gameContext } = req.body;

        if (!conversationHistory || !Array.isArray(conversationHistory)) {
            return res.status(400).json({
                success: false,
                error: 'conversationHistory is required and must be an array'
            });
        }

        if (!availableWords || !Array.isArray(availableWords)) {
            return res.status(400).json({
                success: false,
                error: 'availableWords is required and must be an array'
            });
        }

        // Validate conversation history structure
        for (let i = 0; i < conversationHistory.length; i++) {
            const turn = conversationHistory[i];
            if (!turn || typeof turn !== 'object' || !turn.type) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid turn at index ${i}: missing type field`
                });
            }

            if (!['outsider_hint', 'ai_analysis', 'insider_guess'].includes(turn.type)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid turn type at index ${i}: ${turn.type}`
                });
            }
        }

        const guess = await aiService.generateGuess(
            conversationHistory,
            availableWords,
            gameContext
        );

        return res.json({
            success: true,
            data: guess
        });
    } catch (error) {
        console.error('Error in AI guess endpoint:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/ai/health
 * Health check for AI service
 */
router.get('/health', async (req: Request, res: Response) => {
    try {
        const health = await aiService.getHealth();
        return res.json({
            success: true,
            data: health
        });
    } catch (error) {
        console.error('Error in AI health endpoint:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

export default router; 