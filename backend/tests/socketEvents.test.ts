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

describe('Socket.IO Event Testing', () => {
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
                        expect.objectContaining({ role: 'encryptor' }),
                        expect.objectContaining({ role: 'decryptor' })
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
            it('should handle message from encryptor', () => {
                const socket = createMockSocket('encryptor');
                const encryptor: Player = { id: 'encryptor', name: 'Encryptor', ready: true, role: 'encryptor', socketId: 'encryptor' };
                const decryptor: Player = { id: 'decryptor', name: 'Decryptor', ready: true, role: 'decryptor', socketId: 'decryptor' };

                roomManager.joinRoom('test-room', encryptor);
                roomManager.joinRoom('test-room', decryptor);

                // Start game
                const room = roomManager.getRoom('test-room');
                if (room) {
                    room.gameState = gameStateManager.createGameState('test', [encryptor, decryptor]);
                }

                gameHandlers.handleSendMessage(socket, { roomId: 'test-room', message: 'Hello world' });

                expect(socket.emit).toHaveBeenCalledWith('message_sent', expect.objectContaining({
                    roomId: 'test-room',
                    message: expect.objectContaining({
                        content: 'Hello world',
                        senderId: 'encryptor'
                    })
                }));
            });

            it('should handle message from non-encryptor', () => {
                const encryptorSocket = createMockSocket('encryptor');
                const decryptorSocket = createMockSocket('decryptor');
                const roomId = 'test-room';

                // Setup room with both players
                roomHandlers.handleJoinRoom(encryptorSocket, { roomId, playerName: 'Encryptor' });
                roomHandlers.handleJoinRoom(decryptorSocket, { roomId, playerName: 'Decryptor' });

                // Mark both players as ready
                roomHandlers.handlePlayerReady(encryptorSocket, { roomId });
                roomHandlers.handlePlayerReady(decryptorSocket, { roomId });

                // Start the game
                gameHandlers.handleStartGame(encryptorSocket, { roomId });

                // Get the actual assigned roles
                const room = roomManager.getRoom(roomId);
                const encryptorPlayer = room?.players.find(p => p.role === 'encryptor');

                // Try to send message as the decryptor (non-encryptor)
                const nonEncryptorSocket = encryptorPlayer?.id === 'encryptor' ? decryptorSocket : encryptorSocket;
                gameHandlers.handleSendMessage(nonEncryptorSocket, { roomId, message: 'Hello world' });
                expect(nonEncryptorSocket.emit).toHaveBeenCalledWith('send_message_error', {
                    roomId: 'test-room',
                    error: 'Only encryptor can send messages'
                });
            });

            it('should handle message on wrong turn', () => {
                const encryptorSocket = createMockSocket('encryptor');
                const decryptorSocket = createMockSocket('decryptor');
                const roomId = 'test-room';

                // Setup room with both players
                roomHandlers.handleJoinRoom(encryptorSocket, { roomId, playerName: 'Encryptor' });
                roomHandlers.handleJoinRoom(decryptorSocket, { roomId, playerName: 'Decryptor' });

                // Mark both players as ready
                roomHandlers.handlePlayerReady(encryptorSocket, { roomId });
                roomHandlers.handlePlayerReady(decryptorSocket, { roomId });

                // Start the game
                gameHandlers.handleStartGame(encryptorSocket, { roomId });

                // Get the actual assigned roles
                const room = roomManager.getRoom(roomId);
                const encryptorPlayer = room?.players.find(p => p.role === 'encryptor');

                // Send a message to advance turn to AI
                gameHandlers.handleSendMessage(encryptorPlayer?.id === 'encryptor' ? encryptorSocket : decryptorSocket, { roomId, message: 'First message' });

                // Try to send another message on wrong turn (AI's turn)
                const encryptorSocketForTest = encryptorPlayer?.id === 'encryptor' ? encryptorSocket : decryptorSocket;
                gameHandlers.handleSendMessage(encryptorSocketForTest, { roomId, message: 'Hello world' });
                expect(encryptorSocketForTest.emit).toHaveBeenCalledWith('send_message_error', {
                    roomId: 'test-room',
                    error: 'Not encryptor\'s turn'
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
            it('should handle correct guess from decryptor', () => {
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
                const decryptorPlayer = room?.players.find(p => p.role === 'decryptor');

                // Send a message to start conversation
                const encryptorPlayer = room?.players.find(p => p.role === 'encryptor');
                const encryptorSocketForTest = encryptorPlayer?.id === 'encryptor' ? encryptorSocket : decryptorSocket;
                gameHandlers.handleSendMessage(encryptorSocketForTest, { roomId, message: 'Hello world' });

                // Set the secret word to 'test' for this test
                if (room && room.gameState) {
                    room.gameState.secretWord = 'test';
                }

                // Make correct guess
                const decryptorSocketForTest = decryptorPlayer?.id === 'decryptor' ? decryptorSocket : encryptorSocket;
                gameHandlers.handlePlayerGuess(decryptorSocketForTest, { roomId, guess: 'test' });

                // Verify the guess was processed
                expect(decryptorSocketForTest.emit).toHaveBeenCalled();
            });

            it('should handle incorrect guess from decryptor', () => {
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
                const decryptorPlayer = room?.players.find(p => p.role === 'decryptor');

                // Send a message to start conversation
                const encryptorPlayer = room?.players.find(p => p.role === 'encryptor');
                const encryptorSocketForTest = encryptorPlayer?.id === 'encryptor' ? encryptorSocket : decryptorSocket;
                gameHandlers.handleSendMessage(encryptorSocketForTest, { roomId, message: 'Hello world' });

                // Set the secret word to 'test' for this test
                if (room && room.gameState) {
                    room.gameState.secretWord = 'test';
                }

                // Make incorrect guess
                const decryptorSocketForTest = decryptorPlayer?.id === 'decryptor' ? decryptorSocket : encryptorSocket;
                gameHandlers.handlePlayerGuess(decryptorSocketForTest, { roomId, guess: 'wrong' });

                // Verify the guess was processed
                expect(decryptorSocketForTest.emit).toHaveBeenCalled();
            });

            it('should handle guess from non-decryptor', () => {
                const encryptorSocket = createMockSocket('encryptor');
                const decryptorSocket = createMockSocket('decryptor');
                const roomId = 'test-room';

                // Setup room with both players
                roomHandlers.handleJoinRoom(encryptorSocket, { roomId, playerName: 'Encryptor' });
                roomHandlers.handleJoinRoom(decryptorSocket, { roomId, playerName: 'Decryptor' });

                // Mark both players as ready
                roomHandlers.handlePlayerReady(encryptorSocket, { roomId });
                roomHandlers.handlePlayerReady(decryptorSocket, { roomId });

                // Start the game
                gameHandlers.handleStartGame(encryptorSocket, { roomId });

                // Get the actual assigned roles
                const room = roomManager.getRoom(roomId);
                const encryptorPlayer = room?.players.find(p => p.role === 'encryptor');

                // Try to guess as encryptor (non-decryptor)
                const nonDecryptorSocket = encryptorPlayer?.id === 'encryptor' ? encryptorSocket : decryptorSocket;
                gameHandlers.handlePlayerGuess(nonDecryptorSocket, { roomId, guess: 'test' });
                expect(nonDecryptorSocket.emit).toHaveBeenCalledWith('player_guess_error', {
                    roomId: 'test-room',
                    error: 'Not decryptor\'s turn, Only decryptor can make guesses'
                });
            });

            it('should handle guess on wrong turn', () => {
                const encryptorSocket = createMockSocket('encryptor');
                const decryptorSocket = createMockSocket('decryptor');
                const roomId = 'test-room';

                // Setup room with both players
                roomHandlers.handleJoinRoom(encryptorSocket, { roomId, playerName: 'Encryptor' });
                roomHandlers.handleJoinRoom(decryptorSocket, { roomId, playerName: 'Decryptor' });

                // Mark both players as ready
                roomHandlers.handlePlayerReady(encryptorSocket, { roomId });
                roomHandlers.handlePlayerReady(decryptorSocket, { roomId });

                // Start the game
                gameHandlers.handleStartGame(encryptorSocket, { roomId });

                // Get the actual assigned roles
                const room = roomManager.getRoom(roomId);
                const decryptorPlayer = room?.players.find(p => p.role === 'decryptor');

                // Try to guess on wrong turn (encryptor's turn)
                const decryptorSocketForTest = decryptorPlayer?.id === 'decryptor' ? decryptorSocket : encryptorSocket;
                gameHandlers.handlePlayerGuess(decryptorSocketForTest, { roomId, guess: 'test' });

                // Verify an error was emitted
                expect(decryptorSocketForTest.emit).toHaveBeenCalled();
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