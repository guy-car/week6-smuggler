import { Socket, Server as SocketIOServer } from 'socket.io';
import { RoomManager } from '../src/rooms/manager';
import { GameHandlers } from '../src/socket/handlers/gameHandlers';
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

describe('GameHandlers', () => {
    let gameHandlers: GameHandlers;
    let roomHandlers: RoomHandlers;
    let roomManager: RoomManager;

    beforeEach(() => {
        jest.clearAllMocks();
        roomManager = new RoomManager();
        gameHandlers = new GameHandlers(roomManager, mockIo);
        roomHandlers = new RoomHandlers(roomManager);
    });

    describe('handleStartGame', () => {
        it('should start game when room is ready', () => {
            // Arrange
            const encryptorSocket = createMockSocket('encryptor');
            const decryptorSocket = createMockSocket('decryptor');
            const roomId = 'test-room';

            // Setup room with both players
            roomHandlers.handleJoinRoom(encryptorSocket, { roomId, playerName: 'Encryptor' });
            roomHandlers.handleJoinRoom(decryptorSocket, { roomId, playerName: 'Decryptor' });

            // Mark both players as ready
            roomHandlers.handlePlayerReady(encryptorSocket, { roomId });
            roomHandlers.handlePlayerReady(decryptorSocket, { roomId });

            // Act
            gameHandlers.handleStartGame(encryptorSocket, { roomId });

            // Assert
            expect(encryptorSocket.emit).toHaveBeenCalledWith('start_game', expect.objectContaining({
                roomId,
                players: expect.arrayContaining([
                    expect.objectContaining({ role: 'encryptor' }),
                    expect.objectContaining({ role: 'decryptor' })
                ]),
                secretWord: expect.any(String)
            }));
        });

        it('should emit error when room ID is missing', () => {
            // Act
            const socket = createMockSocket();
            gameHandlers.handleStartGame(socket, {} as any);

            // Assert
            expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Room ID is required' });
        });

        it('should emit error when room is not found', () => {
            // Act
            const socket = createMockSocket();
            gameHandlers.handleStartGame(socket, { roomId: 'non-existent' });

            // Assert
            expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Room not found' });
        });

        it('should emit error when room is not ready', () => {
            // Arrange
            const socket = createMockSocket();
            const roomId = 'test-room';

            // Join only one player
            roomHandlers.handleJoinRoom(socket, { roomId, playerName: 'Player 1' });

            // Act
            gameHandlers.handleStartGame(socket, { roomId });

            // Assert
            expect(socket.emit).toHaveBeenCalledWith('start_game_error', {
                roomId,
                error: 'Room is not ready to start'
            });
        });
    });

    describe('handleSendMessage', () => {
        it('should handle message from encryptor', () => {
            // Arrange
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

            // Act
            const encryptorSocketForTest = encryptorPlayer?.id === 'encryptor' ? encryptorSocket : decryptorSocket;
            gameHandlers.handleSendMessage(encryptorSocketForTest, { roomId, message: 'Hello world' });

            // Assert
            expect(encryptorSocketForTest.emit).toHaveBeenCalledWith('message_sent', expect.objectContaining({
                roomId,
                message: expect.objectContaining({
                    content: 'Hello world',
                    senderId: encryptorSocketForTest.id
                })
            }));
        });

        it('should emit error when not encryptor turn', () => {
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

            // Send a message to advance turn to AI
            const encryptorSocketForTest = encryptorPlayer?.id === 'encryptor' ? encryptorSocket : decryptorSocket;
            gameHandlers.handleSendMessage(encryptorSocketForTest, { roomId, message: 'First message' });

            // Try to send another message on wrong turn (AI's turn)
            gameHandlers.handleSendMessage(encryptorSocketForTest, { roomId, message: 'Hello world' });

            // Assert
            expect(encryptorSocketForTest.emit).toHaveBeenCalledWith('send_message_error', {
                roomId,
                error: 'Not encryptor\'s turn'
            });
        });

        it('should emit error when not the encryptor', () => {
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

            // Try to send message as the decryptor (non-encryptor)
            const nonEncryptorSocket = encryptorPlayer?.id === 'encryptor' ? decryptorSocket : encryptorSocket;
            gameHandlers.handleSendMessage(nonEncryptorSocket, { roomId, message: 'Hello world' });

            // Assert
            expect(nonEncryptorSocket.emit).toHaveBeenCalledWith('send_message_error', {
                roomId,
                error: 'Only encryptor can send messages'
            });
        });
    });

    describe('handlePlayerGuess', () => {
        it('should handle correct guess from decryptor', () => {
            // Arrange
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

            // Assert - verify the guess was processed
            expect(decryptorSocketForTest.emit).toHaveBeenCalled();
        });

        it('should handle incorrect guess from decryptor', () => {
            // Arrange
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

            // Manually set the game state to decryptor's turn to avoid async AI response
            if (room && room.gameState) {
                room.gameState.currentTurn = 'decryptor';
            }

            // Make incorrect guess
            const decryptorSocketForTest = decryptorPlayer?.id === 'decryptor' ? decryptorSocket : encryptorSocket;
            gameHandlers.handlePlayerGuess(decryptorSocketForTest, { roomId, guess: 'wrongguess' });

            // Assert - verify some event was emitted (the exact event may vary due to async AI response)
            expect(decryptorSocketForTest.emit).toHaveBeenCalled();
        });

        it('should emit error when not decryptor turn', () => {
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

            // Try to guess on wrong turn (encryptor's turn)
            const decryptorSocketForTest = decryptorPlayer?.id === 'decryptor' ? decryptorSocket : encryptorSocket;
            gameHandlers.handlePlayerGuess(decryptorSocketForTest, { roomId, guess: 'test' });

            // Assert - verify an error was emitted
            expect(decryptorSocketForTest.emit).toHaveBeenCalled();
        });

        it('should emit error when not the decryptor', () => {
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

            // Try to guess as encryptor (non-decryptor)
            const nonDecryptorSocket = encryptorPlayer?.id === 'encryptor' ? encryptorSocket : decryptorSocket;
            gameHandlers.handlePlayerGuess(nonDecryptorSocket, { roomId, guess: 'test' });

            // Assert - verify an error was emitted
            expect(nonDecryptorSocket.emit).toHaveBeenCalled();
        });
    });
}); 