import { render } from '@testing-library/react-native';
import React from 'react';
import AISectionComponent from '../app/components/AISectionComponent';
import { Turn } from '../store/gameStore';

// Mock the game store
jest.mock('../store/gameStore', () => ({
    useGameStore: jest.fn(),
}));

// Mock the AIDisplayComponent to test what props it receives
jest.mock('../app/components/AIDisplayComponent', () => {
    return jest.fn(({ isThinking, thinkingText, guess }) => {
        if (isThinking) {
            return { type: 'thinking', text: thinkingText };
        } else if (guess) {
            return { type: 'guess', text: guess };
        }
        return null;
    });
});

// Mock ConversationHistory
jest.mock('../app/components/ConversationHistory', () => {
    return jest.fn(() => null);
});

describe('AISectionComponent Logic', () => {
    const mockUseGameStore = require('../store/gameStore').useGameStore;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseGameStore.mockReturnValue(120); // remainingTime
    });

    describe('AI Display States', () => {
        it('should not show AI component when no messages have been sent', () => {
            const conversationHistory: Turn[] = [];
            const currentTurn = 'encoder';

            render(
                <AISectionComponent
                    currentTurn={currentTurn}
                    conversationHistory={conversationHistory}
                />
            );

            const AIDisplayComponent = require('../app/components/AIDisplayComponent');
            expect(AIDisplayComponent).not.toHaveBeenCalled();
        });

        it('should show AI thinking when message sent and AI turn active', () => {
            const conversationHistory: Turn[] = [
                {
                    id: '1',
                    type: 'encoder',
                    content: 'Hello',
                    timestamp: new Date().toISOString(),
                    playerId: 'player1'
                }
            ];
            const currentTurn = 'ai';

            render(
                <AISectionComponent
                    currentTurn={currentTurn}
                    conversationHistory={conversationHistory}
                />
            );

            const AIDisplayComponent = require('../app/components/AIDisplayComponent');
            expect(AIDisplayComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    isThinking: true,
                    thinkingText: 'AI is analyzing the conversation',
                    guess: undefined
                }),
                expect.anything()
            );
        });

        it('should show AI guess when AI turn has completed', () => {
            const conversationHistory: Turn[] = [
                {
                    id: '1',
                    type: 'encoder',
                    content: 'Hello',
                    timestamp: new Date().toISOString(),
                    playerId: 'player1'
                },
                {
                    id: '2',
                    type: 'ai',
                    content: 'Thinking: Analyzing the message\n\nGuess: apple',
                    timestamp: new Date().toISOString()
                }
            ];
            const currentTurn = 'decoder';

            render(
                <AISectionComponent
                    currentTurn={currentTurn}
                    conversationHistory={conversationHistory}
                />
            );

            const AIDisplayComponent = require('../app/components/AIDisplayComponent');
            expect(AIDisplayComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    isThinking: false,
                    thinkingText: 'AI is analyzing the conversation',
                    guess: 'apple'
                }),
                expect.anything()
            );
        });

        it('should not show AI thinking when not AI turn', () => {
            const conversationHistory: Turn[] = [
                {
                    id: '1',
                    type: 'encoder',
                    content: 'Hello',
                    timestamp: new Date().toISOString(),
                    playerId: 'player1'
                }
            ];
            const currentTurn = 'decoder';

            render(
                <AISectionComponent
                    currentTurn={currentTurn}
                    conversationHistory={conversationHistory}
                />
            );

            const AIDisplayComponent = require('../app/components/AIDisplayComponent');
            expect(AIDisplayComponent).not.toHaveBeenCalled();
        });

        it('should show thinking when new message sent after previous AI guess', () => {
            const oldTimestamp = new Date('2024-01-01T10:00:00Z').toISOString();
            const newTimestamp = new Date('2024-01-01T10:01:00Z').toISOString();

            const conversationHistory: Turn[] = [
                {
                    id: '1',
                    type: 'encoder',
                    content: 'Hello',
                    timestamp: oldTimestamp,
                    playerId: 'player1'
                },
                {
                    id: '2',
                    type: 'ai',
                    content: 'Thinking: Analyzing the message\n\nGuess: apple',
                    timestamp: oldTimestamp
                },
                {
                    id: '3',
                    type: 'decoder',
                    content: 'New message',
                    timestamp: newTimestamp,
                    playerId: 'player2'
                }
            ];
            const currentTurn = 'ai'; // AI turn is active after new message

            render(
                <AISectionComponent
                    currentTurn={currentTurn}
                    conversationHistory={conversationHistory}
                />
            );

            const AIDisplayComponent = require('../app/components/AIDisplayComponent');
            expect(AIDisplayComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    isThinking: true, // Should show thinking for new round
                    thinkingText: 'AI is analyzing the conversation',
                    guess: undefined // Should not show old guess
                }),
                expect.anything()
            );
        });
    });
}); 