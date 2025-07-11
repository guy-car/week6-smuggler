import request from 'supertest';
import { app } from '../src/server';
import { Turn } from '../src/types';

describe.skip('AI Routes', () => {
    describe('POST /api/ai/analyze', () => {
        it('should analyze conversation and return AI response', async () => {
            const conversationHistory: Turn[] = [
                {
                    type: 'encoder_hint',
                    content: 'This is a test message about animals',
                    turnNumber: 1
                },
                {
                    type: 'ai_analysis',
                    thinking: ['Thought 1', 'Thought 2', 'Thought 3', 'Thought 4'],
                    guess: 'banana',
                    turnNumber: 2
                },
                {
                    type: 'decoder_guess',
                    guess: 'cherry',
                    turnNumber: 3
                }
            ];

            const requestBody = {
                gameId: 'room123',
                conversationHistory
            };

            const response = await request(app)
                .post('/api/ai/analyze')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('thinking');
            expect(response.body.data).toHaveProperty('guess');

            expect(Array.isArray(response.body.data.thinking)).toBe(true);
            expect(response.body.data.thinking.length).toBe(4); // Exactly 4 sentences
            expect(typeof response.body.data.guess).toBe('string');
            expect(response.body.data.guess.length).toBeLessThanOrEqual(12); // Max 12 characters
        });

        it('should return 400 when conversationHistory is missing', async () => {
            const requestBody = {
                gameId: 'room123'
            };

            const response = await request(app)
                .post('/api/ai/analyze')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('conversationHistory is required');
        });

        it('should return 400 when conversationHistory is not an array', async () => {
            const requestBody = {
                gameId: 'room123',
                conversationHistory: 'not an array'
            };

            const response = await request(app)
                .post('/api/ai/analyze')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('must be an array');
        });

        it('should handle request without gameId', async () => {
            const conversationHistory: Turn[] = [
                {
                    type: 'encoder_hint',
                    content: 'Test message',
                    turnNumber: 1
                }
            ];

            const requestBody = {
                conversationHistory
            };

            const response = await request(app)
                .post('/api/ai/analyze')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('thinking');
            expect(response.body.data).toHaveProperty('guess');
        });

        it('should validate turn structure correctly', async () => {
            const conversationHistory: Turn[] = [
                {
                    type: 'encoder_hint',
                    content: 'Test message',
                    turnNumber: 1
                },
                {
                    type: 'ai_analysis',
                    thinking: ['Thought 1', 'Thought 2', 'Thought 3', 'Thought 4'],
                    guess: 'testguess',
                    turnNumber: 2
                }
            ];

            const requestBody = {
                gameId: 'room123',
                conversationHistory
            };

            const response = await request(app)
                .post('/api/ai/analyze')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.thinking).toHaveLength(4);
            expect(typeof response.body.data.guess).toBe('string');
        });

        it('should handle empty conversation history', async () => {
            const requestBody = {
                gameId: 'room123',
                conversationHistory: []
            };

            const response = await request(app)
                .post('/api/ai/analyze')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.thinking.length).toBe(4); // Exactly 4 sentences
            expect(typeof response.body.data.guess).toBe('string');
        });

        it('should validate turn numbers are sequential', async () => {
            const conversationHistory: Turn[] = [
                {
                    type: 'encoder_hint',
                    content: 'Test message',
                    turnNumber: 1
                },
                {
                    type: 'ai_analysis',
                    thinking: ['Thought 1', 'Thought 2', 'Thought 3', 'Thought 4'],
                    guess: 'testguess',
                    turnNumber: 3 // Invalid: should be 2
                }
            ];

            const requestBody = {
                gameId: 'room123',
                conversationHistory
            };

            const response = await request(app)
                .post('/api/ai/analyze')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Turn numbers must be sequential');
        });

        it('should validate turn order is correct', async () => {
            const conversationHistory: Turn[] = [
                {
                    type: 'encoder_hint',
                    content: 'Test message',
                    turnNumber: 1
                },
                {
                    type: 'encoder_hint', // Invalid: two encoder turns in a row
                    content: 'Another message',
                    turnNumber: 2
                }
            ];

            const requestBody = {
                gameId: 'room123',
                conversationHistory
            };

            const response = await request(app)
                .post('/api/ai/analyze')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Invalid turn order');
        });
    });

    describe('POST /api/ai/thinking', () => {
        it('should generate thinking process', async () => {
            const conversationHistory: Turn[] = [
                {
                    type: 'encoder_hint',
                    content: 'This is a test message',
                    turnNumber: 1
                }
            ];

            const requestBody = {
                gameId: 'room123',
                conversationHistory
            };

            const response = await request(app)
                .post('/api/ai/thinking')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('thinking');
            expect(Array.isArray(response.body.data.thinking)).toBe(true);
            expect(response.body.data.thinking.length).toBe(4); // Exactly 4 sentences
        });

        it('should handle empty conversation history', async () => {
            const requestBody = {
                gameId: 'room123',
                conversationHistory: []
            };

            const response = await request(app)
                .post('/api/ai/thinking')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.thinking.length).toBe(4); // Exactly 4 sentences
        });
    });

    describe('POST /api/ai/guess', () => {
        it('should generate AI guess', async () => {
            const conversationHistory: Turn[] = [
                {
                    type: 'encoder_hint',
                    content: 'I love eating pizza',
                    turnNumber: 1
                }
            ];

            const requestBody = {
                gameId: 'room123',
                conversationHistory,
                availableWords: ['elephant', 'pizza', 'sunshine']
            };

            const response = await request(app)
                .post('/api/ai/guess')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(typeof response.body.data).toBe('string'); // The guess endpoint returns just the string
            expect(requestBody.availableWords).toContain(response.body.data);
            expect(response.body.data.length).toBeLessThanOrEqual(12); // Max 12 characters
        });

        it('should return 400 when availableWords is missing', async () => {
            const requestBody = {
                gameId: 'room123',
                conversationHistory: []
            };

            const response = await request(app)
                .post('/api/ai/guess')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('availableWords is required');
        });

        it('should return 400 when availableWords is not an array', async () => {
            const requestBody = {
                gameId: 'room123',
                conversationHistory: [],
                availableWords: 'not an array'
            };

            const response = await request(app)
                .post('/api/ai/guess')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('must be an array');
        });
    });

    describe('GET /api/ai/health', () => {
        it('should return AI service health status', async () => {
            const response = await request(app)
                .get('/api/ai/health')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('status');
            expect(response.body.data).toHaveProperty('uptime');
            expect(response.body.data).toHaveProperty('version');
            expect(response.body.data).toHaveProperty('features');

            expect(response.body.data.status).toBe('healthy');
            expect(typeof response.body.data.uptime).toBe('number');
            expect(response.body.data.uptime).toBeGreaterThanOrEqual(0);
            expect(response.body.data.version).toBe('1.0.0-mock');
            expect(Array.isArray(response.body.data.features)).toBe(true);
        });
    });

    describe('Error handling', () => {
        it('should handle malformed JSON gracefully', async () => {
            const response = await request(app)
                .post('/api/ai/analyze')
                .send('invalid json')
                .set('Content-Type', 'application/json')
                .expect(500); // Express returns 500 for malformed JSON

            expect(response.body.error).toBeDefined();
        });

        it('should handle missing request body', async () => {
            const response = await request(app)
                .post('/api/ai/analyze')
                .expect(400);

            expect(response.body.error).toBeDefined();
        });
    });
}); 