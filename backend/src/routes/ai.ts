import { Request, Response, Router } from 'express';
import { ZodError } from 'zod';
import { openAIService } from '../../openai/services/openai';
import { AIResponseSchema, AnalyzeRequestSchema } from '../../openai/types/game';

const router = Router();

/**
 * POST /api/ai/analyze
 * Analyze conversation and generate AI response using new Turn structure
 */
router.post('/analyze', async (req: Request, res: Response) => {
    const startTime = Date.now();

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

        // Get AI analysis
        const aiResponse = await openAIService.analyzeConversation(conversationHistory);

        // Add metadata and validate response
        const responseValidation = AIResponseSchema.safeParse({
            ...aiResponse,
            metadata: {
                messageCount: conversationHistory.length,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime
            }
        });

        if (!responseValidation.success) {
            console.error('AI service returned invalid response:', responseValidation.error);
            return res.status(500).json({
                success: false,
                error: 'AI service returned invalid response',
                details: responseValidation.error.errors
            });
        }

        return res.json({
            success: true,
            data: responseValidation.data
        });
    } catch (error: unknown) {
        // Handle Zod validation errors
        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request format',
                details: error.errors
            });
        }

        // Handle known OpenAI errors
        if (error instanceof Error) {
            if (error.message.includes('Rate limit exceeded')) {
                return res.status(429).json({
                    success: false,
                    error: 'Rate limit exceeded',
                    message: 'Please try again later'
                });
            }

            if (error.message.includes('OpenAI service temporarily unavailable')) {
                return res.status(503).json({
                    success: false,
                    error: 'AI service unavailable',
                    message: 'Please try again later'
                });
            }

            console.error('Error in AI analyze endpoint:', error);
        }

        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'An unexpected error occurred'
        });
    }
});

/**
 * GET /api/ai/health
 * Health check for AI service
 */
router.get('/health', async (req: Request, res: Response) => {
    try {
        return res.json({
            success: true,
            data: {
                status: 'ok',
                service: 'smuggler-ai-integration',
                openaiKey: process.env['OPENAI_API_KEY'] ? '✅ Loaded' : '❌ Missing',
                timestamp: new Date().toISOString()
            }
        });
    } catch (error: unknown) {
        console.error('Error in AI health endpoint:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'An unexpected error occurred'
        });
    }
});

export default router; 