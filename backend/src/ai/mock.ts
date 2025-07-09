import { AIResponse, Turn } from '../types';

export interface GameContext {
    currentRound: number;
    score: number;
    gameStatus: 'waiting' | 'active' | 'ended';
    previousGuesses?: string[];
}

export interface AIHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    version: string;
    features: string[];
}

export class MockAIService {
    private readonly serviceStartTime: number;
    private readonly version: string = '1.0.0-mock';
    private readonly thinkingTemplates: string[][] = [
        [
            "Analyzing conversation patterns for clues.",
            "Looking for word associations and themes.",
            "Evaluating communication strategies used.",
            "Processing semantic connections in context."
        ],
        [
            "Examining linguistic patterns in messages.",
            "Identifying potential word relationships.",
            "Analyzing tone and style of communication.",
            "Processing contextual information carefully."
        ],
        [
            "Studying message structure and content.",
            "Looking for hidden meanings or codes.",
            "Analyzing frequency of certain words.",
            "Considering cultural references present."
        ],
        [
            "Processing conversation flow and themes.",
            "Identifying key topics and subjects.",
            "Analyzing complexity of messages sent.",
            "Evaluating word associations found."
        ]
    ];

    constructor() {
        this.serviceStartTime = Date.now();
    }

    /**
     * Analyze conversation and generate AI response
     */
    public async analyzeConversation(
        conversationHistory: Turn[],
        secretWord: string,
        gameContext?: GameContext
    ): Promise<AIResponse> {
        try {
            // Generate thinking process (exactly 4 sentences)
            const thinking = await this.generateThinkingProcess(conversationHistory, gameContext);

            // Generate guess from available words
            const availableWords = this.getMockAvailableWords();
            const guess = await this.generateGuess(conversationHistory, availableWords, gameContext);

            return {
                thinking,
                guess
            };
        } catch (error) {
            console.error('Error in analyzeConversation:', error);
            throw new Error('Failed to analyze conversation');
        }
    }

    /**
     * Generate thinking process for AI analysis (exactly 4 sentences)
     */
    public async generateThinkingProcess(
        conversationHistory: Turn[],
        gameContext?: GameContext
    ): Promise<string[]> {
        try {
            // Select a random thinking template (already has exactly 4 sentences)
            const templateIndex = Math.floor(Math.random() * this.thinkingTemplates.length);
            const baseThinking = this.thinkingTemplates[templateIndex]!;

            // Validate that each sentence is within 12 words
            const validatedThinking = baseThinking.map(sentence => {
                const words = sentence.split(' ');
                if (words.length > 12) {
                    return words.slice(0, 12).join(' ');
                }
                return sentence;
            });

            // Ensure exactly 4 sentences
            while (validatedThinking.length < 4) {
                validatedThinking.push("Processing available information.");
            }
            if (validatedThinking.length > 4) {
                validatedThinking.splice(4);
            }

            return validatedThinking;
        } catch (error) {
            console.error('Error in generateThinkingProcess:', error);
            return [
                "Analyzing conversation patterns.",
                "Looking for contextual clues.",
                "Processing available information.",
                "Evaluating potential matches."
            ];
        }
    }

    /**
     * Generate AI guess based on conversation (max 12 characters)
     */
    public async generateGuess(
        conversationHistory: Turn[],
        availableWords: string[],
        gameContext?: GameContext
    ): Promise<string> {
        try {
            if (!availableWords || availableWords.length === 0) {
                throw new Error('No available words provided');
            }

            // Mock logic: analyze conversation content and select a word
            let selectedWord: string;

            if (conversationHistory.length === 0) {
                // No conversation, pick random word
                selectedWord = availableWords[Math.floor(Math.random() * availableWords.length)]!;
            } else {
                // Analyze conversation content for clues
                const conversationText = conversationHistory
                    .map(turn => {
                        if (turn.type === 'outsider_hint') {
                            return turn.content.toLowerCase();
                        } else if (turn.type === 'ai_analysis') {
                            return turn.guess.toLowerCase();
                        } else if (turn.type === 'insider_guess') {
                            return turn.guess.toLowerCase();
                        }
                        return '';
                    })
                    .join(' ');

                // Look for words that might be related to the conversation
                const relatedWords = availableWords.filter(word =>
                    conversationText.includes(word.toLowerCase()) ||
                    this.hasSemanticConnection(word, conversationText)
                );

                if (relatedWords.length > 0) {
                    // Pick from related words
                    selectedWord = relatedWords[Math.floor(Math.random() * relatedWords.length)]!;
                } else {
                    // No obvious connections, pick random word
                    selectedWord = availableWords[Math.floor(Math.random() * availableWords.length)]!;
                }
            }

            // Ensure word is max 12 characters
            if (selectedWord.length > 12) {
                selectedWord = selectedWord.substring(0, 12);
            }

            return selectedWord;
        } catch (error) {
            console.error('Error in generateGuess:', error);
            // Fallback to first available word or 'unknown'
            const fallback = availableWords[0] || 'unknown';
            return fallback.length > 12 ? fallback.substring(0, 12) : fallback;
        }
    }

    /**
     * Check for semantic connections between word and conversation
     */
    private hasSemanticConnection(word: string, conversationText: string): boolean {
        // Mock semantic analysis - in real implementation this would use NLP
        const wordLower = word.toLowerCase();
        const commonAssociations: { [key: string]: string[] } = {
            'animal': ['pet', 'wild', 'nature', 'zoo', 'farm'],
            'food': ['eat', 'cook', 'restaurant', 'meal', 'hungry'],
            'color': ['paint', 'art', 'bright', 'dark', 'rainbow'],
            'emotion': ['feel', 'happy', 'sad', 'angry', 'love'],
            'weather': ['sun', 'rain', 'storm', 'cloud', 'wind'],
            'technology': ['computer', 'phone', 'internet', 'digital', 'screen']
        };

        // Check if word has associations that appear in conversation
        for (const [category, associations] of Object.entries(commonAssociations)) {
            if (wordLower.includes(category) || associations.some(assoc => wordLower.includes(assoc))) {
                if (associations.some(assoc => conversationText.includes(assoc))) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Get mock available words (using real word list)
     */
    private getMockAvailableWords(): string[] {
        // Import the real word list from the data file
        try {
            const wordsData = require('../data/words.json');
            return wordsData.words || [];
        } catch (error) {
            console.warn('Could not load real word list, using fallback words');
            return [
                'elephant', 'pizza', 'sunshine', 'mountain', 'ocean',
                'butterfly', 'chocolate', 'rainbow', 'forest', 'castle',
                'dragon', 'guitar', 'diamond', 'volcano', 'telescope',
                'waterfall', 'fireworks', 'treasure', 'pirate', 'wizard'
            ];
        }
    }

    /**
     * Get AI service health status
     */
    public async getHealth(): Promise<AIHealth> {
        try {
            const uptime = Date.now() - this.serviceStartTime;

            return {
                status: 'healthy',
                uptime,
                version: this.version,
                features: [
                    'conversation-analysis',
                    'thinking-process-generation',
                    'guess-generation',
                    'semantic-analysis'
                ]
            };
        } catch (error) {
            console.error('Error in getHealth:', error);
            return {
                status: 'unhealthy',
                uptime: 0,
                version: this.version,
                features: []
            };
        }
    }

    /**
     * Simulate AI response timing
     */
    public async simulateResponseDelay(minDelay: number = 500, maxDelay: number = 2000): Promise<void> {
        const delay = Math.random() * (maxDelay - minDelay) + minDelay;
        await new Promise(resolve => setTimeout(resolve, delay));
    }
} 