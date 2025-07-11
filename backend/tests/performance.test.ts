import { Socket, Server as SocketIOServer } from 'socket.io';
import { RoomManager } from '../src/rooms/manager';
import { GameHandlers } from '../src/socket/handlers/gameHandlers';
import { LobbyHandlers } from '../src/socket/handlers/lobbyHandlers';
import { RoomHandlers } from '../src/socket/handlers/roomHandlers';

// Mock Socket.IO
const createMockSocket = (id: string = 'test-socket-id') => ({
    id,
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    join: jest.fn()
} as unknown as Socket);

const mockIo = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    sockets: {
        emit: jest.fn()
    }
} as unknown as SocketIOServer;

describe('Performance Validation Tests', () => {
    let roomManager: RoomManager;
    let lobbyHandlers: LobbyHandlers;
    let roomHandlers: RoomHandlers;
    let gameHandlers: GameHandlers;

    beforeEach(() => {
        jest.clearAllMocks();
        roomManager = new RoomManager();
        lobbyHandlers = new LobbyHandlers(roomManager);
        roomHandlers = new RoomHandlers(roomManager, lobbyHandlers);
        gameHandlers = new GameHandlers(roomManager, mockIo);
    });

    describe('Basic Functionality', () => {
        it('should handle room creation and cleanup', () => {
            const numRooms = 10;
            const sockets = [];

            // Create rooms
            for (let i = 0; i < numRooms; i++) {
                const socket = createMockSocket(`player${i}`);
                sockets.push(socket);
                roomHandlers.handleJoinRoom(socket, { roomId: `room${i}`, playerName: `Player ${i}` });
            }

            // Verify rooms exist
            for (let i = 0; i < numRooms; i++) {
                const room = roomManager.getRoom(`room${i}`);
                expect(room).toBeDefined();
            }

            // Clean up rooms
            for (let i = 0; i < numRooms; i++) {
                roomHandlers.handleDisconnect(sockets[i]!);
            }

            // Verify rooms are cleaned up
            for (let i = 0; i < numRooms; i++) {
                const room = roomManager.getRoom(`room${i}`);
                expect(room).toBeUndefined();
            }
        });

        it('should handle game state management', () => {
            const encoderSocket = createMockSocket('encoder');
            const decoderSocket = createMockSocket('decoder');
            const roomId = 'test-room';

            // Setup room with both players
            roomHandlers.handleJoinRoom(encoderSocket, { roomId, playerName: 'Encoder' });
            roomHandlers.handleJoinRoom(decoderSocket, { roomId, playerName: 'Decoder' });

            // Mark both players as ready
            roomHandlers.handlePlayerReady(encoderSocket, { roomId });
            roomHandlers.handlePlayerReady(decoderSocket, { roomId });

            // Start game
            gameHandlers.handleStartGame(encoderSocket, { roomId });

            // Verify game state is created
            const room = roomManager.getRoom(roomId);
            expect(room?.gameState).toBeDefined();
            expect(room?.gameState?.score).toBe(5); // Initial score
            expect(room?.gameState?.currentTurn).toBe('encoder');

            // Send a message
            const encoderPlayer = room?.players.find(p => p.role === 'encoder');
            const encoderSocketForTest = encoderPlayer?.id === 'encoder' ? encoderSocket : decoderSocket;
            gameHandlers.handleSendMessage(encoderSocketForTest, { roomId, message: 'Test message' });

            // Verify message was processed
            expect(encoderSocketForTest.emit).toHaveBeenCalledWith('message_sent', expect.objectContaining({
                roomId,
                message: expect.objectContaining({
                    content: 'Test message'
                })
            }));
        });

        it('should handle multiple room operations efficiently', () => {
            const startTime = Date.now();
            const operations = 100;

            // Perform multiple room operations
            for (let i = 0; i < operations; i++) {
                const socket = createMockSocket(`player${i}`);
                roomHandlers.handleJoinRoom(socket, { roomId: `room${i}`, playerName: `Player ${i}` });
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete within reasonable time (1 second)
            expect(duration).toBeLessThan(1000);

            // Verify all operations succeeded
            for (let i = 0; i < operations; i++) {
                const room = roomManager.getRoom(`room${i}`);
                expect(room).toBeDefined();
            }
        });

        it('should handle concurrent room operations', () => {
            const operations = 50;
            const promises: Promise<void>[] = [];

            // Create concurrent room operations
            for (let i = 0; i < operations; i++) {
                const socket = createMockSocket(`player${i}`);
                promises.push(
                    Promise.resolve(roomHandlers.handleJoinRoom(socket, { roomId: `room${i}`, playerName: `Player ${i}` }))
                );
            }

            // Execute all operations
            Promise.all(promises);

            // Verify all operations completed
            for (let i = 0; i < operations; i++) {
                const room = roomManager.getRoom(`room${i}`);
                expect(room).toBeDefined();
            }
        });

        it('should handle multiple concurrent games', () => {
            const numGames = 5;
            const sockets: any[] = [];

            // Create multiple games
            for (let i = 0; i < numGames; i++) {
                const encoderSocket = createMockSocket(`encoder${i}`);
                const decoderSocket = createMockSocket(`decoder${i}`);
                const roomId = `room${i}`;

                // Setup room with both players
                roomHandlers.handleJoinRoom(encoderSocket, { roomId, playerName: `Encoder ${i}` });
                roomHandlers.handleJoinRoom(decoderSocket, { roomId, playerName: `Decoder ${i}` });

                // Mark both players as ready
                roomHandlers.handlePlayerReady(encoderSocket, { roomId });
                roomHandlers.handlePlayerReady(decoderSocket, { roomId });

                // Start game
                gameHandlers.handleStartGame(encoderSocket, { roomId });

                sockets.push(encoderSocket, decoderSocket);
            }

            // Verify all games are active
            for (let i = 0; i < numGames; i++) {
                const room = roomManager.getRoom(`room${i}`);
                expect(room).toBeDefined();
                expect(room?.gameState).toBeDefined();
                expect(room?.players).toHaveLength(2);
            }

            // Clean up
            for (const socket of sockets) {
                roomHandlers.handleDisconnect(socket);
            }
        });
    });
}); 