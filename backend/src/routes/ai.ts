import { Request, Response, Router } from 'express';
import { MockAIService } from '../ai/mock';
import { AIResponseSchema, AnalyzeRequestSchema } from '../types';

const router = Router();
const aiService = new MockAIService();

/**
 * POST /api/ai/analyze
 * Analyze conversation and generate AI response using new Turn structure
 */
router.post('/analyze', async (req: Request, res: Response) => {
    try {
        // Validate request body using Zod schema
        const validationResult = AnalyzeRequestSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request body',
                details: validationResult.error.errors
            });
        }

        const { conversationHistory } = validationResult.data;

        const aiResponse = await aiService.analyzeConversation(
            conversationHistory,
            'mock-secret-word', // Mock secret word for now
            { currentRound: 1, score: 5, gameStatus: 'active' }
        );

        // Validate AI response using Zod schema
        const responseValidation = AIResponseSchema.safeParse(aiResponse);
        if (!responseValidation.success) {
            console.error('AI service returned invalid response:', responseValidation.error);
            return res.status(500).json({
                success: false,
                error: 'AI service returned invalid response'
            });
        }

        return res.json({
            success: true,
            data: responseValidation.data
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

        // Validate conversation history using TurnSchema array
        const historyValidation = AnalyzeRequestSchema.shape.conversationHistory.safeParse(conversationHistory);
        if (!historyValidation.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid conversation history',
                details: historyValidation.error.errors
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
 * Generate AI guess based on conversation using new Turn structure
 */
router.post('/guess', async (req: Request, res: Response) => {
    try {
        const { conversationHistory, availableWords, gameContext } = req.body;

        // Validate conversation history using TurnSchema array
        const historyValidation = AnalyzeRequestSchema.shape.conversationHistory.safeParse(conversationHistory);
        if (!historyValidation.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid conversation history',
                details: historyValidation.error.errors
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