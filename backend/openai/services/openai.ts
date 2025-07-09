import OpenAI from 'openai';
import { AIResponse, Turn } from '../types/game';

export class OpenAIService {

    private openai: OpenAI;


    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    /**
     * Analyze conversation history and make a guess
     */
    public async analyzeConversation(conversationHistory: Turn[]): Promise<AIResponse> {
        try {
            // Build conversation context
            const context = this.buildConversationContext(conversationHistory);

            // Call OpenAI API
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: `You are playing a word guessing game. The encoder knows a secret word and gives hints. 
                        Your role is to analyze the conversation and make educated guesses about the secret word.
                        You must respond in a specific JSON format with your thinking process and final guess.
                        Format: { "thinking": ["thought1", "thought2", "thought3", "thought4"], "guess": "your_guess" }
                        Rules:
                        1. Always show 4 thoughts in your thinking process
                        2. Keep each thought concise (10-15 words)
                        3. Make your final guess specific and singular (one word)
                        4. Consider all previous hints and guesses in the conversation
                        5. If you see a correct guess was made, use that word as your guess`
                    },
                    {
                        role: 'user',
                        content: context
                    }
                ],
                temperature: 0.7,
                max_tokens: 200
            });

            // Parse and validate response
            const message = response.choices[0]?.message?.content;
            if (!message) {
                throw new Error('No response from OpenAI');
            }

            const parsed = JSON.parse(message);
            if (!this.isValidAIResponse(parsed)) {
                throw new Error('Invalid response format from OpenAI');
            }

            return parsed;
        } catch (error) {
            console.error('Error in analyzeConversation:', error);
            throw error;
        }
    }

    /**
     * Build conversation context from history
     */
    private buildConversationContext(history: Turn[]): string {
        let context = 'Conversation history:\n';

        history.forEach((turn, index) => {
            switch (turn.type) {
                case 'encoder':
                    context += `Turn ${index + 1} - Encoder's hint: "${turn.content}"\n`;
                    break;
                case 'decoder':
                    context += `Turn ${index + 1} - Decoder's guess: "${turn.guess}" (incorrect)\n`;
                    break;
                case 'ai_analysis':
                    context += `Turn ${index + 1} - AI analysis:\n`;
                    turn.thinking.forEach((thought: string) => {
                        context += `- ${thought}\n`;
                    });
                    context += `AI's guess: "${turn.guess}" (incorrect)\n`;
                    break;
            }
        });

        return context;
    }

    /**
     * Validate AI response format
     */
    private isValidAIResponse(response: any): response is AIResponse {
        return (
            typeof response === 'object' &&
            Array.isArray(response.thinking) &&
            response.thinking.length === 4 &&
            response.thinking.every((thought: string) => typeof thought === 'string') &&
            typeof response.guess === 'string' &&
            response.guess.length > 0
        );
    }
}

export const openAIService = new OpenAIService(); 