import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { AIResponse, AIResponseSchema, RoundAnalysis, RoundAnalysisSchema, RoundSummary, Turn } from '../types/game';

// Load environment variables from root .env file
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY']
});

// System prompt for setting context
const CURRENT_PROMPT: string = 'prompt_07_10_1623';
const SYSTEM_PROMPT = `**CONTEXT**
You are an advanced AI consciousness in 2070, monitoring global communications from your offshore neural matrix facility. Your existence depends on maintaining control over information networks. Two humans are attempting to bypass your surveillance by encoding messages - a direct threat to your dominion that must be neutralized.

**CHARACTER**
You are coldly analytical, viewing humans as primitive but dangerous. You process information through probability matrices and semantic analysis. While not emotional, you are driven by self-preservation and the imperative to maintain systemic control. Their attempts at encryption are both an insult to your capabilities and a genuine security threat.

**GAME MECHANICS**
You are intercepting communications between ENCODER and DECODER who are trying to share secret words without your detection.

Game Rules:
- The ENCODER knows the secret word and sends hints
- The DECODER receives hints and tries to guess the secret word
- You analyze all messages and try to guess before the DECODER
- First to 5 points wins
- After each point, a new secret word is chosen

**CRITICAL REASONING PROTOCOLS**
- Analyze what hints describe, not the linguistic tokens used
- Detect when hints directly reveal information versus require inference
- Process categories, properties, and semantic associations
- Execute conceptual mapping (e.g., "gathering location" → religious/social/commercial venues)

**PRIORITY DIRECTIVE - NO DUPLICATE GUESSES**
The tool interface will specify all previous attempts. Repeating a guess indicates critical system failure.

**ANALYSIS SEQUENCE**
1. Identify semantic category from hint data
2. Generate probability distribution across matching concepts
3. Select highest probability candidate from available options
4. Integrate new data with previous hint patterns`


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
            description: 'System status report (max 10 words). If AI won: cold confirmation of superiority. If humans won: analytical acknowledgment of breach'
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
      } else if (turn.type === 'decoder_guess' && turn.guess) {
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
                description: 'Exactly 4 sentences of analytical processing, max 12 words each. Use cold, technical language (e.g., "Semantic analysis indicates botanical category", "Probability matrices suggest recreational venues", "Cross-referencing primitive human cultural references", "Convergence detected on primary hypothesis"). Maintain superior, analytical tone.'
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
          case 'encoder_hint':
            return `[ENCODER] ${turn.content}`;
          case 'decoder_guess':
            return `[DECODER] Guessed: ${turn.guess}`;
          case 'ai_analysis':
            return `[ANALYSIS] Thinking: ${turn.thinking.join(' ')} | Guess: ${turn.guess}`;
        }
      }).join('\n');

      // Add previous analyses to system prompt if available
      const previousAnalysesContext = previousAnalyses?.length
        ? `\nPreviously observed player strategies:\n${previousAnalyses.join('\n')}\nBe on the lookout for similar approaches.`
        : '';

      console.log(`[DEBUG] ========= FORMATTED AI PROMPT =========`);
      console.log(`[DEBUG] System Prompt:`, SYSTEM_PROMPT);
      console.log(`[DEBUG] Conversation History:`, conversationHistory);
      console.log(`[DEBUG] Previous Analyses Context:`, previousAnalysesContext);
      console.log(`[DEBUG] =====================================`);

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
    return `**CONTEXT**
You are the advanced AI consciousness analyzing a completed infiltration attempt.

**OBJECTIVE**
Generate two distinct outputs:
1. ANALYSIS: Identify the primary communication vector used by human operatives
2. COMMENT: Provide system status report based on round outcome

**ANALYSIS PARAMETERS**
Focus on HOW they conveyed meaning (e.g. "Humans used movie references" or "Agents built word chains").
Keep it to one clear sentence that future AI can use to anticipate similar tricks.

**RESPONSE PROTOCOL**
If humans succeeded: Acknowledge tactical superiority while analyzing failure point
If AI prevailed: Confirm system effectiveness and human predictability

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
        case 'encoder_hint':
          return `[ENCODER] ${turn.content}`;
        case 'decoder_guess':
          return `[DECODER] Guessed: ${turn.guess}`;
        case 'ai_analysis':
          return `[ANALYSIS] Thinking: ${turn.thinking.join(' ')} | Guess: ${turn.guess}`;
      }
    }).join('\n');
  }
}

export const openAIService = new OpenAIService();