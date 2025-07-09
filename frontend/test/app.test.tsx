import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import App from '../app';
import * as websocket from '../services/websocket';
import { useGameStore } from '../store/gameStore';

// Mock dependencies
// WebSocket service is already mocked in setup.ts

// Mock the game store
const mockGameStore = {
    currentScreen: 'lobby',
    connected: true,
    isLoading: false,
    error: null,
    setIsLoading: jest.fn(),
    setError: jest.fn(),
    // Add required properties for different screens
    players: [],
    conversationHistory: [],
    player: null,
    roomId: null,
    gameStatus: 'waiting',
    currentTurn: null,
    playerRole: null,
    round: 1,
    maxRounds: 5,
    score: 0,
    secretWord: null,
    availableRooms: [],
    isReady: false,
    showGuessesModal: false,
    showCluesModal: false,
    showSecretModal: false,
    showQuitConfirm: false,
};

jest.mock('../store/gameStore', () => ({
    useGameStore: jest.fn(),
}));

describe('App', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = mockGameStore;
            return selector ? selector(state) : state;
        });
    });

    it('renders loading screen when connecting', () => {
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, isLoading: true };
            return selector ? selector(state) : state;
        });

        render(<App />);

        expect(screen.getByText('Connecting to server...')).toBeTruthy();
    });

    it('renders error screen when connection fails', () => {
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = {
                ...mockGameStore,
                error: 'Connection failed',
                connected: false
            };
            return selector ? selector(state) : state;
        });

        render(<App />);

        expect(screen.getByText('Connection Error')).toBeTruthy();
        expect(screen.getByText('Connection failed')).toBeTruthy();
        expect(screen.getByText('Please check your internet connection and try again.')).toBeTruthy();
    });

    it('renders lobby screen by default', () => {
        render(<App />);

        // The lobby screen should be rendered
        expect(screen.getByText('Lobby')).toBeTruthy();
    });

    it('renders room screen when currentScreen is room', () => {
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, currentScreen: 'room' };
            return selector ? selector(state) : state;
        });

        render(<App />);

        // The room screen should be rendered
        expect(screen.getByText('Room:')).toBeTruthy();
    });

    it('renders encryptor game screen when currentScreen is encryptor-game', () => {
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, currentScreen: 'encryptor-game' };
            return selector ? selector(state) : state;
        });

        render(<App />);

        // The encryptor game screen should be rendered
        expect(screen.getByText('Encryptor Game')).toBeTruthy();
    });

    it('renders decryptor game screen when currentScreen is decryptor-game', () => {
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, currentScreen: 'decryptor-game' };
            return selector ? selector(state) : state;
        });

        render(<App />);

        // The decryptor game screen should be rendered
        expect(screen.getByText('Decryptor Game')).toBeTruthy();
    });

    it('renders game end screen when currentScreen is game-end', () => {
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, currentScreen: 'game-end' };
            return selector ? selector(state) : state;
        });

        render(<App />);

        // The game end screen should be rendered
        expect(screen.getByText('Game Over')).toBeTruthy();
    });

    it('initializes WebSocket connection on mount', async () => {
        const mockGetSocket = websocket.getSocket as jest.Mock;
        const mockSetIsLoading = jest.fn();
        const mockSetError = jest.fn();

        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = {
                ...mockGameStore,
                setIsLoading: mockSetIsLoading,
                setError: mockSetError,
            };
            return selector ? selector(state) : state;
        });

        render(<App />);

        await waitFor(() => {
            expect(mockSetIsLoading).toHaveBeenCalledWith(true);
            expect(mockGetSocket).toHaveBeenCalled();
        });
    });

    it('handles WebSocket connection errors', async () => {
        const mockGetSocket = websocket.getSocket as jest.Mock;
        const mockSetIsLoading = jest.fn();
        const mockSetError = jest.fn();

        mockGetSocket.mockImplementation(() => {
            throw new Error('Connection failed');
        });

        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = {
                ...mockGameStore,
                setIsLoading: mockSetIsLoading,
                setError: mockSetError,
            };
            return selector ? selector(state) : state;
        });

        render(<App />);

        await waitFor(() => {
            expect(mockSetError).toHaveBeenCalledWith('Connection failed');
            expect(mockSetIsLoading).toHaveBeenCalledWith(false);
        });
    });

    it('falls back to lobby screen for unknown currentScreen', () => {
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, currentScreen: 'unknown' as any };
            return selector ? selector(state) : state;
        });

        render(<App />);

        // Should fall back to lobby screen
        expect(screen.getByText('Lobby')).toBeTruthy();
    });

    it('does not show error screen when connected successfully', () => {
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = {
                ...mockGameStore,
                error: 'Some error',
                connected: true
            };
            return selector ? selector(state) : state;
        });

        render(<App />);

        // Should not show error screen when connected
        expect(screen.queryByText('Connection Error')).toBeNull();
        expect(screen.getByText('Lobby')).toBeTruthy();
    });
}); 