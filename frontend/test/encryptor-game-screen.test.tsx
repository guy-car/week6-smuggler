import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native/Libraries/Alert/Alert';
import EncryptorGameScreen from '../app/encryptor-game';
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
    currentTurn: 'encryptor',
    playerRole: 'encryptor',
    gameStatus: 'active',
    round: 1,
    maxRounds: 5,
    score: 0,
    secretWord: 'apple',
    player: { id: 'player1', name: 'Player 1', ready: true, role: 'encryptor', socketId: 'socket1' },
    roomId: 'room1',
    showSecretModal: false,
    showGuessesModal: false,
    showQuitConfirm: false,
    setShowSecretModal: jest.fn(),
    setShowGuessesModal: jest.fn(),
    setShowQuitConfirm: jest.fn(),
};

jest.mock('../store/gameStore', () => ({
    useGameStore: jest.fn(),
}));

describe('EncryptorGameScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = mockGameStore;
            return selector ? selector(state) : state;
        });
    });

    it('renders correctly with encryptor interface', () => {
        render(<EncryptorGameScreen />);

        expect(screen.getByText('Encryptor Game')).toBeTruthy();
        expect(screen.getByText('Secret Word')).toBeTruthy();
        expect(screen.getByText('Previous Guesses')).toBeTruthy();
        expect(screen.getByText('AI Thinking')).toBeTruthy();
        expect(screen.getByText('Conversation History')).toBeTruthy();
    });

    it('allows sending messages when it is encryptor turn', async () => {
        const mockSendMessage = websocket.sendMessage as jest.Mock;
        mockSendMessage.mockResolvedValue(undefined);

        render(<EncryptorGameScreen />);

        const messageInput = screen.getByPlaceholderText('Give a hint to help the decryptor guess the word...');
        const sendButton = screen.getByText('Send');

        fireEvent.changeText(messageInput, 'This is a red fruit');
        fireEvent.press(sendButton);

        await waitFor(() => {
            expect(mockSendMessage).toHaveBeenCalledWith('This is a red fruit');
        });
    });

    it('disables input when not encryptor turn', () => {
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, currentTurn: 'decryptor' };
            return selector ? selector(state) : state;
        });

        render(<EncryptorGameScreen />);

        const messageInput = screen.getByPlaceholderText('Waiting for your turn...');
        expect(messageInput.props.editable).toBe(false);
    });

    it('shows secret word modal when Secret Word button is pressed', () => {
        const mockSetShowSecretModal = jest.fn();
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, setShowSecretModal: mockSetShowSecretModal };
            return selector ? selector(state) : state;
        });

        render(<EncryptorGameScreen />);

        const secretButton = screen.getByText('Secret Word');
        fireEvent.press(secretButton);

        expect(mockSetShowSecretModal).toHaveBeenCalledWith(true);
    });

    it('shows guesses modal when Previous Guesses button is pressed', () => {
        const mockSetShowGuessesModal = jest.fn();
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, setShowGuessesModal: mockSetShowGuessesModal };
            return selector ? selector(state) : state;
        });

        render(<EncryptorGameScreen />);

        const guessesButton = screen.getByText('Previous Guesses');
        fireEvent.press(guessesButton);

        expect(mockSetShowGuessesModal).toHaveBeenCalledWith(true);
    });

    it('shows quit confirmation when Quit button is pressed', () => {
        const mockAlert = Alert.alert as jest.Mock;

        render(<EncryptorGameScreen />);

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
                content: 'This is a hint',
                timestamp: '2023-01-01T12:00:00Z',
                playerId: 'player1',
            },
            {
                id: '2',
                type: 'ai',
                content: 'AI is thinking',
                timestamp: '2023-01-01T12:01:00Z',
            },
        ];

        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, conversationHistory: mockConversation };
            return selector ? selector(state) : state;
        });

        render(<EncryptorGameScreen />);

        expect(screen.getByText('This is a hint')).toBeTruthy();
        expect(screen.getByText('AI is thinking')).toBeTruthy();
    });

    it('shows AI thinking status when it is AI turn', () => {
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, currentTurn: 'ai' };
            return selector ? selector(state) : state;
        });

        render(<EncryptorGameScreen />);

        expect(screen.getByText('AI is analyzing the conversation...')).toBeTruthy();
    });

    it('handles message sending errors', async () => {
        const mockSendMessage = websocket.sendMessage as jest.Mock;
        mockSendMessage.mockRejectedValue(new Error('Network error'));

        render(<EncryptorGameScreen />);

        const messageInput = screen.getByPlaceholderText('Give a hint to help the decryptor guess the word...');
        const sendButton = screen.getByText('Send');

        fireEvent.changeText(messageInput, 'Test message');
        fireEvent.press(sendButton);

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Network error');
        });
    });

    it('prevents sending empty messages', () => {
        const mockSendMessage = websocket.sendMessage as jest.Mock;

        render(<EncryptorGameScreen />);

        const sendButton = screen.getByText('Send');
        fireEvent.press(sendButton);

        expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('displays score progress bar correctly', () => {
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, score: 2 };
            return selector ? selector(state) : state;
        });

        render(<EncryptorGameScreen />);

        expect(screen.getByText('AI Wins')).toBeTruthy();
        expect(screen.getByText('Humans Win')).toBeTruthy();
        expect(screen.getByText('Current Score:')).toBeTruthy();
        expect(screen.getByText('2')).toBeTruthy();
    });

    it('displays game status indicator correctly', () => {
        render(<EncryptorGameScreen />);

        expect(screen.getByText('Your turn - give a hint!')).toBeTruthy();
        expect(screen.getByText('Round 1/5')).toBeTruthy();
    });
}); 