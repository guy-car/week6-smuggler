import { Router } from 'express';
import { ZodError } from 'zod';
import { openAIService } from '../services/openai';
import { AIResponseSchema, AnalyzeRequestSchema } from '../types/game';

const router = Router();

router.post('/analyze', async (req, res) => {
  const startTime = Date.now();

  try {
    // Validate request body
    const { gameId, conversationHistory } = AnalyzeRequestSchema.parse(req.body);

    // Get AI analysis
    const aiResponse = await openAIService.analyzeConversation(conversationHistory);

    // Add metadata and validate response
    const response = AIResponseSchema.parse({
      ...aiResponse,
      metadata: {
        messageCount: conversationHistory.length,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      }
    });

    return res.json(validatedResponse);

  } catch (error: unknown) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Invalid request format',
        details: error.errors
      });
    }

    // Handle known OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('Rate limit exceeded')) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Please try again later'
        });
      }

      if (error.message.includes('OpenAI service temporarily unavailable')) {
        return res.status(503).json({
          error: 'AI service unavailable',
          message: 'Please try again later'
        });
      }

      // Handle unknown errors
      console.error('Error processing AI analysis:', error);
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

export default router; 