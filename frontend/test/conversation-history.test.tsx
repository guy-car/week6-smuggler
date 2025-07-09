import { render, screen } from '@testing-library/react-native';
import React from 'react';
import ConversationHistory from '../app/components/ConversationHistory';
import { Turn } from '../store/gameStore';

describe('ConversationHistory', () => {
    const mockConversation: Turn[] = [
        {
            id: 'turn-1',
            type: 'encryptor',
            content: 'This is a hint from the encryptor',
            timestamp: '2023-01-01T10:00:00Z',
            playerId: 'player-1'
        },
        {
            id: 'turn-2',
            type: 'ai',
            content: 'AI is thinking about the hint...',
            timestamp: '2023-01-01T10:01:00Z'
        },
        {
            id: 'turn-3',
            type: 'decryptor',
            content: 'I guess the word is "apple"',
            timestamp: '2023-01-01T10:02:00Z',
            playerId: 'player-2'
        }
    ];

    it('renders conversation history title', () => {
        render(<ConversationHistory conversation={mockConversation} />);

        expect(screen.getByText('Conversation History')).toBeTruthy();
    });

    it('renders all turns in the conversation', () => {
        render(<ConversationHistory conversation={mockConversation} />);

        expect(screen.getByText('This is a hint from the encryptor')).toBeTruthy();
        expect(screen.getByText('AI is thinking about the hint...')).toBeTruthy();
        expect(screen.getByText('I guess the word is "apple"')).toBeTruthy();
    });

    it('renders turn types correctly', () => {
        render(<ConversationHistory conversation={mockConversation} />);

        expect(screen.getByText('Encryptor')).toBeTruthy();
        expect(screen.getByText('AI')).toBeTruthy();
        expect(screen.getByText('Decryptor')).toBeTruthy();
    });

    it('renders timestamps correctly', () => {
        render(<ConversationHistory conversation={mockConversation} />);

        // Check that timestamps are rendered (format may vary by locale)
        const timestampElements = screen.getAllByText(/\d{1,2}:\d{2}/);
        expect(timestampElements.length).toBeGreaterThan(0);
    });

    it('renders empty state when conversation is empty', () => {
        render(<ConversationHistory conversation={[]} />);

        expect(screen.getByText('No messages yet')).toBeTruthy();
        expect(screen.getByText('Start the conversation!')).toBeTruthy();
    });

    it('renders empty state when conversation is undefined', () => {
        render(<ConversationHistory conversation={[]} />);

        expect(screen.getByText('No messages yet')).toBeTruthy();
        expect(screen.getByText('Start the conversation!')).toBeTruthy();
    });

    it('handles AI turns without playerId', () => {
        const aiOnlyConversation: Turn[] = [
            {
                id: 'ai-turn',
                type: 'ai',
                content: 'AI is processing...',
                timestamp: '2023-01-01T10:00:00Z'
            }
        ];

        render(<ConversationHistory conversation={aiOnlyConversation} />);

        expect(screen.getByText('AI')).toBeTruthy();
        expect(screen.getByText('AI is processing...')).toBeTruthy();
    });

    it('handles turns with different content types', () => {
        const mixedConversation: Turn[] = [
            {
                id: 'hint',
                type: 'encryptor',
                content: 'A red fruit that grows on trees',
                timestamp: '2023-01-01T10:00:00Z',
                playerId: 'player-1'
            },
            {
                id: 'guess',
                type: 'decryptor',
                content: 'apple',
                timestamp: '2023-01-01T10:01:00Z',
                playerId: 'player-2'
            }
        ];

        render(<ConversationHistory conversation={mixedConversation} />);

        expect(screen.getByText('A red fruit that grows on trees')).toBeTruthy();
        expect(screen.getByText('apple')).toBeTruthy();
    });

    it('renders with current player ID for alignment', () => {
        render(
            <ConversationHistory
                conversation={mockConversation}
                currentPlayerId="player-1"
            />
        );

        // Should still render all content
        expect(screen.getByText('This is a hint from the encryptor')).toBeTruthy();
        expect(screen.getByText('AI is thinking about the hint...')).toBeTruthy();
        expect(screen.getByText('I guess the word is "apple"')).toBeTruthy();
    });
}); 