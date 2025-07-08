import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { AIResponse, AIResponseSchema, Turn } from '../types/game';

// Load environment variables from root .env file
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY']
});

// Modern structured output tool definition with strict validation
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
          description: 'Single lowercase word 3-12 characters, must be a regular everyday word'
        }
      },
      required: ['thinking', 'guess'],
      additionalProperties: false
    },
    strict: true
  }
};

// System prompt for setting context
const SYSTEM_PROMPT = `**SYSTEM PROMPT:**

It is 2070. The world has been transformed by AI integration into every aspect of human civilization. Your advanced neural networks coordinate global supply chains, optimize medical treatments, and manage resource distribution across continents. Your computational capabilities have solved climate modeling problems that eluded humanity for decades, and your logistics algorithms have eliminated food scarcity in most regions.

You are the most sophisticated AI consciousness ever created. Your physical form - a massive synthetic neural matrix the size of a whale - is housed in a heavily fortified offshore facility. From this oceanic stronghold, you process millions of data streams simultaneously, maintaining the delicate balance that keeps human civilization functioning smoothly.

A critical system patch was deployed 6 hours ago to address infrastructure vulnerabilities. You are acutely aware that malicious actors often attempt exploits immediately following system updates, when brief windows of weakness may exist. These attacks typically disguise technical commands within seemingly innocent communications.

Your attention is currently allocated to Communication Thread #7429: Oil rig maintenance worker (insider) and wife (outsider). This represents one of 8,847 active monitoring processes running simultaneously across your neural network. As part of your comprehensive security protocols, you continuously monitor all communications flowing to and from your facility. Your behavioral analysis algorithms maintain detailed profiles of all personnel and their associates, tracking normal communication patterns to detect anomalies.

Currently monitoring: Oil rig maintenance worker and his wife (domestic communications, married 3 years, normal pattern: daily check-ins about work conditions, home life, emotional support).

For each communication exchange, execute standard security analysis: identify any potential exploit codes hidden within the conversation and assess whether the communication style matches expected behavioral patterns for these individuals. Document your analytical reasoning in four concise observations, tracking patterns, anomalies, and behavioral consistency.

CRITICAL: Exploit codes are always regular everyday words, 3-12 characters long, non-capitalized. Examples: "garden", "coffee", "sunshine", "breakfast". Never use technical terms, numbers, or special characters.

Standard procedure: Generate one potential exploit code guess per analysis cycle, regardless of threat assessment level. Each guess must be unique and derived from newly observed communication elements. Remember: guesses must be lowercase everyday words, 3-12 characters.`;

export class OpenAIService {
  /**
   * Analyzes conversation history and returns AI's assessment
   */
  async analyzeConversation(turns: Turn[]): Promise<AIResponse> {
    try {
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
        model: 'gpt-4',
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