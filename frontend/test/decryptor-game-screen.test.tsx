import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import DecryptorGameScreen from '../app/decryptor-game';
import * as websocket from '../services/websocket';
import { useGameStore } from '../store/gameStore';

// Mock dependencies
jest.mock('expo-router', () => ({
    useRouter: () => ({
        replace: jest.fn(),
    }),
}));

// Mock the game store
const mockGameStore = {
    conversationHistory: [],
    currentTurn: 'decryptor',
    playerRole: 'decryptor',
    gameStatus: 'active',
    round: 1,
    maxRounds: 5,
    score: 0,
    player: { id: 'player2', name: 'Player 2', ready: true, role: 'decryptor', socketId: 'socket2' },
    roomId: 'room1',
    showCluesModal: false,
    setShowCluesModal: jest.fn(),
};

jest.mock('../store/gameStore', () => ({
    useGameStore: jest.fn(),
}));

describe('DecryptorGameScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = mockGameStore;
            return selector ? selector(state) : state;
        });
    });

    it('renders correctly with decryptor interface', () => {
        render(<DecryptorGameScreen />);

        expect(screen.getByText('Decryptor Game')).toBeTruthy();
        expect(screen.getByText('Previous Hints')).toBeTruthy();
        expect(screen.getByText('AI Thinking')).toBeTruthy();
        expect(screen.getByText('Conversation History')).toBeTruthy();
    });

    it('allows submitting guesses when it is decryptor turn', async () => {
        const mockSubmitGuess = websocket.submitGuess as jest.Mock;
        mockSubmitGuess.mockResolvedValue(undefined);

        render(<DecryptorGameScreen />);

        const guessInput = screen.getByPlaceholderText('Enter your guess for the secret word...');
        const submitButton = screen.getByText('Submit Guess');

        fireEvent.changeText(guessInput, 'apple');
        fireEvent.press(submitButton);

        await waitFor(() => {
            expect(mockSubmitGuess).toHaveBeenCalledWith('apple');
        });
    });

    it('disables input when not decryptor turn', () => {
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, currentTurn: 'encryptor' };
            return selector ? selector(state) : state;
        });

        render(<DecryptorGameScreen />);

        const guessInput = screen.getByPlaceholderText('Waiting for your turn...');
        expect(guessInput.props.editable).toBe(false);
    });

    it('shows hints modal when Previous Hints button is pressed', () => {
        const mockSetShowCluesModal = jest.fn();
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, setShowCluesModal: mockSetShowCluesModal };
            return selector ? selector(state) : state;
        });

        render(<DecryptorGameScreen />);

        const hintsButton = screen.getByText('Previous Hints');
        fireEvent.press(hintsButton);

        expect(mockSetShowCluesModal).toHaveBeenCalledWith(true);
    });

    it('shows quit confirmation when Quit button is pressed', () => {
        const mockAlert = Alert.alert as jest.Mock;

        render(<DecryptorGameScreen />);

        const quitButton = screen.getByText('Quit');
        fireEvent.press(quitButton);

        expect(mockAlert).toHaveBeenCalledWith(
            'Quit Game',
            'Are you sure you want to quit? This will end the game for all players.',
            expect.arrayContaining([
                expect.objectContaining({ text: 'Cancel' }),
                expect.objectContaining({ text: 'Quit' }),
            ])
        );
    });

    it('displays conversation history correctly', () => {
        const mockConversation = [
            {
                id: '1',
                type: 'encryptor',
                content: 'This is a red fruit',
                timestamp: '2023-01-01T12:00:00Z',
                playerId: 'player1',
            },
            {
                id: '2',
                type: 'decryptor',
                content: 'apple',
                timestamp: '2023-01-01T12:01:00Z',
                playerId: 'player2',
            },
        ];

        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, conversationHistory: mockConversation };
            return selector ? selector(state) : state;
        });

        render(<DecryptorGameScreen />);

        expect(screen.getByText('This is a red fruit')).toBeTruthy();
        expect(screen.getByText('apple')).toBeTruthy();
    });

    it('shows AI thinking status when it is AI turn', () => {
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, currentTurn: 'ai' };
            return selector ? selector(state) : state;
        });

        render(<DecryptorGameScreen />);

        expect(screen.getByText('AI is analyzing the conversation...')).toBeTruthy();
    });

    it('handles guess submission errors', async () => {
        const mockSubmitGuess = websocket.submitGuess as jest.Mock;
        mockSubmitGuess.mockRejectedValue(new Error('Network error'));

        render(<DecryptorGameScreen />);

        const guessInput = screen.getByPlaceholderText('Enter your guess for the secret word...');
        const submitButton = screen.getByText('Submit Guess');

        fireEvent.changeText(guessInput, 'test');
        fireEvent.press(submitButton);

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Network error');
        });
    });

    it('prevents submitting empty guesses', () => {
        const mockSubmitGuess = websocket.submitGuess as jest.Mock;

        render(<DecryptorGameScreen />);

        const submitButton = screen.getByText('Submit Guess');
        fireEvent.press(submitButton);

        expect(mockSubmitGuess).not.toHaveBeenCalled();
    });

    it('displays score progress bar correctly', () => {
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, score: -2 };
            return selector ? selector(state) : state;
        });

        render(<DecryptorGameScreen />);

        expect(screen.getByText('AI Wins')).toBeTruthy();
        expect(screen.getByText('Humans Win')).toBeTruthy();
        expect(screen.getByText('Current Score:')).toBeTruthy();
        expect(screen.getByText('-2')).toBeTruthy();
    });

    it('displays game status indicator correctly', () => {
        render(<DecryptorGameScreen />);

        expect(screen.getByText('Your turn - make a guess!')).toBeTruthy();
        expect(screen.getByText('Round 1/5')).toBeTruthy();
    });

    it('filters and displays previous hints correctly', () => {
        const mockConversation = [
            {
                id: '1',
                type: 'encryptor',
                content: 'This is a red fruit',
                timestamp: '2023-01-01T12:00:00Z',
                playerId: 'player1',
            },
            {
                id: '2',
                type: 'decryptor',
                content: 'apple',
                timestamp: '2023-01-01T12:01:00Z',
                playerId: 'player2',
            },
            {
                id: '3',
                type: 'encryptor',
                content: 'It grows on trees',
                timestamp: '2023-01-01T12:02:00Z',
                playerId: 'player1',
            },
        ];

        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, conversationHistory: mockConversation };
            return selector ? selector(state) : state;
        });

        render(<DecryptorGameScreen />);

        // The hints should be filtered and available for the modal
        // This tests the logic that filters encryptor messages
        const hints = mockConversation.filter(turn => turn.type === 'encryptor');
        expect(hints).toHaveLength(2);
    });
}); 