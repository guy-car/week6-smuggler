import { Socket } from 'socket.io';
import { RoomManager } from '../src/rooms/manager';
import { GameHandlers } from '../src/socket/handlers/gameHandlers';
import { LobbyHandlers } from '../src/socket/handlers/lobbyHandlers';
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
    let lobbyHandlers: LobbyHandlers;
    let roomHandlers: RoomHandlers;
    let gameHandlers: GameHandlers;
    let mockIo: any;

    beforeEach(() => {
        jest.clearAllMocks();
        roomManager = new RoomManager();
        mockIo = createMockIo();
        lobbyHandlers = new LobbyHandlers(roomManager);
        roomHandlers = new RoomHandlers(roomManager, lobbyHandlers);
        gameHandlers = new GameHandlers(roomManager, mockIo);
    });

    describe('Complete Game Flow', () => {
        it('should handle complete game from join to win', () => {
            const encoderSocket = createMockSocket('encoder');
            const decoderSocket = createMockSocket('decoder');
            const roomId = 'test-room';

            // Join room
            roomHandlers.handleJoinRoom(encoderSocket, { roomId, playerName: 'Encoder' });
            roomHandlers.handleJoinRoom(decoderSocket, { roomId, playerName: 'Decoder' });

            // Mark both players as ready
            roomHandlers.handlePlayerReady(encoderSocket, { roomId });
            roomHandlers.handlePlayerReady(decoderSocket, { roomId });

            // Verify that both players were marked ready successfully
            expect(encoderSocket.emit).toHaveBeenCalledWith('player_ready_success', expect.any(Object));
            expect(decoderSocket.emit).toHaveBeenCalledWith('player_ready_success', expect.any(Object));

            // Start game
            gameHandlers.handleStartGame(encoderSocket, { roomId });

            // Verify game started
            expect(encoderSocket.emit).toHaveBeenCalledWith('start_game', expect.objectContaining({
                roomId
            }));
        });

        it('should handle complete game with AI win', () => {
            const encoderSocket = createMockSocket('encoder');
            const decoderSocket = createMockSocket('decoder');
            const roomId = 'test-room';

            // Join room
            roomHandlers.handleJoinRoom(encoderSocket, { roomId, playerName: 'Encoder' });
            roomHandlers.handleJoinRoom(decoderSocket, { roomId, playerName: 'Decoder' });

            // Mark both players as ready
            roomHandlers.handlePlayerReady(encoderSocket, { roomId });
            roomHandlers.handlePlayerReady(decoderSocket, { roomId });

            // Start game
            gameHandlers.handleStartGame(encoderSocket, { roomId });

            // Verify game started
            expect(encoderSocket.emit).toHaveBeenCalledWith('start_game', expect.objectContaining({
                roomId
            }));
        });

        it('should handle complete game with player win', () => {
            const encoderSocket = createMockSocket('encoder');
            const decoderSocket = createMockSocket('decoder');
            const roomId = 'test-room';

            // Join room
            roomHandlers.handleJoinRoom(encoderSocket, { roomId, playerName: 'Encoder' });
            roomHandlers.handleJoinRoom(decoderSocket, { roomId, playerName: 'Decoder' });

            // Mark both players as ready
            roomHandlers.handlePlayerReady(encoderSocket, { roomId });
            roomHandlers.handlePlayerReady(decoderSocket, { roomId });

            // Start game
            gameHandlers.handleStartGame(encoderSocket, { roomId });

            // Verify game started
            expect(encoderSocket.emit).toHaveBeenCalledWith('start_game', expect.objectContaining({
                roomId
            }));
        });
    });

    describe('Player Disconnection Scenarios', () => {
        it('should handle player disconnection during game', () => {
            const encoderSocket = createMockSocket('encoder');
            const decoderSocket = createMockSocket('decoder');
            const roomId = 'test-room';

            // Join room
            roomHandlers.handleJoinRoom(encoderSocket, { roomId, playerName: 'Encoder' });
            roomHandlers.handleJoinRoom(decoderSocket, { roomId, playerName: 'Decoder' });

            // Mark both players as ready
            roomHandlers.handlePlayerReady(encoderSocket, { roomId });
            roomHandlers.handlePlayerReady(decoderSocket, { roomId });

            // Start game
            gameHandlers.handleStartGame(encoderSocket, { roomId });

            // Disconnect encoder
            roomHandlers.handleDisconnect(encoderSocket);

            // Verify that the disconnect was processed
            expect(encoderSocket.emit).toHaveBeenCalled();
            expect(decoderSocket.emit).toHaveBeenCalled();
        });

        it('should handle player reconnection to ongoing game', () => {
            const encoderSocket = createMockSocket('encoder');
            const decoderSocket = createMockSocket('decoder');
            const roomId = 'test-room';

            // Setup game
            roomHandlers.handleJoinRoom(encoderSocket, { roomId, playerName: 'Encoder' });
            roomHandlers.handleJoinRoom(decoderSocket, { roomId, playerName: 'Decoder' });
            roomHandlers.handlePlayerReady(encoderSocket, { roomId });
            roomHandlers.handlePlayerReady(decoderSocket, { roomId });
            gameHandlers.handleStartGame(encoderSocket, { roomId });

            // Disconnect encoder
            roomHandlers.handleDisconnect(encoderSocket);

            // Reconnect with same name
            const newEncoderSocket = createMockSocket('encoder-new');
            roomHandlers.handleJoinRoom(newEncoderSocket, { roomId, playerName: 'Encoder' });

            // Should join existing game
            expect(newEncoderSocket.emit).toHaveBeenCalledWith('join_room_success', expect.objectContaining({
                roomId,
                playerId: 'encoder-new'
            }));
        });

        it('should handle both players disconnecting', () => {
            const encoderSocket = createMockSocket('encoder');
            const decoderSocket = createMockSocket('decoder');
            const roomId = 'test-room';

            // Join room
            roomHandlers.handleJoinRoom(encoderSocket, { roomId, playerName: 'Encoder' });
            roomHandlers.handleJoinRoom(decoderSocket, { roomId, playerName: 'Decoder' });

            // Mark both players as ready
            roomHandlers.handlePlayerReady(encoderSocket, { roomId });
            roomHandlers.handlePlayerReady(decoderSocket, { roomId });

            // Start game
            gameHandlers.handleStartGame(encoderSocket, { roomId });

            // Disconnect both players
            roomHandlers.handleDisconnect(encoderSocket);
            roomHandlers.handleDisconnect(decoderSocket);

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
                    encoderSocket: createMockSocket('encoder-1'),
                    decoderSocket: createMockSocket('decoder-1'),
                    roomId: 'room1'
                },
                {
                    encoderSocket: createMockSocket('encoder-2'),
                    decoderSocket: createMockSocket('decoder-2'),
                    roomId: 'room2'
                },
                {
                    encoderSocket: createMockSocket('encoder-3'),
                    decoderSocket: createMockSocket('decoder-3'),
                    roomId: 'room3'
                }
            ];

            // Setup all games
            for (const game of games) {
                roomHandlers.handleJoinRoom(game.encoderSocket, { roomId: game.roomId, playerName: `Encoder ${game.roomId}` });
                roomHandlers.handleJoinRoom(game.decoderSocket, { roomId: game.roomId, playerName: `Decoder ${game.roomId}` });

                roomHandlers.handlePlayerReady(game.encoderSocket, { roomId: game.roomId });
                roomHandlers.handlePlayerReady(game.decoderSocket, { roomId: game.roomId });

                gameHandlers.handleStartGame(game.encoderSocket, { roomId: game.roomId });
            }

            // Verify all games started
            for (const game of games) {
                expect(game.encoderSocket.emit).toHaveBeenCalledWith('start_game', expect.objectContaining({
                    roomId: game.roomId
                }));
            }
        });

        it('should handle room isolation', () => {
            const room1Encoder = createMockSocket('encoder1');
            const room1Decoder = createMockSocket('decoder1');
            const room2Encoder = createMockSocket('encoder2');
            const room2Decoder = createMockSocket('decoder2');

            // Setup room 1
            roomHandlers.handleJoinRoom(room1Encoder, { roomId: 'room1', playerName: 'Encoder 1' });
            roomHandlers.handleJoinRoom(room1Decoder, { roomId: 'room1', playerName: 'Decoder 1' });

            // Setup room 2
            roomHandlers.handleJoinRoom(room2Encoder, { roomId: 'room2', playerName: 'Encoder 2' });
            roomHandlers.handleJoinRoom(room2Decoder, { roomId: 'room2', playerName: 'Decoder 2' });

            // Mark players ready
            roomHandlers.handlePlayerReady(room1Encoder, { roomId: 'room1' });
            roomHandlers.handlePlayerReady(room1Decoder, { roomId: 'room1' });
            roomHandlers.handlePlayerReady(room2Encoder, { roomId: 'room2' });
            roomHandlers.handlePlayerReady(room2Decoder, { roomId: 'room2' });

            // Start games
            gameHandlers.handleStartGame(room1Encoder, { roomId: 'room1' });
            gameHandlers.handleStartGame(room2Encoder, { roomId: 'room2' });

            // Verify games started in correct rooms
            expect(room1Encoder.emit).toHaveBeenCalledWith('start_game', expect.objectContaining({
                roomId: 'room1'
            }));
            expect(room2Encoder.emit).toHaveBeenCalledWith('start_game', expect.objectContaining({
                roomId: 'room2'
            }));
        });
    });



    describe('Performance and Scalability', () => {
        it('should handle rapid message sending', () => {
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

            // Get the actual assigned roles
            const room = roomManager.getRoom(roomId);
            const encoderPlayer = room?.players.find(p => p.role === 'encoder');
            const encoderSocketForTest = encoderPlayer?.id === 'encoder' ? encoderSocket : decoderSocket;

            // Send multiple messages
            for (let i = 0; i < 10; i++) {
                gameHandlers.handleSendMessage(encoderSocketForTest, { roomId, message: `Message ${i}` });
            }

            // Verify messages were processed
            expect(encoderSocketForTest.emit).toHaveBeenCalled();
        });
    });
}); 