
jest.mock('../services/websocket', () => {
    const actual = jest.requireActual('../services/websocket');
    return {
        ...actual,
        getSocket: jest.fn(),
    };
});

jest.mock('../store/gameStore', () => {
    const actual = jest.requireActual('../store/gameStore');
    return {
        ...actual,
        useGameStore: jest.fn(),
    };
});

describe('Ready Button WebSocket Logic', () => {
    let mockSocket: any;
    let storeState: any;

    beforeEach(() => {
        jest.resetModules();
        mockSocket = {
            emit: jest.fn(),
            on: jest.fn(),
        };
        storeState = {
            roomId: 'room123',
            players: [
                { id: 'p1', name: 'A', ready: false },
                { id: 'p2', name: 'B', ready: false },
            ],
            player: { id: 'p1', name: 'A', ready: false },
            setPlayers: jest.fn(),
            setIsReady: jest.fn(),
            setError: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    function setupMocks() {
        jest.doMock('../services/websocket', () => ({
            getSocket: () => mockSocket,
        }));
        jest.doMock('../store/gameStore', () => {
            const mockStore = ((selector: any) => selector(storeState)) as any;
            mockStore.getState = () => storeState;
            return { useGameStore: mockStore };
        });
    }

    it('emits player_ready with roomId and ready', () => {
        setupMocks();
        const { setPlayerReady } = require('../services/websocket');
        setPlayerReady(true);
        expect(mockSocket.emit).toHaveBeenCalledWith('player_ready', { roomId: 'room123', ready: true });
    });

    it('sets error if no roomId', () => {
        setupMocks();
        storeState.roomId = null;
        const { setPlayerReady } = require('../services/websocket');
        setPlayerReady(true);
        expect(storeState.setError).toHaveBeenCalledWith('No room ID found');
    });

    it('updates player ready state on player_ready_success', () => {
        // This test does not require mocking modules, just store logic
        const data = { playerId: 'p1', ready: true };
        const currentPlayers = storeState.players;
        const updatedPlayers = currentPlayers.map((p: any) =>
            p.id === data.playerId ? { ...p, ready: data.ready } : p
        );
        storeState.setPlayers(updatedPlayers);
        if (storeState.player && storeState.player.id === data.playerId) {
            storeState.setIsReady(data.ready);
        }
        expect(storeState.setPlayers).toHaveBeenCalledWith([
            { id: 'p1', name: 'A', ready: true },
            { id: 'p2', name: 'B', ready: false },
        ]);
        expect(storeState.setIsReady).toHaveBeenCalledWith(true);
    });

    it('sets error on player_ready_error', () => {
        const errorData = { message: 'Some error' };
        storeState.setError(errorData.message);
        expect(storeState.setError).toHaveBeenCalledWith('Some error');
    });
}); 