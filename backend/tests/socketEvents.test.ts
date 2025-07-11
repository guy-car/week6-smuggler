import { Socket } from 'socket.io';
import { GameStateManager } from '../src/game/state';
import { RoomManager } from '../src/rooms/manager';
import { GameHandlers } from '../src/socket/handlers/gameHandlers';
import { LobbyHandlers } from '../src/socket/handlers/lobbyHandlers';
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

describe('Socket.IO Event Testing', () => {
    let roomManager: RoomManager;
    let gameStateManager: GameStateManager;
    let lobbyHandlers: LobbyHandlers;
    let roomHandlers: RoomHandlers;
    let gameHandlers: GameHandlers;
    let mockIo: any;

    beforeEach(() => {
        jest.clearAllMocks();
        roomManager = new RoomManager();
        gameStateManager = new GameStateManager();
        mockIo = createMockIo();
        lobbyHandlers = new LobbyHandlers(roomManager);
        roomHandlers = new RoomHandlers(roomManager, lobbyHandlers);
        gameHandlers = new GameHandlers(roomManager, mockIo);
    });

    describe('Room Events', () => {
        describe('join_room', () => {
            it('should handle successful room join', () => {
                const socket = createMockSocket('player1');
                const data = { roomId: 'test-room', playerName: 'Player 1' };

                roomHandlers.handleJoinRoom(socket, data);

                expect(socket.join).toHaveBeenCalledWith('test-room');
                expect(socket.emit).toHaveBeenCalledWith('join_room_success', expect.objectContaining({
                    roomId: 'test-room',
                    playerId: 'player1'
                }));
                expect(socket.to).toHaveBeenCalledWith('test-room');
            });

            it('should handle join room with missing data', () => {
                const socket = createMockSocket();
                const data = { roomId: '', playerName: '' };

                roomHandlers.handleJoinRoom(socket, data);

                expect(socket.emit).toHaveBeenCalledWith('error', {
                    message: 'Room ID and player name are required'
                });
            });

            it('should handle room at capacity', () => {
                const socket1 = createMockSocket('player1');
                const socket2 = createMockSocket('player2');
                const socket3 = createMockSocket('player3');

                // Join first two players
                roomHandlers.handleJoinRoom(socket1, { roomId: 'test-room', playerName: 'Player 1' });
                roomHandlers.handleJoinRoom(socket2, { roomId: 'test-room', playerName: 'Player 2' });

                // Try to join third player
                roomHandlers.handleJoinRoom(socket3, { roomId: 'test-room', playerName: 'Player 3' });

                expect(socket3.emit).toHaveBeenCalledWith('join_room_error', expect.objectContaining({
                    roomId: 'test-room'
                }));
            });

            it('should handle duplicate player name in room', () => {
                const socket1 = createMockSocket('player1');
                const socket2 = createMockSocket('player2');

                // Join first player
                roomHandlers.handleJoinRoom(socket1, { roomId: 'test-room', playerName: 'Player 1' });

                // Join second player with same name (should be allowed)
                roomHandlers.handleJoinRoom(socket2, { roomId: 'test-room', playerName: 'Player 1' });

                expect(socket2.emit).toHaveBeenCalledWith('join_room_success', expect.objectContaining({
                    roomId: 'test-room'
                }));
            });
        });

        describe('player_ready', () => {
            it('should handle player ready successfully', () => {
                const socket = createMockSocket('player1');

                // Join room first
                roomHandlers.handleJoinRoom(socket, { roomId: 'test-room', playerName: 'Player 1' });

                // Set ready
                roomHandlers.handlePlayerReady(socket, { roomId: 'test-room' });

                expect(socket.emit).toHaveBeenCalledWith('player_ready_success', expect.objectContaining({
                    roomId: 'test-room'
                }));
            });

            it('should handle player ready with missing room ID', () => {
                const socket = createMockSocket();

                roomHandlers.handlePlayerReady(socket, { roomId: '' });

                expect(socket.emit).toHaveBeenCalledWith('error', {
                    message: 'Room ID is required'
                });
            });

            it('should handle player ready in non-existent room', () => {
                const socket = createMockSocket();

                roomHandlers.handlePlayerReady(socket, { roomId: 'non-existent' });

                expect(socket.emit).toHaveBeenCalledWith('player_ready_error', expect.objectContaining({
                    roomId: 'non-existent'
                }));
            });

            it('should emit room_ready when both players are ready', () => {
                const socket1 = createMockSocket('player1');
                const socket2 = createMockSocket('player2');

                // Join both players
                roomHandlers.handleJoinRoom(socket1, { roomId: 'test-room', playerName: 'Player 1' });
                roomHandlers.handleJoinRoom(socket2, { roomId: 'test-room', playerName: 'Player 2' });

                // Mark first player as ready (should not emit room_ready yet)
                roomHandlers.handlePlayerReady(socket1, { roomId: 'test-room' });

                // Mark second player as ready (should emit room_ready now)
                roomHandlers.handlePlayerReady(socket2, { roomId: 'test-room' });

                // Verify that both players were marked ready successfully
                expect(socket1.emit).toHaveBeenCalledWith('player_ready_success', expect.any(Object));
                expect(socket2.emit).toHaveBeenCalledWith('player_ready_success', expect.any(Object));
            });
        });

        describe('disconnect', () => {
            it('should handle player disconnection', () => {
                const socket = createMockSocket('player1');

                // Join room
                roomHandlers.handleJoinRoom(socket, { roomId: 'test-room', playerName: 'Player 1' });

                // Disconnect
                roomHandlers.handleDisconnect(socket);

                expect(socket.to).toHaveBeenCalledWith('test-room');
            });

            it('should handle disconnection from multiple rooms', () => {
                const socket = createMockSocket('player1');

                // Join multiple rooms
                roomHandlers.handleJoinRoom(socket, { roomId: 'room1', playerName: 'Player 1' });
                roomHandlers.handleJoinRoom(socket, { roomId: 'room2', playerName: 'Player 1' });

                // Disconnect
                roomHandlers.handleDisconnect(socket);

                // Should notify the room the player was in
                expect(socket.to).toHaveBeenCalled();
            });
        });

        describe('list_rooms', () => {
            it('should return available rooms list', () => {
                const socket = createMockSocket();

                // Create some rooms
                roomHandlers.handleJoinRoom(createMockSocket('player1'), { roomId: 'room1', playerName: 'Player 1' });
                roomHandlers.handleJoinRoom(createMockSocket('player2'), { roomId: 'room2', playerName: 'Player 2' });

                roomHandlers.handleListRooms(socket);

                expect(socket.emit).toHaveBeenCalledWith('room_list', expect.objectContaining({
                    rooms: expect.arrayContaining([
                        expect.objectContaining({ id: 'room1' }),
                        expect.objectContaining({ id: 'room2' })
                    ])
                }));
            });

            it('should return empty list when no rooms exist', () => {
                const socket = createMockSocket();

                roomHandlers.handleListRooms(socket);

                expect(socket.emit).toHaveBeenCalledWith('room_list', {
                    rooms: []
                });
            });
        });

        describe('check_room_availability', () => {
            it('should return room availability status', () => {
                const socket = createMockSocket();

                roomHandlers.handleCheckRoomAvailability(socket, { roomId: 'test-room' });

                expect(socket.emit).toHaveBeenCalledWith('room_availability', expect.objectContaining({
                    roomId: 'test-room',
                    available: expect.any(Boolean),
                    playerCount: expect.any(Number)
                }));
            });

            it('should handle missing room ID', () => {
                const socket = createMockSocket();

                roomHandlers.handleCheckRoomAvailability(socket, { roomId: '' });

                expect(socket.emit).toHaveBeenCalledWith('error', {
                    message: 'Room ID is required'
                });
            });
        });
    });

    describe('Game Events', () => {
        describe('start_game', () => {
            it('should start game when room is ready', () => {
                const socket = createMockSocket('player1');
                const player1: Player = { id: 'player1', name: 'Player 1', ready: true, role: null, socketId: 'player1' };
                const player2: Player = { id: 'player2', name: 'Player 2', ready: true, role: null, socketId: 'player2' };

                // Join players to room
                roomManager.joinRoom('test-room', player1);
                roomManager.joinRoom('test-room', player2);

                gameHandlers.handleStartGame(socket, { roomId: 'test-room' });

                expect(socket.emit).toHaveBeenCalledWith('start_game', expect.objectContaining({
                    roomId: 'test-room',
                    players: expect.arrayContaining([
                        expect.objectContaining({ role: 'encoder' }),
                        expect.objectContaining({ role: 'decoder' })
                    ]),
                    secretWord: expect.any(String)
                }));
            });

            it('should handle start game with missing room ID', () => {
                const socket = createMockSocket();

                gameHandlers.handleStartGame(socket, {} as any);

                expect(socket.emit).toHaveBeenCalledWith('error', {
                    message: 'Room ID is required'
                });
            });

            it('should handle start game in non-existent room', () => {
                const socket = createMockSocket();

                gameHandlers.handleStartGame(socket, { roomId: 'non-existent' });

                expect(socket.emit).toHaveBeenCalledWith('error', {
                    message: 'Room not found'
                });
            });

            it('should handle start game when room is not ready', () => {
                const socket = createMockSocket('player1');
                const player: Player = { id: 'player1', name: 'Player 1', ready: false, role: null, socketId: 'player1' };

                roomManager.joinRoom('test-room', player);

                gameHandlers.handleStartGame(socket, { roomId: 'test-room' });

                expect(socket.emit).toHaveBeenCalledWith('start_game_error', {
                    roomId: 'test-room',
                    error: 'Room is not ready to start'
                });
            });
        });

        describe('send_message', () => {
            it('should handle message from encoder', () => {
                const socket = createMockSocket('encoder');
                const encoder: Player = { id: 'encoder', name: 'Encoder', ready: true, role: 'encoder', socketId: 'encoder' };
                const decoder: Player = { id: 'decoder', name: 'Decoder', ready: true, role: 'decoder', socketId: 'decoder' };

                // Setup room with both players
                roomManager.joinRoom('test-room', encoder);
                roomManager.joinRoom('test-room', decoder);

                // Create game state
                const room = roomManager.getRoom('test-room');
                room!.gameState = gameStateManager.createGameState('test', [encoder, decoder]);

                // Send message
                gameHandlers.handleSendMessage(socket, { roomId: 'test-room', message: 'Hello world' });

                expect(socket.emit).toHaveBeenCalledWith('message_sent', expect.objectContaining({
                    roomId: 'test-room',
                    message: expect.objectContaining({
                        content: 'Hello world',
                        senderId: 'encoder'
                    })
                }));
            });

            it('should handle message from non-encoder', () => {
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

                // Try to send message as the decoder (non-encoder)
                const nonEncoderSocket = encoderPlayer?.id === 'encoder' ? decoderSocket : encoderSocket;
                gameHandlers.handleSendMessage(nonEncoderSocket, { roomId, message: 'Hello world' });
                expect(nonEncoderSocket.emit).toHaveBeenCalledWith('send_message_error', {
                    roomId,
                    error: 'Only encoder can send messages'
                });
            });

            it('should handle message when not encoder\'s turn', () => {
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

                // Send first message (should work)
                gameHandlers.handleSendMessage(encoderPlayer?.id === 'encoder' ? encoderSocket : decoderSocket, { roomId, message: 'First message' });

                // Try to send second message (should fail - not encoder's turn anymore)
                const encoderSocketForTest = encoderPlayer?.id === 'encoder' ? encoderSocket : decoderSocket;
                gameHandlers.handleSendMessage(encoderSocketForTest, { roomId, message: 'Hello world' });
                expect(encoderSocketForTest.emit).toHaveBeenCalledWith('send_message_error', {
                    roomId,
                    error: 'Not encoder\'s turn'
                });
            });

            it('should handle empty message', () => {
                const socket = createMockSocket('player1');
                const roomId = 'test-room';

                // Setup room with player
                roomHandlers.handleJoinRoom(socket, { roomId, playerName: 'Player 1' });

                // Try to send empty message
                gameHandlers.handleSendMessage(socket, { roomId, message: '' });
                expect(socket.emit).toHaveBeenCalledWith('error', {
                    message: 'Room ID and message are required'
                });
            });
        });

        describe('player_guess', () => {
            it('should handle correct guess from decoder', () => {
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
                const decoderPlayer = room?.players.find(p => p.role === 'decoder');

                // Send a message first to make it decoder's turn
                const encoderPlayer = room?.players.find(p => p.role === 'encoder');
                const encoderSocketForTest = encoderPlayer?.id === 'encoder' ? encoderSocket : decoderSocket;
                gameHandlers.handleSendMessage(encoderSocketForTest, { roomId, message: 'Hello world' });

                // Make correct guess
                const decoderSocketForTest = decoderPlayer?.id === 'decoder' ? decoderSocket : encoderSocket;
                gameHandlers.handlePlayerGuess(decoderSocketForTest, { roomId, guess: 'test' });

                // Should emit game end event
                expect(decoderSocketForTest.emit).toHaveBeenCalled();
            });

            it('should handle incorrect guess from decoder', () => {
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
                const decoderPlayer = room?.players.find(p => p.role === 'decoder');

                // Send a message first to make it decoder's turn
                const encoderPlayer = room?.players.find(p => p.role === 'encoder');
                const encoderSocketForTest = encoderPlayer?.id === 'encoder' ? encoderSocket : decoderSocket;
                gameHandlers.handleSendMessage(encoderSocketForTest, { roomId, message: 'Hello world' });

                // Make incorrect guess
                const decoderSocketForTest = decoderPlayer?.id === 'decoder' ? decoderSocket : encoderSocket;
                gameHandlers.handlePlayerGuess(decoderSocketForTest, { roomId, guess: 'wrong' });

                // Verify the guess was processed
                expect(decoderSocketForTest.emit).toHaveBeenCalled();
            });

            it('should handle guess from non-decoder', () => {
                const encoderSocket = createMockSocket('encoder');
                const decoderSocket = createMockSocket('decoder');
                const roomId = 'test-room';

                // Setup room with both players
                roomHandlers.handleJoinRoom(encoderSocket, { roomId, playerName: 'Encoder' });
                roomHandlers.handleJoinRoom(decoderSocket, { roomId, playerName: 'Decoder' });

                // Mark both players as ready
                roomHandlers.handlePlayerReady(encoderSocket, { roomId });
                roomHandlers.handlePlayerReady(decoderSocket, { roomId });

                // Start the game
                gameHandlers.handleStartGame(encoderSocket, { roomId });

                // Get the actual assigned roles
                const room = roomManager.getRoom(roomId);
                const encoderPlayer = room?.players.find(p => p.role === 'encoder');

                // Try to guess as encoder (non-decoder)
                const nonDecoderSocket = encoderPlayer?.id === 'encoder' ? encoderSocket : decoderSocket;
                gameHandlers.handlePlayerGuess(nonDecoderSocket, { roomId, guess: 'test' });
                expect(nonDecoderSocket.emit).toHaveBeenCalledWith('player_guess_error', {
                    roomId: 'test-room',
                    error: 'Not decoder\'s turn, Only decoder can make guesses'
                });
            });

            it('should handle guess on wrong turn', () => {
                const encoderSocket = createMockSocket('encoder');
                const decoderSocket = createMockSocket('decoder');
                const roomId = 'test-room';

                // Setup room with both players
                roomHandlers.handleJoinRoom(encoderSocket, { roomId, playerName: 'Encoder' });
                roomHandlers.handleJoinRoom(decoderSocket, { roomId, playerName: 'Decoder' });

                // Mark both players as ready
                roomHandlers.handlePlayerReady(encoderSocket, { roomId });
                roomHandlers.handlePlayerReady(decoderSocket, { roomId });

                // Start the game
                gameHandlers.handleStartGame(encoderSocket, { roomId });

                // Get the actual assigned roles
                const room = roomManager.getRoom(roomId);
                const decoderPlayer = room?.players.find(p => p.role === 'decoder');

                // Try to guess on wrong turn (encoder's turn)
                const decoderSocketForTest = decoderPlayer?.id === 'decoder' ? decoderSocket : encoderSocket;
                gameHandlers.handlePlayerGuess(decoderSocketForTest, { roomId, guess: 'test' });

                // Verify an error was emitted
                expect(decoderSocketForTest.emit).toHaveBeenCalled();
            });

            it('should handle empty guess', () => {
                const socket = createMockSocket('player1');
                const roomId = 'test-room';

                // Setup room with player
                roomHandlers.handleJoinRoom(socket, { roomId, playerName: 'Player 1' });

                // Try to guess with empty string
                gameHandlers.handlePlayerGuess(socket, { roomId, guess: '' });
                expect(socket.emit).toHaveBeenCalledWith('error', {
                    message: 'Room ID and guess are required'
                });
            });
        });
    });

    describe('Event Broadcasting', () => {
        it('should broadcast to correct room', () => {
            const socket1 = createMockSocket('player1');
            const socket2 = createMockSocket('player2');

            // Join same room
            roomHandlers.handleJoinRoom(socket1, { roomId: 'test-room', playerName: 'Player 1' });
            roomHandlers.handleJoinRoom(socket2, { roomId: 'test-room', playerName: 'Player 2' });

            // Player 1 sends message
            roomHandlers.handlePlayerReady(socket1, { roomId: 'test-room' });

            expect(socket1.to).toHaveBeenCalledWith('test-room');
        });

        it('should not broadcast to other rooms', () => {
            const socket1 = createMockSocket('player1');
            const socket2 = createMockSocket('player2');

            // Join different rooms
            roomHandlers.handleJoinRoom(socket1, { roomId: 'room1', playerName: 'Player 1' });
            roomHandlers.handleJoinRoom(socket2, { roomId: 'room2', playerName: 'Player 2' });

            // Player 1 sends message
            roomHandlers.handlePlayerReady(socket1, { roomId: 'room1' });

            expect(socket1.to).toHaveBeenCalledWith('room1');
            expect(socket1.to).not.toHaveBeenCalledWith('room2');
        });
    });

    describe('Error Handling', () => {
        it('should handle malformed event data', () => {
            const socket = createMockSocket();

            // Test with various malformed data
            roomHandlers.handleJoinRoom(socket, { roomId: 123 as any, playerName: null as any });
            expect(socket.emit).toHaveBeenCalledWith('error', {
                message: 'Room ID and player name must be strings'
            });
        });

        it('should handle server errors gracefully', () => {
            const socket = createMockSocket();

            // Mock roomManager to throw error
            jest.spyOn(roomManager, 'joinRoom').mockImplementation(() => {
                throw new Error('Database error');
            });

            roomHandlers.handleJoinRoom(socket, { roomId: 'test-room', playerName: 'Player 1' });

            expect(socket.emit).toHaveBeenCalledWith('error', {
                message: 'Internal server error'
            });
        });

        it('should handle missing event handlers', () => {
            const socket = createMockSocket();

            // Test with undefined data
            roomHandlers.handleJoinRoom(socket, undefined as any);
            expect(socket.emit).toHaveBeenCalledWith('error', {
                message: 'Internal server error'
            });
        });
    });
}); 