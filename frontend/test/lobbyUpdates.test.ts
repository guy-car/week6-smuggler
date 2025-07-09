import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import LobbyScreen from '../app/lobby';
import { getSocket } from '../services/websocket';

// Mock the websocket service
jest.mock('../services/websocket', () => ({
    getSocket: jest.fn(),
    createRoom: jest.fn(),
    getAvailableRooms: jest.fn(),
    joinRoom: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
}));

// Mock the game store
jest.mock('../store/gameStore', () => ({
    useGameStore: jest.fn((selector: any) => {
        const state = {
            availableRooms: [],
            connected: true,
        };
        return selector(state);
    }),
}));

describe('LobbyScreen', () => {
    let mockSocket: any;

    beforeEach(() => {
        mockSocket = {
            emit: jest.fn(),
            on: jest.fn(),
        };
        (getSocket as jest.Mock).mockReturnValue(mockSocket);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Lobby Entry/Exit Events', () => {
        it('should emit enter_lobby when component mounts and connected', async () => {
            render(React.createElement(LobbyScreen));

            await waitFor(() => {
                expect(mockSocket.emit).toHaveBeenCalledWith('enter_lobby');
            });
        });

        it('should emit leave_lobby when component unmounts', async () => {
            const { unmount } = render(React.createElement(LobbyScreen));

            // Wait for component to mount and emit enter_lobby
            await waitFor(() => {
                expect(mockSocket.emit).toHaveBeenCalledWith('enter_lobby');
            });

            // Clear the mock to verify leave_lobby is called on unmount
            mockSocket.emit.mockClear();

            // Unmount the component
            unmount();

            // Verify leave_lobby was emitted
            expect(mockSocket.emit).toHaveBeenCalledWith('leave_lobby');
        });

        it('should not emit enter_lobby when not connected', async () => {
            // Mock disconnected state
            jest.mocked(require('../store/gameStore').useGameStore).mockImplementation((selector: any) => {
                const state = {
                    availableRooms: [],
                    connected: false,
                };
                return selector(state);
            });

            render(React.createElement(LobbyScreen));

            await waitFor(() => {
                expect(mockSocket.emit).not.toHaveBeenCalledWith('enter_lobby');
            });
        });
    });
}); 