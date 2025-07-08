import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import PreGameScreen from '../app/pregame';
import * as websocket from '../services/websocket';
import * as gameStore from '../store/gameStore';

jest.mock('../store/gameStore');
jest.mock('../services/websocket');

const mockRouter = { replace: jest.fn() };
jest.mock('expo-router', () => ({
    router: mockRouter,
    useRouter: () => mockRouter
}));

describe('PreGameScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (gameStore.useGameStore as unknown as jest.Mock).mockReturnValue({
            connected: true,
            roomId: 'room1',
            player: { id: 'p1', name: 'Alice', ready: false, role: null, socketId: 's1' },
            players: [
                { id: 'p1', name: 'Alice', ready: false, role: 'encryptor', socketId: 's1' },
                { id: 'p2', name: 'Bob', ready: true, role: 'decryptor', socketId: 's2' }
            ],
            gameStatus: 'waiting',
            setGameStatus: jest.fn(),
            setRole: jest.fn(),
        });
    });

    it('renders player list and ready status', () => {
        const { getByText, getAllByText } = render(<PreGameScreen />);
        expect(getByText('Alice')).toBeTruthy();
        expect(getByText('Bob')).toBeTruthy();
        expect(getAllByText('Ready')).toHaveLength(2); // One for status, one for button
        expect(getByText('Not Ready')).toBeTruthy();
    });

    it('toggles ready state when button pressed', async () => {
        const setPlayerReadyMock = websocket.setPlayerReady;
        const { getAllByText } = render(<PreGameScreen />);
        const buttons = getAllByText('Ready');
        const readyButton = buttons.find(button => button.props.testID === 'ready-button') || buttons[0];
        fireEvent.press(readyButton);
        await waitFor(() => {
            expect(setPlayerReadyMock).toHaveBeenCalledWith(true);
        });
    });

    it('navigates to encrypter when game starts and role is encryptor', () => {
        (gameStore.useGameStore as unknown as jest.Mock).mockReturnValue({
            connected: true,
            roomId: 'room1',
            player: { id: 'p1', name: 'Alice', ready: true, role: 'encryptor', socketId: 's1' },
            players: [
                { id: 'p1', name: 'Alice', ready: true, role: 'encryptor', socketId: 's1' },
                { id: 'p2', name: 'Bob', ready: true, role: 'decryptor', socketId: 's2' }
            ],
            gameStatus: 'active',
            setGameStatus: jest.fn(),
            setRole: jest.fn(),
        });
        render(<PreGameScreen />);
        expect(mockRouter.replace).toHaveBeenCalledWith('/encrypter');
    });

    it('navigates to decrypter when game starts and role is decryptor', () => {
        (gameStore.useGameStore as unknown as jest.Mock).mockReturnValue({
            connected: true,
            roomId: 'room1',
            player: { id: 'p2', name: 'Bob', ready: true, role: 'decryptor', socketId: 's2' },
            players: [
                { id: 'p1', name: 'Alice', ready: true, role: 'encryptor', socketId: 's1' },
                { id: 'p2', name: 'Bob', ready: true, role: 'decryptor', socketId: 's2' }
            ],
            gameStatus: 'active',
            setGameStatus: jest.fn(),
            setRole: jest.fn(),
        });
        render(<PreGameScreen />);
        expect(mockRouter.replace).toHaveBeenCalledWith('/decrypter');
    });

    it('shows loading when no players', () => {
        (gameStore.useGameStore as unknown as jest.Mock).mockReturnValue({
            connected: true,
            roomId: 'room1',
            player: { id: 'p1', name: 'Alice', ready: false, role: null, socketId: 's1' },
            players: [],
            gameStatus: 'waiting',
            setGameStatus: jest.fn(),
            setRole: jest.fn(),
        });
        const { getByText } = render(<PreGameScreen />);
        expect(getByText('Waiting for players to join...')).toBeTruthy();
    });
}); 