import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { AIResponse, AIResponseSchema, RoundAnalysis, RoundAnalysisSchema, RoundSummary, Turn } from '../types/game';
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
  private readonly ANALYZE_ROUND_TOOL = {
    type: "function" as const,
    function: {
      name: 'analyze_round',
      description: 'Analyze the round that just finished and identify player strategies',
      parameters: {
        type: 'object',
        properties: {
          analysis: {
            type: 'string',
            description: 'One sentence (max 20 words) describing key pattern/strategy used by players this round'
          },
          comment: {
            type: 'string',
            description: 'Generate a victory/defeat line (max 10 words) - boastful if AI won, humble if players won'
          }
        },
        required: ['analysis', 'comment'],
        additionalProperties: false
      }
    }
  };

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
   * Analyzes conversation history and returns AI's assessment
   */
  async analyzeConversation(turns: Turn[], previousAnalyses?: string[]): Promise<AIResponse> {
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

      // Add previous analyses to system prompt if available
      const previousAnalysesContext = previousAnalyses?.length 
        ? `\nPreviously observed player strategies:\n${previousAnalyses.join('\n')}\nBe on the lookout for similar approaches.`
        : '';

      // Make OpenAI API call using modern structured outputs
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: conversationHistory + previousAnalysesContext }
        ],
        tools: [ANALYZE_CONVERSATION_TOOL, this.ANALYZE_ROUND_TOOL],
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

  /**
   * Analyzes a completed round to identify player strategies
   */
  async analyzeRoundStrategy(summary: RoundSummary): Promise<RoundAnalysis> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: this.buildRoundAnalysisPrompt(summary) }
        ],
        tools: [this.ANALYZE_ROUND_TOOL],
        tool_choice: { type: "function", function: { name: "analyze_round" } }
      });

      const firstChoice = completion.choices[0]?.message;
      if (!firstChoice) {
        throw new Error('Round analysis: OpenAI returned no response');
      }

      const toolCall = firstChoice.tool_calls?.[0];
      if (!toolCall) {
        throw new Error('Round analysis: OpenAI returned no tool calls');
      }

      const parsedResponse = JSON.parse(toolCall.function.arguments);
      console.log('[DEBUG] Round analysis:', parsedResponse);
      return RoundAnalysisSchema.parse(parsedResponse);

    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        switch (error.status) {
          case 429:
            throw new Error('Round analysis: OpenAI rate limit exceeded');
          case 500:
            throw new Error('Round analysis: OpenAI service temporarily unavailable');
          default:
            throw new Error(`Round analysis: OpenAI service error - ${error.message}`);
        }
      }
      throw error;
    }
  }

  /**
   * Builds the prompt for round analysis
   */
  private buildRoundAnalysisPrompt(summary: RoundSummary): string {
    return `You are analyzing a completed round of the word-guessing game.
Your task: Identify ONE key pattern or strategy the players used to communicate.
Focus on HOW they conveyed meaning (e.g. "Players used movie references" or "Players built word chains").
Keep it to one clear sentence that future AI can use to anticipate similar tricks.

If players won: Add a humble comment acknowledging their cleverness.
If AI won: Add a playfully boastful comment about outsmarting them.

Round summary:
- Winner: ${summary.winner}
- Secret word was: ${summary.secretWord}
- Round number: ${summary.round}

Conversation:
${this.formatConversationHistory(summary.conversation)}`;
  }

  /**
   * Helper to format conversation history consistently
   */
  private formatConversationHistory(turns: Turn[]): string {
    return turns.map(turn => {
      switch (turn.type) {
        case 'outsider_hint':
          return `[OUTSIDER] ${turn.content}`;
        case 'insider_guess':
          return `[INSIDER] Guessed: ${turn.guess}`;
        case 'ai_analysis':
          return `[ANALYSIS] Thinking: ${turn.thinking.join(' ')} | Guess: ${turn.guess}`;
      }
    }).join('\n');
  }
}

export const openAIService = new OpenAIService();