import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import RoomScreen from '../app/room/index';
import * as websocket from '../services/websocket';

jest.mock('../services/websocket');
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn() }) }));

jest.mock('../store/gameStore', () => ({
    useGameStore: jest.fn(() => ({
        roomId: 'room1',
        players: [
            { id: '1', name: 'Player 1', ready: true, role: 'encryptor', socketId: '' },
            { id: '2', name: 'Player 2', ready: false, role: 'decryptor', socketId: '' }
        ],
        player: { id: '1', name: 'Player 1', ready: true, role: 'encryptor', socketId: '' },
        setPlayers: jest.fn(),
        setPlayer: jest.fn(),
    })),
}));

describe('RoomScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders player list and ready status', () => {
        const { getByText } = render(<RoomScreen />);
        expect(getByText('Player 1 (You)')).toBeTruthy();
        expect(getByText('Ready')).toBeTruthy();
        expect(getByText('Player 2')).toBeTruthy();
        expect(getByText('Not Ready')).toBeTruthy();
    });

    it('calls setPlayerReady on ready toggle', () => {
        const { getByText } = render(<RoomScreen />);
        fireEvent.press(getByText('Unready'));
        expect(websocket.setPlayerReady).toHaveBeenCalledWith(false);
    });

    it('calls leaveRoom and navigates on leave', () => {
        const { getByText } = render(<RoomScreen />);
        fireEvent.press(getByText('Leave Room'));
        expect(websocket.leaveRoom).toHaveBeenCalled();
    });
}); 