import { render, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import RoomScreen from '../app/room';
import { useGameStore } from '../store/gameStore';

// Mock expo-router
jest.mock('expo-router', () => ({
    useRouter: jest.fn(),
}));

// Mock the WebSocket service
jest.mock('../services/websocket', () => ({
    leaveRoom: jest.fn(),
    setPlayerReady: jest.fn(),
    startGame: jest.fn(),
}));

describe('RoomScreen', () => {
    const mockRouter = {
        replace: jest.fn(),
    };

    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        // Reset store before each test
        useGameStore.getState().reset();
    });

    it('renders room title with room ID', () => {
        useGameStore.getState().setRoomId('room-123');

        render(<RoomScreen />);

        expect(screen.getByText('Room: room-123')).toBeTruthy();
    });

    it('renders leave room button', () => {
        render(<RoomScreen />);

        expect(screen.getByText('Leave Room')).toBeTruthy();
    });

    it('renders game status section', () => {
        render(<RoomScreen />);

        expect(screen.getByText('Game Status')).toBeTruthy();
        expect(screen.getByText('Waiting for players...')).toBeTruthy();
        expect(screen.getByText('0/2 players')).toBeTruthy();
    });

    it('renders players section', () => {
        render(<RoomScreen />);

        expect(screen.getByText('Players')).toBeTruthy();
    });

    it('renders empty state when no players', () => {
        render(<RoomScreen />);

        expect(screen.getByText('No players in room.')).toBeTruthy();
    });

    it('renders players list', () => {
        const players = [
            {
                id: 'player-1',
                name: 'Player 1',
                ready: true,
                role: 'encryptor' as const,
                socketId: 'socket-1'
            },
            {
                id: 'player-2',
                name: 'Player 2',
                ready: false,
                role: 'decryptor' as const,
                socketId: 'socket-2'
            }
        ];

        useGameStore.getState().setPlayers(players);
        useGameStore.getState().setPlayer(players[0]);

        render(<RoomScreen />);

        expect(screen.getByText('Player 1 (You)')).toBeTruthy();
        expect(screen.getByText('Player 2')).toBeTruthy();
        expect(screen.getByText('Encryptor')).toBeTruthy();
        expect(screen.getByText('Decryptor')).toBeTruthy();
        expect(screen.getAllByText('Ready').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Not Ready').length).toBeGreaterThan(0);
    });

    it('renders ready/unready button', () => {
        render(<RoomScreen />);

        expect(screen.getByText('Ready')).toBeTruthy();
    });

    it('shows unready when player is ready', () => {
        useGameStore.getState().setIsReady(true);

        render(<RoomScreen />);

        expect(screen.getByText('Unready')).toBeTruthy();
    });

    it('shows start game button when all players are ready', () => {
        const players = [
            {
                id: 'player-1',
                name: 'Player 1',
                ready: true,
                role: 'encryptor' as const,
                socketId: 'socket-1'
            },
            {
                id: 'player-2',
                name: 'Player 2',
                ready: true,
                role: 'decryptor' as const,
                socketId: 'socket-2'
            }
        ];

        useGameStore.getState().setPlayers(players);
        useGameStore.getState().setPlayer(players[0]);
        useGameStore.getState().setIsReady(true);

        render(<RoomScreen />);

        expect(screen.getByText('Start Game')).toBeTruthy();
    });

    it('does not show start game button when not all players are ready', () => {
        const players = [
            {
                id: 'player-1',
                name: 'Player 1',
                ready: true,
                role: 'encryptor' as const,
                socketId: 'socket-1'
            },
            {
                id: 'player-2',
                name: 'Player 2',
                ready: false,
                role: 'decryptor' as const,
                socketId: 'socket-2'
            }
        ];

        useGameStore.getState().setPlayers(players);
        useGameStore.getState().setPlayer(players[0]);
        useGameStore.getState().setIsReady(true);

        render(<RoomScreen />);

        expect(screen.queryByText('Start Game')).toBeFalsy();
    });

    it('does not show start game button when current player is not ready', () => {
        const players = [
            {
                id: 'player-1',
                name: 'Player 1',
                ready: true,
                role: 'encryptor' as const,
                socketId: 'socket-1'
            },
            {
                id: 'player-2',
                name: 'Player 2',
                ready: true,
                role: 'decryptor' as const,
                socketId: 'socket-2'
            }
        ];

        useGameStore.getState().setPlayers(players);
        useGameStore.getState().setPlayer(players[0]);
        useGameStore.getState().setIsReady(false);

        render(<RoomScreen />);

        expect(screen.queryAllByText('Start Game').length).toBe(0);
    });

    it('shows ready to start status when all players are ready', () => {
        const players = [
            {
                id: 'player-1',
                name: 'Player 1',
                ready: true,
                role: 'encryptor' as const,
                socketId: 'socket-1'
            },
            {
                id: 'player-2',
                name: 'Player 2',
                ready: true,
                role: 'decryptor' as const,
                socketId: 'socket-2'
            }
        ];

        useGameStore.getState().setPlayers(players);

        render(<RoomScreen />);

        expect(screen.getByText('Ready to start!')).toBeTruthy();
        expect(screen.getByText('2/2 players')).toBeTruthy();
    });

    it('handles player with unknown role', () => {
        const players = [
            {
                id: 'player-1',
                name: 'Player 1',
                ready: true,
                role: null,
                socketId: 'socket-1'
            }
        ];

        useGameStore.getState().setPlayers(players);

        render(<RoomScreen />);

        expect(screen.getByText('Unknown')).toBeTruthy();
    });
}); 