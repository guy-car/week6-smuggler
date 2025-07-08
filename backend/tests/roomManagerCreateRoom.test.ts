import { RoomManager } from '../src/rooms/manager';
import { Player } from '../src/types';

describe('RoomManager.createRoomWithPlayer', () => {
    let roomManager: RoomManager;

    beforeEach(() => {
        roomManager = new RoomManager();
    });

    afterEach(() => {
        // Clean up any created rooms
        const rooms = roomManager.getAllRooms();
        rooms.forEach(room => {
            roomManager.forceCleanupRoom(room.id);
        });
    });

    it('should create a room with a player successfully', () => {
        const roomId = 'test-room-123';
        const player: Player = {
            id: 'player-123',
            name: 'Test Player',
            ready: false,
            role: null,
            socketId: ''
        };

        const result = roomManager.createRoomWithPlayer(roomId, player);

        expect(result.success).toBe(true);
        expect(result.roomId).toBe(roomId);
        expect(result.player).toEqual(player);

        // Verify room was created
        const room = roomManager.getRoom(roomId);
        expect(room).toBeDefined();
        if (room) {
            expect(room.players).toHaveLength(1);
            expect(room.players[0]).toEqual(player);
        }
    });

    it('should return error if room already exists', () => {
        const roomId = 'test-room-456';
        const player1: Player = {
            id: 'player-1',
            name: 'Player 1',
            ready: false,
            role: null,
            socketId: ''
        };
        const player2: Player = {
            id: 'player-2',
            name: 'Player 2',
            ready: false,
            role: null,
            socketId: ''
        };

        // Create room with first player
        const result1 = roomManager.createRoomWithPlayer(roomId, player1);
        expect(result1.success).toBe(true);

        // Try to create room with same ID
        const result2 = roomManager.createRoomWithPlayer(roomId, player2);
        expect(result2.success).toBe(false);
        expect(result2.error).toBe('Room already exists');
    });

    it('should handle errors gracefully', () => {
        const roomId = 'test-room-789';
        const invalidPlayer = null as any;

        const result = roomManager.createRoomWithPlayer(roomId, invalidPlayer);

        // The method should handle null player gracefully
        // Note: The current implementation doesn't validate player object
        // so this test verifies the method doesn't crash
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
    });

    it('should update room activity timestamp', () => {
        const roomId = 'test-room-activity';
        const player: Player = {
            id: 'player-activity',
            name: 'Activity Player',
            ready: false,
            role: null,
            socketId: ''
        };

        const beforeCreate = new Date();
        const result = roomManager.createRoomWithPlayer(roomId, player);
        const afterCreate = new Date();

        expect(result.success).toBe(true);

        const room = roomManager.getRoom(roomId);
        expect(room).toBeDefined();
        if (room) {
            expect(room.lastActivity.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
            expect(room.lastActivity.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
        }
    });
}); 