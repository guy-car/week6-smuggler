import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import LobbyScreen from '../app/lobby/index';
import * as websocket from '../services/websocket';

jest.mock('../services/websocket');
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const mockSet = jest.fn();

jest.mock('../store/gameStore', () => ({
    useGameStore: jest.fn(() => ({
        availableRooms: [
            { id: 'room1', playerCount: 1, maxPlayers: 4, createdAt: '' },
            { id: 'room2', playerCount: 2, maxPlayers: 4, createdAt: '' }
        ],
        connected: true,
        setAvailableRooms: jest.fn(),
    })),
}));

describe('LobbyScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders available rooms', () => {
        const { getByText } = render(<LobbyScreen />);
        expect(getByText('Room ID: room1 (1/4)')).toBeTruthy();
        expect(getByText('Room ID: room2 (2/4)')).toBeTruthy();
    });

    it('calls createRoom on button press', async () => {
        (websocket.createRoom as jest.Mock).mockResolvedValue('room1');
        const { getByText } = render(<LobbyScreen />);
        fireEvent.press(getByText('Create Room'));
        await waitFor(() => {
            expect(websocket.createRoom).toHaveBeenCalled();
        });
    });

    it('calls joinRoom on button press', async () => {
        (websocket.joinRoom as jest.Mock).mockImplementation(() => { });
        const { getByPlaceholderText, getByText } = render(<LobbyScreen />);
        fireEvent.changeText(getByPlaceholderText('Room ID'), 'room1');
        fireEvent.press(getByText('Join Room'));
        await waitFor(() => {
            expect(websocket.joinRoom).toHaveBeenCalledWith('room1', expect.any(String));
        });
    });

    it('shows error if no room ID entered', () => {
        const { getByText } = render(<LobbyScreen />);
        fireEvent.press(getByText('Join Room'));
        expect(getByText('Enter a room ID')).toBeTruthy();
    });
}); 