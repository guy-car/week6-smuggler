import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import GameEndScreen from '../app/game-end';
import { useGameStore } from '../store/gameStore';

// Mock dependencies
jest.mock('expo-router', () => ({
    useRouter: () => ({
        replace: jest.fn(),
    }),
}));

// Mock the game store
const mockGameStore = {
    score: 3,
    round: 3,
    maxRounds: 5,
    secretWord: 'apple',
    playerRole: 'encryptor',
    reset: jest.fn(),
};

jest.mock('../store/gameStore', () => ({
    useGameStore: jest.fn(),
}));

describe('GameEndScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = mockGameStore;
            return selector ? selector(state) : state;
        });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('renders correctly with game over title', () => {
        render(<GameEndScreen />);

        expect(screen.getByText('Game Over')).toBeTruthy();
    });

    it('displays humans win when score is positive', () => {
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, score: 3 };
            return selector ? selector(state) : state;
        });

        render(<GameEndScreen />);

        expect(screen.getByText('Humans Win! 🎉')).toBeTruthy();
    });

    it('displays AI win when score is negative', () => {
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, score: -2 };
            return selector ? selector(state) : state;
        });

        render(<GameEndScreen />);

        expect(screen.getByText('AI Wins! 🤖')).toBeTruthy();
    });

    it('displays tie when score is zero', () => {
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, score: 0 };
            return selector ? selector(state) : state;
        });

        render(<GameEndScreen />);

        expect(screen.getByText("It's a Tie! 🤝")).toBeTruthy();
    });

    it('displays game statistics correctly', () => {
        render(<GameEndScreen />);

        expect(screen.getByText('Final Score')).toBeTruthy();
        expect(screen.getByText('+3')).toBeTruthy();
        expect(screen.getByText('Rounds Played')).toBeTruthy();
        expect(screen.getByText('3/5')).toBeTruthy();
        expect(screen.getByText('Your Role')).toBeTruthy();
        expect(screen.getByText('Encryptor')).toBeTruthy();
        expect(screen.getByText('Secret Word')).toBeTruthy();
        expect(screen.getByText('apple')).toBeTruthy();
    });

    it('displays decryptor role correctly', () => {
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, playerRole: 'decryptor' };
            return selector ? selector(state) : state;
        });

        render(<GameEndScreen />);

        expect(screen.getByText('Decryptor')).toBeTruthy();
    });

    it('shows countdown timer', () => {
        render(<GameEndScreen />);

        expect(screen.getByText('Returning to lobby in 5 seconds...')).toBeTruthy();
    });

    it('counts down timer correctly', async () => {
        render(<GameEndScreen />);

        expect(screen.getByText('Returning to lobby in 5 seconds...')).toBeTruthy();

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        await waitFor(() => {
            expect(screen.getByText('Returning to lobby in 4 seconds...')).toBeTruthy();
        });

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        await waitFor(() => {
            expect(screen.getByText('Returning to lobby in 3 seconds...')).toBeTruthy();
        });
    });

    it('automatically navigates to lobby after countdown', async () => {
        const mockReset = jest.fn();
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, reset: mockReset };
            return selector ? selector(state) : state;
        });

        render(<GameEndScreen />);

        act(() => {
            jest.advanceTimersByTime(5000);
        });

        await waitFor(() => {
            expect(mockReset).toHaveBeenCalled();
        });
    });

    it('allows manual navigation to lobby', () => {
        const mockReset = jest.fn();
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, reset: mockReset };
            return selector ? selector(state) : state;
        });

        render(<GameEndScreen />);

        const returnButton = screen.getByText('Return to Lobby Now');
        fireEvent.press(returnButton);

        expect(mockReset).toHaveBeenCalled();
    });

    it('handles negative score display correctly', () => {
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, score: -2 };
            return selector ? selector(state) : state;
        });

        render(<GameEndScreen />);

        expect(screen.getByText('-2')).toBeTruthy();
    });

    it('handles zero score display correctly', () => {
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, score: 0 };
            return selector ? selector(state) : state;
        });

        render(<GameEndScreen />);

        expect(screen.getByText('0')).toBeTruthy();
    });

    it('displays correct result color for humans win', () => {
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, score: 3 };
            return selector ? selector(state) : state;
        });

        render(<GameEndScreen />);

        const resultText = screen.getByText('Humans Win! 🎉');
        expect(resultText.props.style).toContainEqual({ color: '#34C759' });
    });

    it('displays correct result color for AI win', () => {
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, score: -2 };
            return selector ? selector(state) : state;
        });

        render(<GameEndScreen />);

        const resultText = screen.getByText('AI Wins! 🤖');
        expect(resultText.props.style).toContainEqual({ color: '#FF3B30' });
    });

    it('displays correct result color for tie', () => {
        (useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
            const state = { ...mockGameStore, score: 0 };
            return selector ? selector(state) : state;
        });

        render(<GameEndScreen />);

        const resultText = screen.getByText("It's a Tie! 🤝");
        expect(resultText.props.style).toContainEqual({ color: '#FF9500' });
    });
}); 