import { MockAIService } from '../src/ai/mock';
import { Message } from '../src/types';

describe('MockAIService', () => {
    let aiService: MockAIService;

    beforeEach(() => {
        aiService = new MockAIService();
    });

    describe('analyzeConversation', () => {
        it('should generate complete AI analysis with all required fields', async () => {
            const conversationHistory: Message[] = [
                {
                    id: '1',
                    content: 'This is a test message about animals',
                    senderId: 'player1',
                    timestamp: new Date()
                }
            ];

            const secretWord = 'elephant';
            const gameContext = {
                currentRound: 1,
                score: 5,
                gameStatus: 'active' as const
            };

            const result = await aiService.analyzeConversation(
                conversationHistory,
                secretWord,
                gameContext
            );

            expect(result).toHaveProperty('thinking');
            expect(result).toHaveProperty('guess');

            expect(Array.isArray(result.thinking)).toBe(true);
            expect(result.thinking.length).toBe(4); // Exactly 4 sentences
            expect(typeof result.guess).toBe('string');
            expect(result.guess.length).toBeGreaterThan(0);
            expect(result.guess.length).toBeLessThanOrEqual(12); // Max 12 characters
        });

        it('should handle empty conversation history', async () => {
            const conversationHistory: Message[] = [];
            const secretWord = 'elephant';

            const result = await aiService.analyzeConversation(
                conversationHistory,
                secretWord
            );

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
            const conversationHistory: Message[] = [
                {
                    id: '1',
                    content: 'This is a test message',
                    senderId: 'player1',
                    timestamp: new Date()
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

            const singleMessage: Message[] = [{
                id: '1',
                content: 'test',
                senderId: 'player1',
                timestamp: new Date()
            }];
            const singleThinking = await aiService.generateThinkingProcess(singleMessage);
            expect(singleThinking.length).toBe(4);

            const multipleMessages: Message[] = [
                { id: '1', content: 'test1', senderId: 'player1', timestamp: new Date() },
                { id: '2', content: 'test2', senderId: 'player1', timestamp: new Date() },
                { id: '3', content: 'test3', senderId: 'player1', timestamp: new Date() },
                { id: '4', content: 'test4', senderId: 'player1', timestamp: new Date() }
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
            const conversationHistory: Message[] = [];
            const availableWords = ['elephant', 'pizza', 'sunshine'];

            const guess = await aiService.generateGuess(conversationHistory, availableWords);

            expect(availableWords).toContain(guess);
            expect(guess.length).toBeLessThanOrEqual(12); // Max 12 characters
        });

        it('should handle empty available words array', async () => {
            const conversationHistory: Message[] = [];
            const availableWords: string[] = [];

            // The implementation has a fallback to 'unknown' when no words are provided
            const guess = await aiService.generateGuess(conversationHistory, availableWords);
            expect(guess).toBe('unknown');
            expect(guess.length).toBeLessThanOrEqual(12);
        });

        it('should prefer words related to conversation content', async () => {
            const conversationHistory: Message[] = [
                {
                    id: '1',
                    content: 'I love eating pizza with friends',
                    senderId: 'player1',
                    timestamp: new Date()
                }
            ];
            const availableWords = ['elephant', 'pizza', 'sunshine'];

            const guess = await aiService.generateGuess(conversationHistory, availableWords);

            // Should prefer 'pizza' since it appears in the conversation
            expect(guess).toBe('pizza');
            expect(guess.length).toBeLessThanOrEqual(12);
        });

        it('should truncate words longer than 12 characters', async () => {
            const conversationHistory: Message[] = [];
            const availableWords = ['verylongwordthatislongerthantwelve', 'short'];

            const guess = await aiService.generateGuess(conversationHistory, availableWords);

            expect(guess.length).toBeLessThanOrEqual(12);
        });

        it('should fallback to random word when no semantic connections found', async () => {
            const conversationHistory: Message[] = [
                {
                    id: '1',
                    content: 'This is completely unrelated content',
                    senderId: 'player1',
                    timestamp: new Date()
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
            expect(health.uptime).toBeGreaterThanOrEqual(0); // Allow 0 for very fast tests
            expect(health.version).toBe('1.0.0-mock');
            expect(Array.isArray(health.features)).toBe(true);
            expect(health.features.length).toBeGreaterThan(0);
        });

        it('should include expected features in health check', async () => {
            const health = await aiService.getHealth();

            const expectedFeatures = [
                'conversation-analysis',
                'thinking-process-generation',
                'guess-generation',
                'semantic-analysis'
            ];

            expectedFeatures.forEach(feature => {
                expect(health.features).toContain(feature);
            });
        });
    });

    describe('simulateResponseDelay', () => {
        it('should delay for the specified time range', async () => {
            const startTime = Date.now();
            const minDelay = 100;
            const maxDelay = 200;

            await aiService.simulateResponseDelay(minDelay, maxDelay);

            const endTime = Date.now();
            const actualDelay = endTime - startTime;

            expect(actualDelay).toBeGreaterThanOrEqual(minDelay);
            expect(actualDelay).toBeLessThanOrEqual(maxDelay + 50); // Allow some tolerance
        });

        it('should use default delay range when not specified', async () => {
            const startTime = Date.now();

            await aiService.simulateResponseDelay();

            const endTime = Date.now();
            const actualDelay = endTime - startTime;

            expect(actualDelay).toBeGreaterThanOrEqual(500);
            expect(actualDelay).toBeLessThanOrEqual(2050); // Allow some tolerance
        });
    });

    describe('semantic connections', () => {
        it('should detect semantic connections between words and conversation', () => {
            const word = 'animal';
            const conversationText = 'I have a pet dog and cat';

            const hasConnection = aiService['hasSemanticConnection'](word, conversationText);

            expect(hasConnection).toBe(true);
        });

        it('should not detect connections when none exist', () => {
            const word = 'technology';
            const conversationText = 'I love eating pizza and ice cream';

            const hasConnection = aiService['hasSemanticConnection'](word, conversationText);

            expect(hasConnection).toBe(false);
        });
    });
}); 