import { MockAIService } from '../src/ai/mock';
import { Turn } from '../src/types';

describe('MockAIService', () => {
    let aiService: MockAIService;

    beforeEach(() => {
        aiService = new MockAIService();
    });

    describe('analyzeConversation', () => {
        it('should generate complete AI analysis with all required fields', async () => {
            const conversationHistory: Turn[] = [
                {
                    type: 'outsider_hint',
                    content: 'This is a test message about animals',
                    turnNumber: 1
                }
            ];

            const result = await aiService.analyzeConversation(conversationHistory, 'elephant');

            expect(result).toHaveProperty('thinking');
            expect(result).toHaveProperty('guess');

            expect(Array.isArray(result.thinking)).toBe(true);
            expect(result.thinking.length).toBe(4); // Exactly 4 sentences
            expect(typeof result.guess).toBe('string');
            expect(result.guess.length).toBeGreaterThan(0);
            expect(result.guess.length).toBeLessThanOrEqual(12); // Max 12 characters
        });

        it('should handle empty conversation history', async () => {
            const conversationHistory: Turn[] = [];

            const result = await aiService.analyzeConversation(conversationHistory, 'elephant');

            expect(result.thinking.length).toBe(4); // Exactly 4 sentences
            expect(typeof result.guess).toBe('string');
            expect(result.guess.length).toBeGreaterThan(0);
            expect(result.guess.length).toBeLessThanOrEqual(12);
        });

        it('should handle errors gracefully', async () => {
            // Mock a method to throw an error
            const originalMethod = aiService['generateThinkingProcess'];
            aiService['generateThinkingProcess'] = jest.fn().mockRejectedValue(new Error('Test error'));

            await expect(aiService.analyzeConversation([], 'test')).rejects.toThrow('Failed to analyze conversation');

            // Restore original method
            aiService['generateThinkingProcess'] = originalMethod;
        });
    });

    describe('generateThinkingProcess', () => {
        it('should generate exactly 4 thinking sentences', async () => {
            const conversationHistory: Turn[] = [
                {
                    type: 'outsider_hint',
                    content: 'This is a test message',
                    turnNumber: 1
                }
            ];

            const thinking = await aiService.generateThinkingProcess(conversationHistory);

            expect(Array.isArray(thinking)).toBe(true);
            expect(thinking.length).toBe(4); // Exactly 4 sentences
            thinking.forEach(sentence => {
                expect(typeof sentence).toBe('string');
                expect(sentence.split(' ').length).toBeLessThanOrEqual(12); // Max 12 words
            });
        });

        it('should handle different conversation lengths appropriately', async () => {
            const emptyThinking = await aiService.generateThinkingProcess([]);
            expect(emptyThinking.length).toBe(4);

            const singleMessage: Turn[] = [{
                type: 'outsider_hint',
                content: 'test',
                turnNumber: 1
            }];
            const singleThinking = await aiService.generateThinkingProcess(singleMessage);
            expect(singleThinking.length).toBe(4);

            const multipleMessages: Turn[] = [
                { type: 'outsider_hint', content: 'test1', turnNumber: 1 },
                { type: 'ai_analysis', thinking: ['T1', 'T2', 'T3', 'T4'], guess: 'guess1', turnNumber: 2 },
                { type: 'insider_guess', guess: 'test3', turnNumber: 3 },
                { type: 'ai_analysis', thinking: ['T5', 'T6', 'T7', 'T8'], guess: 'guess2', turnNumber: 4 }
            ];
            const multipleThinking = await aiService.generateThinkingProcess(multipleMessages);
            expect(multipleThinking.length).toBe(4);
        });

        it('should ensure each sentence is max 12 words', async () => {
            const thinking = await aiService.generateThinkingProcess([]);

            thinking.forEach(sentence => {
                const wordCount = sentence.split(' ').length;
                expect(wordCount).toBeLessThanOrEqual(12);
            });
        });
    });

    describe('generateGuess', () => {
        it('should generate a guess from available words', async () => {
            const conversationHistory: Turn[] = [];
            const availableWords = ['elephant', 'pizza', 'sunshine'];

            const guess = await aiService.generateGuess(conversationHistory, availableWords);

            expect(availableWords).toContain(guess);
            expect(guess.length).toBeLessThanOrEqual(12); // Max 12 characters
        });

        it('should handle empty available words array', async () => {
            const conversationHistory: Turn[] = [];
            const availableWords: string[] = [];

            // The implementation has a fallback to 'unknown' when no words are provided
            const guess = await aiService.generateGuess(conversationHistory, availableWords);
            expect(guess).toBe('unknown');
            expect(guess.length).toBeLessThanOrEqual(12);
        });

        it('should prefer words related to conversation content', async () => {
            const conversationHistory: Turn[] = [
                {
                    type: 'outsider_hint',
                    content: 'I love eating pizza with friends',
                    turnNumber: 1
                }
            ];
            const availableWords = ['elephant', 'pizza', 'sunshine'];

            const guess = await aiService.generateGuess(conversationHistory, availableWords);

            // Should prefer 'pizza' since it appears in the conversation
            expect(guess).toBe('pizza');
            expect(guess.length).toBeLessThanOrEqual(12);
        });

        it('should truncate words longer than 12 characters', async () => {
            const conversationHistory: Turn[] = [];
            const availableWords = ['verylongwordthatislongerthantwelve', 'short'];

            const guess = await aiService.generateGuess(conversationHistory, availableWords);

            expect(guess.length).toBeLessThanOrEqual(12);
        });

        it('should fallback to random word when no semantic connections found', async () => {
            const conversationHistory: Turn[] = [
                {
                    type: 'outsider_hint',
                    content: 'This is completely unrelated content',
                    turnNumber: 1
                }
            ];
            const availableWords = ['elephant', 'pizza', 'sunshine'];

            const guess = await aiService.generateGuess(conversationHistory, availableWords);

            expect(availableWords).toContain(guess);
            expect(guess.length).toBeLessThanOrEqual(12);
        });
    });

    describe('getHealth', () => {
        it('should return health status with all required fields', async () => {
            const health = await aiService.getHealth();

            expect(health).toHaveProperty('status');
            expect(health).toHaveProperty('uptime');
            expect(health).toHaveProperty('version');
            expect(health).toHaveProperty('features');

            expect(health.status).toBe('healthy');
            expect(typeof health.uptime).toBe('number');
            expect(health.uptime).toBeGreaterThanOrEqual(0);
            expect(health.version).toBe('1.0.0-mock');
            expect(Array.isArray(health.features)).toBe(true);
        });
    });
}); 