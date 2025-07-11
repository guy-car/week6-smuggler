import { Turn } from '../store/gameStore';

describe('Conversation Filtering Logic', () => {
    const createMockTurn = (type: 'encoder' | 'ai' | 'decoder', content: string, playerId?: string): Turn => ({
        id: `turn-${Date.now()}-${Math.random()}`,
        type,
        content,
        timestamp: new Date().toISOString(),
        playerId
    });

    describe('AI Message Filtering', () => {
        it('should filter out AI messages from conversation display', () => {
            const conversation: Turn[] = [
                createMockTurn('encoder', 'Hello world', 'player1'),
                createMockTurn('ai', 'Thinking: Analyzing...\n\nGuess: apple'),
                createMockTurn('decoder', 'My guess is orange', 'player2'),
                createMockTurn('ai', 'Thinking: Processing...\n\nGuess: banana')
            ];

            // Apply the filtering logic
            const displayConversation = conversation.filter(turn => turn.type !== 'ai');

            // Verify results
            expect(displayConversation).toHaveLength(2);
            expect(displayConversation[0]?.type).toBe('encoder');
            expect(displayConversation[1]?.type).toBe('decoder');
            expect(displayConversation.some(turn => turn.type === 'ai')).toBe(false);
        });

        it('should preserve conversation order when filtering AI messages', () => {
            const conversation: Turn[] = [
                createMockTurn('encoder', 'First message', 'player1'),
                createMockTurn('ai', 'AI response 1'),
                createMockTurn('decoder', 'Second message', 'player2'),
                createMockTurn('ai', 'AI response 2'),
                createMockTurn('encoder', 'Third message', 'player1')
            ];

            const displayConversation = conversation.filter(turn => turn.type !== 'ai');

            expect(displayConversation).toHaveLength(3);
            expect(displayConversation[0]?.content).toBe('First message');
            expect(displayConversation[1]?.content).toBe('Second message');
            expect(displayConversation[2]?.content).toBe('Third message');
        });

        it('should return empty array when only AI messages are present', () => {
            const conversation: Turn[] = [
                createMockTurn('ai', 'Thinking: Test...\n\nGuess: test'),
                createMockTurn('ai', 'Thinking: Another...\n\nGuess: another')
            ];

            const displayConversation = conversation.filter(turn => turn.type !== 'ai');

            expect(displayConversation).toHaveLength(0);
            expect(displayConversation).toEqual([]);
        });

        it('should return all messages when no AI messages are present', () => {
            const conversation: Turn[] = [
                createMockTurn('encoder', 'Message 1', 'player1'),
                createMockTurn('decoder', 'Guess 1', 'player2'),
                createMockTurn('encoder', 'Message 2', 'player1')
            ];

            const displayConversation = conversation.filter(turn => turn.type !== 'ai');

            expect(displayConversation).toHaveLength(3);
            expect(displayConversation).toEqual(conversation);
        });

        it('should handle empty conversation array', () => {
            const conversation: Turn[] = [];

            const displayConversation = conversation.filter(turn => turn.type !== 'ai');

            expect(displayConversation).toHaveLength(0);
            expect(displayConversation).toEqual([]);
        });
    });

    describe('Message Type Classification', () => {
        it('should correctly identify encoder messages', () => {
            const turn = createMockTurn('encoder', 'Test message', 'player1');

            expect(turn.type).toBe('encoder');
            expect(turn.type === 'encoder').toBe(true);
            expect(turn.type === 'ai').toBe(false);
            expect(turn.type === 'decoder').toBe(false);
        });

        it('should correctly identify decoder messages', () => {
            const turn = createMockTurn('decoder', 'Test guess', 'player2');

            expect(turn.type).toBe('decoder');
            expect(turn.type === 'decoder').toBe(true);
            expect(turn.type === 'ai').toBe(false);
            expect(turn.type === 'encoder').toBe(false);
        });

        it('should correctly identify AI messages', () => {
            const turn = createMockTurn('ai', 'Thinking: Test...\n\nGuess: test');

            expect(turn.type).toBe('ai');
            expect(turn.type === 'ai').toBe(true);
            expect(turn.type === 'encoder').toBe(false);
            expect(turn.type === 'decoder').toBe(false);
        });
    });

    describe('AI Content Parsing', () => {
        it('should parse AI content with thinking and guess', () => {
            const aiContent = 'Thinking: Analyzing conversation... Processing clues...\n\nGuess: apple';

            const thinkingMatch = aiContent.match(/Thinking: (.+?)(?=\n\nGuess:|$)/s);
            const guessMatch = aiContent.match(/Guess: (.+?)$/);

            const thinking = thinkingMatch ? thinkingMatch[1].trim() : '';
            const guess = guessMatch ? guessMatch[1].trim() : '';

            expect(thinking).toBe('Analyzing conversation... Processing clues...');
            expect(guess).toBe('apple');
        });

        it('should handle AI content with only thinking', () => {
            const aiContent = 'Thinking: Just thinking...';

            const thinkingMatch = aiContent.match(/Thinking: (.+?)(?=\n\nGuess:|$)/s);
            const guessMatch = aiContent.match(/Guess: (.+?)$/);

            const thinking = thinkingMatch ? thinkingMatch[1].trim() : '';
            const guess = guessMatch ? guessMatch[1].trim() : '';

            expect(thinking).toBe('Just thinking...');
            expect(guess).toBe('');
        });

        it('should handle AI content with only guess', () => {
            const aiContent = 'Guess: only guess';

            const thinkingMatch = aiContent.match(/Thinking: (.+?)(?=\n\nGuess:|$)/s);
            const guessMatch = aiContent.match(/Guess: (.+?)$/);

            const thinking = thinkingMatch ? thinkingMatch[1].trim() : '';
            const guess = guessMatch ? guessMatch[1].trim() : '';

            expect(thinking).toBe('');
            expect(guess).toBe('only guess');
        });

        it('should handle malformed AI content', () => {
            const aiContent = 'Random content without proper format';

            const thinkingMatch = aiContent.match(/Thinking: (.+?)(?=\n\nGuess:|$)/s);
            const guessMatch = aiContent.match(/Guess: (.+?)$/);

            const thinking = thinkingMatch ? thinkingMatch[1].trim() : '';
            const guess = guessMatch ? guessMatch[1].trim() : '';

            expect(thinking).toBe('');
            expect(guess).toBe('');
        });
    });

    describe('Conversation State Management', () => {
        it('should maintain conversation history with AI messages for backend processing', () => {
            const fullConversation: Turn[] = [
                createMockTurn('encoder', 'Message 1', 'player1'),
                createMockTurn('ai', 'Thinking: Test...\n\nGuess: test'),
                createMockTurn('decoder', 'Guess 1', 'player2')
            ];

            // Full conversation should include AI messages (for backend)
            expect(fullConversation).toHaveLength(3);
            expect(fullConversation.some(turn => turn.type === 'ai')).toBe(true);

            // Display conversation should exclude AI messages
            const displayConversation = fullConversation.filter(turn => turn.type !== 'ai');
            expect(displayConversation).toHaveLength(2);
            expect(displayConversation.some(turn => turn.type === 'ai')).toBe(false);
        });

        it('should preserve all message metadata when filtering', () => {
            const conversation: Turn[] = [
                createMockTurn('encoder', 'Test message', 'player1'),
                createMockTurn('ai', 'AI response'),
                createMockTurn('decoder', 'Test guess', 'player2')
            ];

            const displayConversation = conversation.filter(turn => turn.type !== 'ai');

            // Verify metadata is preserved
            expect(displayConversation[0]?.id).toBeDefined();
            expect(displayConversation[0]?.timestamp).toBeDefined();
            expect(displayConversation[0]?.playerId).toBe('player1');
            expect(displayConversation[1]?.playerId).toBe('player2');
        });
    });
}); 