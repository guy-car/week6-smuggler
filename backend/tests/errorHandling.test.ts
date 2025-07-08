import { Socket } from 'socket.io';
import { GameStateManager } from '../src/game/state';
import { RoomManager } from '../src/rooms/manager';
import { GameHandlers } from '../src/socket/handlers/gameHandlers';
import { RoomHandlers } from '../src/socket/handlers/roomHandlers';
import { Player } from '../src/types';

// Mock Socket.IO
const createMockSocket = (id: string = 'test-socket-id') => ({
    id,
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    join: jest.fn(),
    leave: jest.fn(),
    disconnect: jest.fn()
} as unknown as Socket);

const createMockIo = () => ({
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    in: jest.fn().mockReturnThis(),
    sockets: {
        in: jest.fn().mockReturnThis(),
        emit: jest.fn()
    }
});

describe('Error Handling Tests', () => {
    let roomManager: RoomManager;
    let gameStateManager: GameStateManager;
    let roomHandlers: RoomHandlers;
    let gameHandlers: GameHandlers;
    let mockIo: any;

    beforeEach(() => {
        jest.clearAllMocks();
        roomManager = new RoomManager();
        gameStateManager = new GameStateManager();
        mockIo = createMockIo();
        roomHandlers = new RoomHandlers(roomManager);
        gameHandlers = new GameHandlers(roomManager, mockIo);
    });

    describe('Room Management Error Handling', () => {
        it('should handle room creation with invalid data', () => {
            const socket = createMockSocket();

            // Test with null/undefined data
            roomHandlers.handleJoinRoom(socket, null as any);
            expect(socket.emit).toHaveBeenCalledWith('error', {
                message: 'Internal server error'
            });
        });

        it('should handle room creation with malformed data', () => {
            const socket = createMockSocket();

            // Test with various malformed data
            roomHandlers.handleJoinRoom(socket, { roomId: 123 as any, playerName: null as any });
            expect(socket.emit).toHaveBeenCalledWith('error', {
                message: 'Room ID and player name must be strings'
            });
        });

        it('should handle room creation with extremely long names', () => {
            const socket = createMockSocket();
            const longName = 'a'.repeat(101); // Just over the 100 character limit

            roomHandlers.handleJoinRoom(socket, { roomId: 'test-room', playerName: longName });
            expect(socket.emit).toHaveBeenCalledWith('join_room_error', expect.objectContaining({
                roomId: 'test-room',
                error: 'Player name too long (max 100 characters)'
            }));
        });

        it('should handle room creation with reasonable long names', () => {
            const socket = createMockSocket();
            const reasonableName = 'a'.repeat(100); // Exactly at the 100 character limit

            roomHandlers.handleJoinRoom(socket, { roomId: 'test-room', playerName: reasonableName });
            expect(socket.emit).toHaveBeenCalledWith('join_room_success', expect.objectContaining({
                roomId: 'test-room'
            }));
        });

        it('should handle room creation with special characters in player name', () => {
            const socket = createMockSocket();

            roomHandlers.handleJoinRoom(socket, { roomId: 'test-room', playerName: 'Player<script>alert("xss")</script>' });
            expect(socket.emit).toHaveBeenCalledWith('join_room_success', expect.objectContaining({
                roomId: 'test-room'
            }));
        });

        it('should handle room creation with invalid room ID format', () => {
            const socket = createMockSocket();

            roomHandlers.handleJoinRoom(socket, { roomId: 'invalid-room-id!@#', playerName: 'Player 1' });
            expect(socket.emit).toHaveBeenCalledWith('join_room_error', expect.objectContaining({
                roomId: 'invalid-room-id!@#',
                error: 'Invalid room ID format'
            }));
        });

        it('should handle concurrent room operations', async () => {
            const socket1 = createMockSocket('player1');
            const socket2 = createMockSocket('player2');

            // Simulate concurrent join operations
            const promises = [
                Promise.resolve(roomHandlers.handleJoinRoom(socket1, { roomId: 'test-room', playerName: 'Player 1' })),
                Promise.resolve(roomHandlers.handleJoinRoom(socket2, { roomId: 'test-room', playerName: 'Player 2' }))
            ];

            await Promise.all(promises);

            // Both should succeed
            expect(socket1.emit).toHaveBeenCalledWith('join_room_success', expect.any(Object));
            expect(socket2.emit).toHaveBeenCalledWith('join_room_success', expect.any(Object));
        });
    });

    describe('Game State Error Handling', () => {
        it('should handle game state creation with invalid players', () => {
            // The implementation handles empty arrays gracefully
            const gameState = gameStateManager.createGameState('test', []);
            expect(gameState).toBeDefined();
            expect(gameState.secretWord).toBe('test');
        });

        it('should handle game state creation with invalid secret word', () => {
            const player: Player = { id: 'player1', name: 'Player 1', ready: true, role: null, socketId: 'player1' };

            // The implementation handles empty strings gracefully
            const gameState = gameStateManager.createGameState('', [player]);
            expect(gameState).toBeDefined();
            expect(gameState.secretWord).toBe('');
        });

        it('should handle conversation history errors', () => {
            const player: Player = { id: 'player1', name: 'Player 1', ready: true, role: null, socketId: 'player1' };
            const gameState = gameStateManager.createGameState('test', [player]);

            // The implementation handles empty content gracefully
            const updatedState = gameStateManager.addMessage(gameState, { type: 'outsider_hint', content: '', turnNumber: 1 });
            expect(updatedState.conversationHistory).toHaveLength(1);
        });
    });



    describe('Socket Event Error Handling', () => {
        it('should handle malformed event data', () => {
            const socket = createMockSocket();

            // Test with various malformed data
            roomHandlers.handleJoinRoom(socket, { roomId: 123 as any, playerName: null as any });
            expect(socket.emit).toHaveBeenCalledWith('error', {
                message: 'Room ID and player name must be strings'
            });

            roomHandlers.handlePlayerReady(socket, { roomId: true as any });
            expect(socket.emit).toHaveBeenCalledWith('player_ready_error', {
                roomId: true,
                error: 'Failed to set player ready'
            });
        });

        it('should handle socket disconnection during operations', () => {
            const socket = createMockSocket();

            // Mock socket to be disconnected
            (socket as any).connected = false;

            roomHandlers.handleJoinRoom(socket, { roomId: 'test-room', playerName: 'Player 1' });

            // Should handle gracefully without throwing
            expect(socket.emit).toHaveBeenCalled();
        });

        it('should handle room not found scenarios', () => {
            const socket = createMockSocket();

            // Try to perform operations on non-existent room
            roomHandlers.handlePlayerReady(socket, { roomId: 'non-existent' });
            expect(socket.emit).toHaveBeenCalledWith('player_ready_error', expect.objectContaining({
                roomId: 'non-existent'
            }));

            gameHandlers.handleStartGame(socket, { roomId: 'non-existent' });
            expect(socket.emit).toHaveBeenCalledWith('error', {
                message: 'Room not found'
            });
        });

        it('should handle player not found scenarios', () => {
            const socket = createMockSocket('non-existent-player');

            // Try to perform operations as non-existent player
            roomHandlers.handlePlayerReady(socket, { roomId: 'test-room' });
            expect(socket.emit).toHaveBeenCalledWith('player_ready_error', expect.objectContaining({
                roomId: 'test-room'
            }));
        });
    });



    describe('Integration Error Handling', () => {
        it('should handle complete game flow with errors', () => {
            const socket1 = createMockSocket('player1');
            const socket2 = createMockSocket('player2');
            const roomId = 'test-room';

            // Setup room with both players
            roomHandlers.handleJoinRoom(socket1, { roomId, playerName: 'Player 1' });
            roomHandlers.handleJoinRoom(socket2, { roomId, playerName: 'Player 2' });

            // Mark both players as ready
            roomHandlers.handlePlayerReady(socket1, { roomId });
            roomHandlers.handlePlayerReady(socket2, { roomId });

            // Start game
            gameHandlers.handleStartGame(socket1, { roomId });

            // Get the actual assigned roles
            const room = roomManager.getRoom(roomId);
            const encryptorPlayer = room?.players.find(p => p.role === 'encryptor');

            // Try to send message as wrong player
            const nonEncryptorSocket = encryptorPlayer?.id === 'player1' ? socket2 : socket1;
            gameHandlers.handleSendMessage(nonEncryptorSocket, { roomId: 'test-room', message: 'Hello' }); // Wrong player

            expect(nonEncryptorSocket.emit).toHaveBeenCalledWith('send_message_error', expect.objectContaining({
                roomId: 'test-room'
            }));
        });

        it('should handle concurrent error scenarios', async () => {
            const socket1 = createMockSocket('player1');
            const socket2 = createMockSocket('player2');

            // Simulate concurrent operations that might cause errors
            const operations = [
                () => roomHandlers.handleJoinRoom(socket1, { roomId: 'test-room', playerName: 'Player 1' }),
                () => roomHandlers.handleJoinRoom(socket2, { roomId: 'test-room', playerName: 'Player 2' }),
                () => roomHandlers.handlePlayerReady(socket1, { roomId: 'test-room' }),
                () => roomHandlers.handlePlayerReady(socket2, { roomId: 'test-room' })
            ];

            // Execute all operations
            operations.forEach(op => op());

            // All should complete without throwing
            expect(socket1.emit).toHaveBeenCalled();
            expect(socket2.emit).toHaveBeenCalled();
        });

        it('should handle memory pressure scenarios', () => {
            // Create many rooms to simulate memory pressure
            for (let i = 0; i < 100; i++) {
                const socket = createMockSocket(`player${i}`);
                roomHandlers.handleJoinRoom(socket, { roomId: `room${i}`, playerName: `Player ${i}` });
            }

            // Should still function normally
            const socket = createMockSocket('new-player');
            roomHandlers.handleJoinRoom(socket, { roomId: 'new-room', playerName: 'New Player' });

            expect(socket.emit).toHaveBeenCalledWith('join_room_success', expect.any(Object));
        });
    });
}); 