import { Request, Response, Router } from 'express';
import { MockAIService } from '../ai/mock';

const router = Router();
const aiService = new MockAIService();

/**
 * POST /api/ai/analyze
 * Analyze conversation and generate AI response
 */
router.post('/analyze', async (req: Request, res: Response) => {
    try {
        const { conversationHistory, secretWord, gameContext } = req.body;

        if (!conversationHistory || !Array.isArray(conversationHistory)) {
            return res.status(400).json({
                success: false,
                error: 'conversationHistory is required and must be an array'
            });
        }

        const aiResponse = await aiService.analyzeConversation(
            conversationHistory,
            secretWord,
            gameContext
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
 * Generate thinking process for AI analysis
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
 * Generate AI guess based on conversation
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