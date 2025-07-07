import { RoomManager } from '../src/rooms/manager';
import { Player } from '../src/types';

describe('RoomManager', () => {
    let roomManager: RoomManager;

    beforeEach(() => {
        roomManager = new RoomManager();
    });

    afterEach(() => {
        // Clean up any remaining rooms
        const allRooms = roomManager.getAllRooms();
        allRooms.forEach(room => {
            roomManager.forceCleanupRoom(room.id);
        });
    });

    describe('joinRoom', () => {
        it('should create a new room when joining non-existent room', () => {
            const player: Player = {
                id: 'player1',
                name: 'Test Player',
                ready: false,
                role: null,
                socketId: 'socket1'
            };

            const result = roomManager.joinRoom('room1', player);

            expect(result.success).toBe(true);
            expect(result.roomId).toBe('room1');
            expect(result.players).toHaveLength(1);
            expect(result.players[0]).toEqual(player);
        });

        it('should join existing room when room exists', () => {
            const player1: Player = {
                id: 'player1',
                name: 'Player 1',
                ready: false,
                role: null,
                socketId: 'socket1'
            };

            const player2: Player = {
                id: 'player2',
                name: 'Player 2',
                ready: false,
                role: null,
                socketId: 'socket2'
            };

            roomManager.joinRoom('room1', player1);
            const result = roomManager.joinRoom('room1', player2);

            expect(result.success).toBe(true);
            expect(result.players).toHaveLength(2);
            expect(result.players).toContainEqual(player1);
            expect(result.players).toContainEqual(player2);
        });

        it('should reject joining when room is full', () => {
            const player1: Player = {
                id: 'player1',
                name: 'Player 1',
                ready: false,
                role: null,
                socketId: 'socket1'
            };

            const player2: Player = {
                id: 'player2',
                name: 'Player 2',
                ready: false,
                role: null,
                socketId: 'socket2'
            };

            const player3: Player = {
                id: 'player3',
                name: 'Player 3',
                ready: false,
                role: null,
                socketId: 'socket3'
            };

            roomManager.joinRoom('room1', player1);
            roomManager.joinRoom('room1', player2);
            const result = roomManager.joinRoom('room1', player3);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Room is full');
        });

        it('should update existing player when rejoining', () => {
            const player: Player = {
                id: 'player1',
                name: 'Player 1',
                ready: false,
                role: null,
                socketId: 'socket1'
            };

            roomManager.joinRoom('room1', player);

            const updatedPlayer = { ...player, name: 'Updated Player', ready: true };
            const result = roomManager.joinRoom('room1', updatedPlayer);

            expect(result.success).toBe(true);
            expect(result.players).toHaveLength(1);
            expect(result.players[0]).toEqual(updatedPlayer);
        });
    });

    describe('setPlayerReady', () => {
        it('should set player as ready', () => {
            const player: Player = {
                id: 'player1',
                name: 'Player 1',
                ready: false,
                role: null,
                socketId: 'socket1'
            };

            roomManager.joinRoom('room1', player);
            const success = roomManager.setPlayerReady('room1', 'player1');

            expect(success).toBe(true);

            const room = roomManager.getRoom('room1');
            expect(room).toBeDefined();
            expect(room?.players[0]?.ready).toBe(true);
        });

        it('should return false for non-existent room', () => {
            const success = roomManager.setPlayerReady('nonexistent', 'player1');
            expect(success).toBe(false);
        });

        it('should return false for non-existent player', () => {
            const player: Player = {
                id: 'player1',
                name: 'Player 1',
                ready: false,
                role: null,
                socketId: 'socket1'
            };

            roomManager.joinRoom('room1', player);
            const success = roomManager.setPlayerReady('room1', 'nonexistent');
            expect(success).toBe(false);
        });
    });

    describe('removePlayer', () => {
        it('should remove player from room', () => {
            const player: Player = {
                id: 'player1',
                name: 'Player 1',
                ready: false,
                role: null,
                socketId: 'socket1'
            };

            roomManager.joinRoom('room1', player);
            const success = roomManager.removePlayer('room1', 'player1');

            expect(success).toBe(true);
            expect(roomManager.getPlayerCount('room1')).toBe(0);
        });

        it('should delete room when last player is removed', () => {
            const player: Player = {
                id: 'player1',
                name: 'Player 1',
                ready: false,
                role: null,
                socketId: 'socket1'
            };

            roomManager.joinRoom('room1', player);
            roomManager.removePlayer('room1', 'player1');

            expect(roomManager.getRoom('room1')).toBeUndefined();
        });

        it('should return false for non-existent room', () => {
            const success = roomManager.removePlayer('nonexistent', 'player1');
            expect(success).toBe(false);
        });
    });

    describe('isRoomReady', () => {
        it('should return true when all players are ready', () => {
            const player1: Player = {
                id: 'player1',
                name: 'Player 1',
                ready: true,
                role: null,
                socketId: 'socket1'
            };

            const player2: Player = {
                id: 'player2',
                name: 'Player 2',
                ready: true,
                role: null,
                socketId: 'socket2'
            };

            roomManager.joinRoom('room1', player1);
            roomManager.joinRoom('room1', player2);

            expect(roomManager.isRoomReady('room1')).toBe(true);
        });

        it('should return false when not all players are ready', () => {
            const player1: Player = {
                id: 'player1',
                name: 'Player 1',
                ready: true,
                role: null,
                socketId: 'socket1'
            };

            const player2: Player = {
                id: 'player2',
                name: 'Player 2',
                ready: false,
                role: null,
                socketId: 'socket2'
            };

            roomManager.joinRoom('room1', player1);
            roomManager.joinRoom('room1', player2);

            expect(roomManager.isRoomReady('room1')).toBe(false);
        });

        it('should return false for non-existent room', () => {
            expect(roomManager.isRoomReady('nonexistent')).toBe(false);
        });
    });

    describe('validateRoom', () => {
        it('should return valid for properly configured room', () => {
            const player: Player = {
                id: 'player1',
                name: 'Player 1',
                ready: false,
                role: null,
                socketId: 'socket1'
            };

            roomManager.joinRoom('room1', player);
            const validation = roomManager.validateRoom('room1');

            expect(validation.valid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        it('should return invalid for non-existent room', () => {
            const validation = roomManager.validateRoom('nonexistent');

            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain('Room does not exist');
        });
    });

    describe('getAvailableRooms', () => {
        it('should return only rooms that are not full', () => {
            const player1: Player = {
                id: 'player1',
                name: 'Player 1',
                ready: false,
                role: null,
                socketId: 'socket1'
            };

            const player2: Player = {
                id: 'player2',
                name: 'Player 2',
                ready: false,
                role: null,
                socketId: 'socket2'
            };

            const player3: Player = {
                id: 'player3',
                name: 'Player 3',
                ready: false,
                role: null,
                socketId: 'socket3'
            };

            roomManager.joinRoom('room1', player1);
            roomManager.joinRoom('room2', player2);
            roomManager.joinRoom('room2', player3);

            const availableRooms = roomManager.getAvailableRooms();
            expect(availableRooms).toHaveLength(1);
            expect(availableRooms[0]?.id).toBe('room1');
        });
    });

    describe('getPlayerCount', () => {
        it('should return correct player count', () => {
            const player1: Player = {
                id: 'player1',
                name: 'Player 1',
                ready: false,
                role: null,
                socketId: 'socket1'
            };

            const player2: Player = {
                id: 'player2',
                name: 'Player 2',
                ready: false,
                role: null,
                socketId: 'socket2'
            };

            roomManager.joinRoom('room1', player1);
            expect(roomManager.getPlayerCount('room1')).toBe(1);

            roomManager.joinRoom('room1', player2);
            expect(roomManager.getPlayerCount('room1')).toBe(2);
        });

        it('should return 0 for non-existent room', () => {
            expect(roomManager.getPlayerCount('nonexistent')).toBe(0);
        });
    });

    describe('getRoomCount', () => {
        it('should return correct room count', () => {
            expect(roomManager.getRoomCount()).toBe(0);

            const player: Player = {
                id: 'player1',
                name: 'Player 1',
                ready: false,
                role: null,
                socketId: 'socket1'
            };

            roomManager.joinRoom('room1', player);
            expect(roomManager.getRoomCount()).toBe(1);

            roomManager.joinRoom('room2', player);
            expect(roomManager.getRoomCount()).toBe(2);
        });
    });
}); 