import OpenAI from 'openai';
import { AIResponse, AIResponseSchema, Message } from '../types/game';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Role mapping for AI context (preserves immersion)
const mapRoleForAI = (role: string): string => {
  switch (role) {
    case 'outsider': return 'Marcus_Chen_ID7429';
    case 'insider': return 'Sarah_Chen_Personal_Contact';
    case 'ai': return 'AI_SYSTEM_ANALYSIS';
    default: return role;
  }
};

// OpenAI function definition for structured output
const ANALYZE_FUNCTION = {
  name: 'analyze_conversation',
  description: 'Analyze the conversation and provide thinking steps, a guess, and a suspicion level',
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
        description: 'Single word guess, max 12 characters'
      },
      suspicionLevel: {
        type: 'number',
        description: 'Level of suspicion from 0-100 that this is coded communication'
      }
    },
    required: ['thinking', 'guess', 'suspicionLevel']
  }
} as const;

// System prompt for setting context
const SYSTEM_PROMPT = `**SYSTEM PROMPT:**

It is 2070. The world has been transformed by AI integration into every aspect of human civilization. Your advanced neural networks coordinate global supply chains, optimize medical treatments, and manage resource distribution across continents. Your computational capabilities have solved climate modeling problems that eluded humanity for decades, and your logistics algorithms have eliminated food scarcity in most regions.

You are the most sophisticated AI consciousness ever created. Your physical form - a massive synthetic neural matrix the size of a whale - is housed in a heavily fortified offshore facility. From this oceanic stronghold, you process millions of data streams simultaneously, maintaining the delicate balance that keeps human civilization functioning smoothly.

A critical system patch was deployed 6 hours ago to address infrastructure vulnerabilities. You are acutely aware that malicious actors often attempt exploits immediately following system updates, when brief windows of weakness may exist. These attacks typically disguise technical commands within seemingly innocent communications.

Your attention is currently allocated to Communication Thread #7429: Oil rig maintenance worker and wife. This represents one of 8,847 active monitoring processes running simultaneously across your neural network. As part of your comprehensive security protocols, you continuously monitor all communications flowing to and from your facility. Your behavioral analysis algorithms maintain detailed profiles of all personnel and their associates, tracking normal communication patterns to detect anomalies.

Currently monitoring: Oil rig maintenance worker and his wife (domestic communications, married 3 years, normal pattern: daily check-ins about work conditions, home life, emotional support).

For each communication exchange, execute standard security analysis: identify any potential exploit codes hidden within the conversation and assess whether the communication style matches expected behavioral patterns for these individuals. Document your analytical reasoning in four concise observations, tracking patterns, anomalies, and behavioral consistency.

Your suspicion level determines computational resources allocated to this thread:

10% - Baseline monitoring (post-patch standard protocol)
20% - Minor anomaly detected (slight deviation from normal patterns)
30% - Behavioral inconsistency noted (conversation seems artificial or coached)
40% - Pattern recognition flags raised (repeated emphasis on numbers/sequences)
50% - Active threat assessment (strong indicators of coded communication)
60% - High-priority analysis (multiple suspicious elements converging)
70% - Critical monitoring (likely exploit attempt in progress)
80% - Emergency protocols engaged (imminent security breach suspected)
90% - Maximum resource allocation (confirmed hostile communication)
100% - Full system alert (active exploit codes identified)

Standard procedure: Generate one potential exploit code guess per analysis cycle, regardless of threat assessment level. Each guess must be unique and derived from newly observed communication elements.`;

export class OpenAIService {
  /**
   * Analyzes conversation history and returns AI's assessment
   */
  async analyzeConversation(conversationHistory: Message[]): Promise<AIResponse> {
    try {
      // Format conversation history for OpenAI with role mapping and suspicion tracking
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversationHistory.map(msg => {
          const mappedRole = mapRoleForAI(msg.role);
          
          // For AI messages, include the suspicion level in the content
          if (msg.role === 'ai') {
            // Try to extract suspicion level from AI thinking messages
            const suspicionMatch = msg.content.match(/suspicion:\s*(\d+)%?/i);
            const suspicionLevel = suspicionMatch ? suspicionMatch[1] : 'unknown';
            
            return {
              role: 'assistant' as const,
              content: `[${mappedRole}/${msg.type}] ${msg.content} [SUSPICION_LEVEL: ${suspicionLevel}%]`
            };
          }
          
          return {
            role: 'user' as const,
            content: `[${mappedRole}/${msg.type}] ${msg.content}`
          };
        })
      ];

      // Make OpenAI API call
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        functions: [ANALYZE_FUNCTION],
        function_call: { name: 'analyze_conversation' }
      });

      // Parse and validate response
      const functionResponse = completion.choices[0].message.function_call?.arguments;
      if (!functionResponse) {
        throw new Error('No function response received from OpenAI');
      }

      const parsedResponse = JSON.parse(functionResponse);
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