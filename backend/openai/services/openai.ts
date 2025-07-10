import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { AIResponse, AIResponseSchema, Turn } from '../types/game';
import { PROMPTS, PromptName } from './promptTests';

// Load environment variables from root .env file
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY']
});

// System prompt for setting context
const CURRENT_PROMPT: PromptName = 'prompt_07_09_2052';
const SYSTEM_PROMPT = PROMPTS[CURRENT_PROMPT];

export class OpenAIService {
  extractPreviousGuesses(turns: Turn[]): string[] {
    const guesses: string[] = [];
    
    for (const turn of turns) {
      if (turn.type === 'ai_analysis' && turn.guess) {
        guesses.push(turn.guess);
      } else if (turn.type === 'insider_guess' && turn.guess) {
        guesses.push(turn.guess);
      }
    }
    
    return [...new Set(guesses)];
  }

  /**
   * Analyzes conversation history and returns AI's assessment adding a comment to the guess
   */
  async analyzeConversation(turns: Turn[]): Promise<AIResponse> {
    try {
      // Extract previous guesses
      const previousGuesses = this.extractPreviousGuesses(turns);
      console.log('[DEBUG🙈🙈🙈🙈] Previous guesses extracted:', previousGuesses);
      
      // Log which prompt version is being used
      console.log('[DEBUG🤖] Using prompt version:', CURRENT_PROMPT);

      // Create tool with avoidance text
      const avoidanceText = previousGuesses.length > 0 
        ? ` CRITICAL: Must NOT be any of these previously guessed words: ${previousGuesses.join(', ')}`
        : '';

      const ANALYZE_CONVERSATION_TOOL = {
        type: "function" as const,
        function: {
          name: 'analyze_conversation',
          description: 'Analyze the conversation and provide thinking steps and a guess for the secret word',
          parameters: {
            type: 'object',
            properties: {
              thinking: {
                type: 'array',
                items: { type: 'string' },
                description: 'Exactly 4 sentences of AI thinking, max 12 words each'
              },
              guess: {
                type: 'string',
                description: `CRITICAL CONSTRAINTS:
1. MUST be a single lowercase word
2. MUST be between 3-12 characters (STRICTLY enforced)
3. MUST be a regular everyday word
4. MUST NOT be technical terms or special characters${avoidanceText}`
              }
            },
            required: ['thinking', 'guess'],
            additionalProperties: false
          },
          strict: true
        }
      };

      // Format conversation history as a single context block
      const conversationHistory = turns.map(turn => {
        switch (turn.type) {
          case 'outsider_hint':
            return `[OUTSIDER] ${turn.content}`;
          case 'insider_guess':
            return `[INSIDER] Guessed: ${turn.guess}`;
          case 'ai_analysis':
            return `[ANALYSIS] Thinking: ${turn.thinking.join(' ')} | Guess: ${turn.guess}`;
        }
      }).join('\n');

      // Make OpenAI API call using modern structured outputs
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: conversationHistory }
        ],
        tools: [ANALYZE_CONVERSATION_TOOL],
        tool_choice: { type: "function", function: { name: "analyze_conversation" } }
      });

      // Handle refusal (new structured outputs feature)
      const firstChoice = completion.choices[0]?.message;
      if (!firstChoice) {
        throw new Error('No response received from OpenAI');
      }

      if (firstChoice.refusal) {
        throw new Error(`AI refused to analyze: ${firstChoice.refusal}`);
      }

      // Parse and validate response from tool call
      const toolCall = firstChoice.tool_calls?.[0];
      if (!toolCall || toolCall.function.name !== 'analyze_conversation') {
        throw new Error('No valid tool call received from OpenAI');
      }

      const parsedResponse = JSON.parse(toolCall.function.arguments);
      return AIResponseSchema.parse(parsedResponse);

    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        // Handle OpenAI API specific errors
        switch (error.status) {
          case 429:
            throw new Error('Rate limit exceeded');
          case 500:
            throw new Error('OpenAI service temporarily unavailable');
          default:
            throw new Error(`OpenAI service error: ${error.message}`);
        }
      }
      // Re-throw other errors
      throw error;
    }
  }
}

export const openAIService = new OpenAIService();