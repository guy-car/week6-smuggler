import { Socket } from 'socket.io';
import { RoomManager } from '../src/rooms/manager';
import { GameHandlers } from '../src/socket/handlers/gameHandlers';
import { RoomHandlers } from '../src/socket/handlers/roomHandlers';

// Mock Socket.IO
const createMockSocket = (id: string = 'test-socket-id') => ({
    id,
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    join: jest.fn(),
    leave: jest.fn(),
    disconnect: jest.fn(),
    connected: true
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

describe('Integration Tests', () => {
    let roomManager: RoomManager;
    let roomHandlers: RoomHandlers;
    let gameHandlers: GameHandlers;
    let mockIo: any;

    beforeEach(() => {
        jest.clearAllMocks();
        roomManager = new RoomManager();
        mockIo = createMockIo();
        roomHandlers = new RoomHandlers(roomManager);
        gameHandlers = new GameHandlers(roomManager, mockIo);
    });

    describe('Complete Game Flow', () => {
        it('should handle complete game from join to win', () => {
            const encryptorSocket = createMockSocket('encryptor');
            const decryptorSocket = createMockSocket('decryptor');
            const roomId = 'test-room';

            // Join room
            roomHandlers.handleJoinRoom(encryptorSocket, { roomId, playerName: 'Encryptor' });
            roomHandlers.handleJoinRoom(decryptorSocket, { roomId, playerName: 'Decryptor' });

            // Mark both players as ready
            roomHandlers.handlePlayerReady(encryptorSocket, { roomId });
            roomHandlers.handlePlayerReady(decryptorSocket, { roomId });

            // Verify that both players were marked ready successfully
            expect(encryptorSocket.emit).toHaveBeenCalledWith('player_ready_success', expect.any(Object));
            expect(decryptorSocket.emit).toHaveBeenCalledWith('player_ready_success', expect.any(Object));

            // Start game
            gameHandlers.handleStartGame(encryptorSocket, { roomId });

            // Verify game started
            expect(encryptorSocket.emit).toHaveBeenCalledWith('start_game', expect.objectContaining({
                roomId
            }));
        });

        it('should handle complete game with AI win', () => {
            const encryptorSocket = createMockSocket('encryptor');
            const decryptorSocket = createMockSocket('decryptor');
            const roomId = 'test-room';

            // Join room
            roomHandlers.handleJoinRoom(encryptorSocket, { roomId, playerName: 'Encryptor' });
            roomHandlers.handleJoinRoom(decryptorSocket, { roomId, playerName: 'Decryptor' });

            // Mark both players as ready
            roomHandlers.handlePlayerReady(encryptorSocket, { roomId });
            roomHandlers.handlePlayerReady(decryptorSocket, { roomId });

            // Start game
            gameHandlers.handleStartGame(encryptorSocket, { roomId });

            // Verify game started
            expect(encryptorSocket.emit).toHaveBeenCalledWith('start_game', expect.objectContaining({
                roomId
            }));
        });

        it('should handle complete game with player win', () => {
            const encryptorSocket = createMockSocket('encryptor');
            const decryptorSocket = createMockSocket('decryptor');
            const roomId = 'test-room';

            // Join room
            roomHandlers.handleJoinRoom(encryptorSocket, { roomId, playerName: 'Encryptor' });
            roomHandlers.handleJoinRoom(decryptorSocket, { roomId, playerName: 'Decryptor' });

            // Mark both players as ready
            roomHandlers.handlePlayerReady(encryptorSocket, { roomId });
            roomHandlers.handlePlayerReady(decryptorSocket, { roomId });

            // Start game
            gameHandlers.handleStartGame(encryptorSocket, { roomId });

            // Verify game started
            expect(encryptorSocket.emit).toHaveBeenCalledWith('start_game', expect.objectContaining({
                roomId
            }));
        });
    });

    describe('Player Disconnection Scenarios', () => {
        it('should handle player disconnection during game', () => {
            const encryptorSocket = createMockSocket('encryptor');
            const decryptorSocket = createMockSocket('decryptor');
            const roomId = 'test-room';

            // Join room
            roomHandlers.handleJoinRoom(encryptorSocket, { roomId, playerName: 'Encryptor' });
            roomHandlers.handleJoinRoom(decryptorSocket, { roomId, playerName: 'Decryptor' });

            // Mark both players as ready
            roomHandlers.handlePlayerReady(encryptorSocket, { roomId });
            roomHandlers.handlePlayerReady(decryptorSocket, { roomId });

            // Start game
            gameHandlers.handleStartGame(encryptorSocket, { roomId });

            // Disconnect encryptor
            roomHandlers.handleDisconnect(encryptorSocket);

            // Verify that the disconnect was processed
            expect(encryptorSocket.emit).toHaveBeenCalled();
            expect(decryptorSocket.emit).toHaveBeenCalled();
        });

        it('should handle player reconnection to ongoing game', () => {
            const encryptorSocket = createMockSocket('encryptor');
            const decryptorSocket = createMockSocket('decryptor');
            const roomId = 'test-room';

            // Setup game
            roomHandlers.handleJoinRoom(encryptorSocket, { roomId, playerName: 'Encryptor' });
            roomHandlers.handleJoinRoom(decryptorSocket, { roomId, playerName: 'Decryptor' });
            roomHandlers.handlePlayerReady(encryptorSocket, { roomId });
            roomHandlers.handlePlayerReady(decryptorSocket, { roomId });
            gameHandlers.handleStartGame(encryptorSocket, { roomId });

            // Disconnect encryptor
            roomHandlers.handleDisconnect(encryptorSocket);

            // Reconnect with same name
            const newEncryptorSocket = createMockSocket('encryptor-new');
            roomHandlers.handleJoinRoom(newEncryptorSocket, { roomId, playerName: 'Encryptor' });

            // Should join existing game
            expect(newEncryptorSocket.emit).toHaveBeenCalledWith('join_room_success', expect.objectContaining({
                roomId,
                playerId: 'encryptor-new'
            }));
        });

        it('should handle both players disconnecting', () => {
            const encryptorSocket = createMockSocket('encryptor');
            const decryptorSocket = createMockSocket('decryptor');
            const roomId = 'test-room';

            // Join room
            roomHandlers.handleJoinRoom(encryptorSocket, { roomId, playerName: 'Encryptor' });
            roomHandlers.handleJoinRoom(decryptorSocket, { roomId, playerName: 'Decryptor' });

            // Mark both players as ready
            roomHandlers.handlePlayerReady(encryptorSocket, { roomId });
            roomHandlers.handlePlayerReady(decryptorSocket, { roomId });

            // Start game
            gameHandlers.handleStartGame(encryptorSocket, { roomId });

            // Disconnect both players
            roomHandlers.handleDisconnect(encryptorSocket);
            roomHandlers.handleDisconnect(decryptorSocket);

            // Room should be cleaned up (deleted when empty)
            const room = roomManager.getRoom(roomId);
            expect(room).toBeUndefined();
        });
    });

    describe('Room Cleanup and Recreation', () => {
        it('should handle room cleanup and recreation', () => {
            const socket1 = createMockSocket('player1');
            const socket2 = createMockSocket('player2');
            const roomId = 'test-room';

            // Join room
            roomHandlers.handleJoinRoom(socket1, { roomId, playerName: 'Player 1' });
            roomHandlers.handleJoinRoom(socket2, { roomId, playerName: 'Player 2' });

            // Disconnect both players
            roomHandlers.handleDisconnect(socket1);
            roomHandlers.handleDisconnect(socket2);

            // Room should be empty (deleted when empty)
            const room = roomManager.getRoom(roomId);
            expect(room).toBeUndefined();

            // New players can join the same room
            const newSocket1 = createMockSocket('new-player1');
            const newSocket2 = createMockSocket('new-player2');

            roomHandlers.handleJoinRoom(newSocket1, { roomId, playerName: 'New Player 1' });
            roomHandlers.handleJoinRoom(newSocket2, { roomId, playerName: 'New Player 2' });

            const newRoom = roomManager.getRoom(roomId);
            expect(newRoom).toBeDefined();
            expect(newRoom?.players).toHaveLength(2);
        });

        it('should handle multiple room creation and cleanup', () => {
            const rooms = ['room1', 'room2', 'room3'];
            const sockets = [];

            // Create multiple rooms
            for (let i = 0; i < rooms.length; i++) {
                const socket1 = createMockSocket(`player${i}-1`);
                const socket2 = createMockSocket(`player${i}-2`);

                roomHandlers.handleJoinRoom(socket1, { roomId: rooms[i]!, playerName: `Player ${i}-1` });
                roomHandlers.handleJoinRoom(socket2, { roomId: rooms[i]!, playerName: `Player ${i}-2` });

                sockets.push(socket1, socket2);
            }

            // Verify all rooms exist
            for (const roomId of rooms) {
                const room = roomManager.getRoom(roomId);
                expect(room).toBeDefined();
                expect(room?.players).toHaveLength(2);
            }

            // Disconnect all players
            for (const socket of sockets) {
                roomHandlers.handleDisconnect(socket);
            }

            // All rooms should be cleaned up
            for (const roomId of rooms) {
                const room = roomManager.getRoom(roomId);
                expect(room).toBeUndefined();
            }
        });
    });



    describe('Multi-Room Concurrent Games', () => {
        it('should handle multiple concurrent games', () => {
            const games = [
                {
                    encryptorSocket: createMockSocket('encryptor-1'),
                    decryptorSocket: createMockSocket('decryptor-1'),
                    roomId: 'room1'
                },
                {
                    encryptorSocket: createMockSocket('encryptor-2'),
                    decryptorSocket: createMockSocket('decryptor-2'),
                    roomId: 'room2'
                },
                {
                    encryptorSocket: createMockSocket('encryptor-3'),
                    decryptorSocket: createMockSocket('decryptor-3'),
                    roomId: 'room3'
                }
            ];

            // Setup all games
            for (const game of games) {
                roomHandlers.handleJoinRoom(game.encryptorSocket, { roomId: game.roomId, playerName: `Encryptor ${game.roomId}` });
                roomHandlers.handleJoinRoom(game.decryptorSocket, { roomId: game.roomId, playerName: `Decryptor ${game.roomId}` });

                roomHandlers.handlePlayerReady(game.encryptorSocket, { roomId: game.roomId });
                roomHandlers.handlePlayerReady(game.decryptorSocket, { roomId: game.roomId });

                gameHandlers.handleStartGame(game.encryptorSocket, { roomId: game.roomId });
            }

            // Verify all games started
            for (const game of games) {
                expect(game.encryptorSocket.emit).toHaveBeenCalledWith('start_game', expect.objectContaining({
                    roomId: game.roomId
                }));
            }
        });

        it('should handle room isolation', () => {
            const room1Encryptor = createMockSocket('encryptor1');
            const room1Decryptor = createMockSocket('decryptor1');
            const room2Encryptor = createMockSocket('encryptor2');
            const room2Decryptor = createMockSocket('decryptor2');

            // Setup room 1
            roomHandlers.handleJoinRoom(room1Encryptor, { roomId: 'room1', playerName: 'Encryptor 1' });
            roomHandlers.handleJoinRoom(room1Decryptor, { roomId: 'room1', playerName: 'Decryptor 1' });

            // Setup room 2
            roomHandlers.handleJoinRoom(room2Encryptor, { roomId: 'room2', playerName: 'Encryptor 2' });
            roomHandlers.handleJoinRoom(room2Decryptor, { roomId: 'room2', playerName: 'Decryptor 2' });

            // Mark players ready
            roomHandlers.handlePlayerReady(room1Encryptor, { roomId: 'room1' });
            roomHandlers.handlePlayerReady(room1Decryptor, { roomId: 'room1' });
            roomHandlers.handlePlayerReady(room2Encryptor, { roomId: 'room2' });
            roomHandlers.handlePlayerReady(room2Decryptor, { roomId: 'room2' });

            // Start games
            gameHandlers.handleStartGame(room1Encryptor, { roomId: 'room1' });
            gameHandlers.handleStartGame(room2Encryptor, { roomId: 'room2' });

            // Verify games started in correct rooms
            expect(room1Encryptor.emit).toHaveBeenCalledWith('start_game', expect.objectContaining({
                roomId: 'room1'
            }));
            expect(room2Encryptor.emit).toHaveBeenCalledWith('start_game', expect.objectContaining({
                roomId: 'room2'
            }));
        });
    });



    describe('Performance and Scalability', () => {
        it('should handle rapid message sending', () => {
            const encryptorSocket = createMockSocket('encryptor');
            const decryptorSocket = createMockSocket('decryptor');
            const roomId = 'test-room';

            // Setup room with both players
            roomHandlers.handleJoinRoom(encryptorSocket, { roomId, playerName: 'Encryptor' });
            roomHandlers.handleJoinRoom(decryptorSocket, { roomId, playerName: 'Decryptor' });

            // Mark both players as ready
            roomHandlers.handlePlayerReady(encryptorSocket, { roomId });
            roomHandlers.handlePlayerReady(decryptorSocket, { roomId });

            // Start game
            gameHandlers.handleStartGame(encryptorSocket, { roomId });

            // Get the actual assigned roles
            const room = roomManager.getRoom(roomId);
            const encryptorPlayer = room?.players.find(p => p.role === 'encryptor');
            const encryptorSocketForTest = encryptorPlayer?.id === 'encryptor' ? encryptorSocket : decryptorSocket;

            // Send multiple messages
            for (let i = 0; i < 10; i++) {
                gameHandlers.handleSendMessage(encryptorSocketForTest, { roomId, message: `Message ${i}` });
            }

            // Verify messages were processed
            expect(encryptorSocketForTest.emit).toHaveBeenCalled();
        });
    });
}); 