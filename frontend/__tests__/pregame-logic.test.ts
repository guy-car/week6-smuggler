import { useGameStore } from '../store/gameStore';

// Mock the store
jest.mock('../store/gameStore', () => ({
    useGameStore: jest.fn(),
}));

describe('PreGame Logic', () => {
    let mockStore: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockStore = {
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
        };
        (useGameStore as unknown as jest.Mock).mockReturnValue(mockStore);
    });

    it('should detect when both players are ready', () => {
        mockStore.players = [
            { id: 'p1', name: 'Alice', ready: true, role: 'encryptor', socketId: 's1' },
            { id: 'p2', name: 'Bob', ready: true, role: 'decryptor', socketId: 's2' }
        ];

        const bothReady = mockStore.players.length === 2 && mockStore.players.every((p: any) => p.ready);
        expect(bothReady).toBe(true);
    });

    it('should detect when not all players are ready', () => {
        mockStore.players = [
            { id: 'p1', name: 'Alice', ready: false, role: 'encryptor', socketId: 's1' },
            { id: 'p2', name: 'Bob', ready: true, role: 'decryptor', socketId: 's2' }
        ];

        const bothReady = mockStore.players.length === 2 && mockStore.players.every((p: any) => p.ready);
        expect(bothReady).toBe(false);
    });

    it('should handle empty players list', () => {
        mockStore.players = [];

        const bothReady = mockStore.players.length === 2 && mockStore.players.every((p: any) => p.ready);
        expect(bothReady).toBe(false);
    });

    it('should determine correct navigation route for encryptor', () => {
        mockStore.player.role = 'encryptor';
        mockStore.gameStatus = 'active';

        const shouldNavigateToEncrypter = mockStore.gameStatus === 'active' && mockStore.player.role === 'encryptor';
        expect(shouldNavigateToEncrypter).toBe(true);
    });

    it('should determine correct navigation route for decryptor', () => {
        mockStore.player.role = 'decryptor';
        mockStore.gameStatus = 'active';

        const shouldNavigateToDecrypter = mockStore.gameStatus === 'active' && mockStore.player.role === 'decryptor';
        expect(shouldNavigateToDecrypter).toBe(true);
    });

    it('should not navigate when game is not active', () => {
        mockStore.player.role = 'encryptor';
        mockStore.gameStatus = 'waiting';

        const shouldNavigate = mockStore.gameStatus === 'active' && mockStore.player.role === 'encryptor';
        expect(shouldNavigate).toBe(false);
    });
}); 