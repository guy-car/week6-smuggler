import { Socket } from 'socket.io';
import { GameStateManager } from '../src/game/state';
import { RoomManager } from '../src/rooms/manager';
import { GameHandlers } from '../src/socket/handlers/gameHandlers';
import { Player } from '../src/types';

// Mock Socket.IO
const mockSocket = {
    id: 'test-socket-id',
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    join: jest.fn()
} as unknown as Socket;

const mockIo = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn()
};

describe('GameHandlers', () => {
    let gameHandlers: GameHandlers;
    let roomManager: RoomManager;
    let gameStateManager: GameStateManager;

    beforeEach(() => {
        jest.clearAllMocks();
        roomManager = new RoomManager();
        gameStateManager = new GameStateManager();
        gameHandlers = new GameHandlers(roomManager, mockIo);
    });

    describe('handleStartGame', () => {
        it('should start game when room is ready', () => {
            // Arrange
            const roomId = 'test-room';
            const player1: Player = { id: 'player1', name: 'Player 1', ready: true, role: null, socketId: 'socket1' };
            const player2: Player = { id: 'player2', name: 'Player 2', ready: true, role: null, socketId: 'socket2' };

            // Join players to room
            roomManager.joinRoom(roomId, player1);
            roomManager.joinRoom(roomId, player2);

            // Act
            gameHandlers.handleStartGame(mockSocket, { roomId });

            // Assert
            expect(mockSocket.emit).toHaveBeenCalledWith('start_game', expect.objectContaining({
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
            gameHandlers.handleStartGame(mockSocket, {} as any);

            // Assert
            expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Room ID is required' });
        });

        it('should emit error when room is not found', () => {
            // Act
            gameHandlers.handleStartGame(mockSocket, { roomId: 'non-existent' });

            // Assert
            expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Room not found' });
        });

        it('should emit error when room is not ready', () => {
            // Arrange
            const roomId = 'test-room';
            const player: Player = { id: 'player1', name: 'Player 1', ready: false, role: null, socketId: 'socket1' };
            roomManager.joinRoom(roomId, player);

            // Act
            gameHandlers.handleStartGame(mockSocket, { roomId });

            // Assert
            expect(mockSocket.emit).toHaveBeenCalledWith('start_game_error', {
                roomId,
                error: 'Room is not ready to start'
            });
        });
    });

    describe('handleSendMessage', () => {
        it('should handle message from encryptor', () => {
            // Arrange
            const roomId = 'test-room';
            const encryptor: Player = { id: 'encryptor', name: 'Encryptor', ready: true, role: 'encryptor', socketId: mockSocket.id };
            const decryptor: Player = { id: 'decryptor', name: 'Decryptor', ready: true, role: 'decryptor', socketId: 'socket2' };

            roomManager.joinRoom(roomId, encryptor);
            roomManager.joinRoom(roomId, decryptor);

            // Start game
            const room = roomManager.getRoom(roomId);
            if (room) {
                room.gameState = gameStateManager.createGameState('test', [encryptor, decryptor]);
            }

            // Act
            gameHandlers.handleSendMessage(mockSocket, { roomId, message: 'Hello world' });

            // Assert
            expect(mockSocket.emit).toHaveBeenCalledWith('message_sent', expect.objectContaining({
                roomId,
                message: expect.objectContaining({
                    content: 'Hello world',
                    senderId: mockSocket.id
                })
            }));
        });

        it('should emit error when not encryptor turn', () => {
            // Arrange
            const roomId = 'test-room';
            const encryptor: Player = { id: 'encryptor', name: 'Encryptor', ready: true, role: 'encryptor', socketId: mockSocket.id };
            const decryptor: Player = { id: 'decryptor', name: 'Decryptor', ready: true, role: 'decryptor', socketId: 'socket2' };

            roomManager.joinRoom(roomId, encryptor);
            roomManager.joinRoom(roomId, decryptor);

            // Start game and set turn to decryptor
            const room = roomManager.getRoom(roomId);
            if (room) {
                room.gameState = gameStateManager.createGameState('test', [encryptor, decryptor]);
                room.gameState.currentTurn = 'decryptor';
            }

            // Act
            gameHandlers.handleSendMessage(mockSocket, { roomId, message: 'Hello world' });

            // Assert
            expect(mockSocket.emit).toHaveBeenCalledWith('send_message_error', {
                roomId,
                error: 'Not your turn to send a message'
            });
        });

        it('should emit error when not the encryptor', () => {
            // Arrange
            const roomId = 'test-room';
            const encryptor: Player = { id: 'encryptor', name: 'Encryptor', ready: true, role: 'encryptor', socketId: 'socket1' };
            const decryptor: Player = { id: 'decryptor', name: 'Decryptor', ready: true, role: 'decryptor', socketId: mockSocket.id };

            roomManager.joinRoom(roomId, encryptor);
            roomManager.joinRoom(roomId, decryptor);

            // Start game
            const room = roomManager.getRoom(roomId);
            if (room) {
                room.gameState = gameStateManager.createGameState('test', [encryptor, decryptor]);
            }

            // Act
            gameHandlers.handleSendMessage(mockSocket, { roomId, message: 'Hello world' });

            // Assert
            expect(mockSocket.emit).toHaveBeenCalledWith('send_message_error', {
                roomId,
                error: 'Only the encryptor can send messages'
            });
        });
    });

    describe('handlePlayerGuess', () => {
        it('should handle correct guess from decryptor', () => {
            // Arrange
            const roomId = 'test-room';
            const encryptor: Player = { id: 'encryptor', name: 'Encryptor', ready: true, role: 'encryptor', socketId: 'socket1' };
            const decryptor: Player = { id: 'decryptor', name: 'Decryptor', ready: true, role: 'decryptor', socketId: mockSocket.id };

            roomManager.joinRoom(roomId, encryptor);
            roomManager.joinRoom(roomId, decryptor);

            // Start game and set turn to decryptor
            const room = roomManager.getRoom(roomId);
            if (room) {
                room.gameState = gameStateManager.createGameState('test', [encryptor, decryptor]);
                room.gameState.currentTurn = 'decryptor';
            }

            // Act
            gameHandlers.handlePlayerGuess(mockSocket, { roomId, guess: 'test' });

            // Assert
            expect(mockSocket.emit).toHaveBeenCalledWith('guess_result', expect.objectContaining({
                roomId,
                correct: true,
                guess: 'test'
            }));
        });

        it('should handle incorrect guess from decryptor', () => {
            // Arrange
            const roomId = 'test-room';
            const encryptor: Player = { id: 'encryptor', name: 'Encryptor', ready: true, role: 'encryptor', socketId: 'socket1' };
            const decryptor: Player = { id: 'decryptor', name: 'Decryptor', ready: true, role: 'decryptor', socketId: mockSocket.id };

            roomManager.joinRoom(roomId, encryptor);
            roomManager.joinRoom(roomId, decryptor);

            // Start game and set turn to decryptor
            const room = roomManager.getRoom(roomId);
            if (room) {
                room.gameState = gameStateManager.createGameState('test', [encryptor, decryptor]);
                room.gameState.currentTurn = 'decryptor';
            }

            // Act
            gameHandlers.handlePlayerGuess(mockSocket, { roomId, guess: 'wrong' });

            // Assert
            expect(mockSocket.emit).toHaveBeenCalledWith('guess_result', expect.objectContaining({
                roomId,
                correct: false,
                guess: 'wrong'
            }));
        });

        it('should emit error when not decryptor turn', () => {
            // Arrange
            const roomId = 'test-room';
            const encryptor: Player = { id: 'encryptor', name: 'Encryptor', ready: true, role: 'encryptor', socketId: mockSocket.id };
            const decryptor: Player = { id: 'decryptor', name: 'Decryptor', ready: true, role: 'decryptor', socketId: 'socket2' };

            roomManager.joinRoom(roomId, encryptor);
            roomManager.joinRoom(roomId, decryptor);

            // Start game (encryptor's turn)
            const room = roomManager.getRoom(roomId);
            if (room) {
                room.gameState = gameStateManager.createGameState('test', [encryptor, decryptor]);
            }

            // Act
            gameHandlers.handlePlayerGuess(mockSocket, { roomId, guess: 'test' });

            // Assert
            expect(mockSocket.emit).toHaveBeenCalledWith('player_guess_error', {
                roomId,
                error: 'Not your turn to guess'
            });
        });

        it('should emit error when not the decryptor', () => {
            // Arrange
            const roomId = 'test-room';
            const encryptor: Player = { id: 'encryptor', name: 'Encryptor', ready: true, role: 'encryptor', socketId: mockSocket.id };
            const decryptor: Player = { id: 'decryptor', name: 'Decryptor', ready: true, role: 'decryptor', socketId: 'socket2' };

            roomManager.joinRoom(roomId, encryptor);
            roomManager.joinRoom(roomId, decryptor);

            // Start game and set turn to decryptor
            const room = roomManager.getRoom(roomId);
            if (room) {
                room.gameState = gameStateManager.createGameState('test', [encryptor, decryptor]);
                room.gameState.currentTurn = 'decryptor';
            }

            // Act
            gameHandlers.handlePlayerGuess(mockSocket, { roomId, guess: 'test' });

            // Assert
            expect(mockSocket.emit).toHaveBeenCalledWith('player_guess_error', {
                roomId,
                error: 'Only the decryptor can make guesses'
            });
        });
    });

    describe('Game end conditions', () => {
        it('should end game when score reaches 10', () => {
            // Arrange
            const roomId = 'test-room';
            const encryptor: Player = { id: 'encryptor', name: 'Encryptor', ready: true, role: 'encryptor', socketId: 'socket1' };
            const decryptor: Player = { id: 'decryptor', name: 'Decryptor', ready: true, role: 'decryptor', socketId: mockSocket.id };

            roomManager.joinRoom(roomId, encryptor);
            roomManager.joinRoom(roomId, decryptor);

            // Start game with score 9 and set turn to decryptor
            const room = roomManager.getRoom(roomId);
            if (room) {
                room.gameState = gameStateManager.createGameState('test', [encryptor, decryptor]);
                room.gameState.score = 9;
                room.gameState.currentTurn = 'decryptor';
            }

            // Act
            gameHandlers.handlePlayerGuess(mockSocket, { roomId, guess: 'test' });

            // Assert
            expect(mockSocket.emit).toHaveBeenCalledWith('game_end', expect.objectContaining({
                roomId,
                winner: 'players',
                finalScore: 10
            }));
        });

        it('should end game when score reaches 0', () => {
            // Arrange
            const roomId = 'test-room';
            const encryptor: Player = { id: 'encryptor', name: 'Encryptor', ready: true, role: 'encryptor', socketId: 'socket1' };
            const decryptor: Player = { id: 'decryptor', name: 'Decryptor', ready: true, role: 'decryptor', socketId: mockSocket.id };

            roomManager.joinRoom(roomId, encryptor);
            roomManager.joinRoom(roomId, decryptor);

            // Start game with score 1 and set turn to decryptor
            const room = roomManager.getRoom(roomId);
            if (room) {
                room.gameState = gameStateManager.createGameState('test', [encryptor, decryptor]);
                room.gameState.score = 1;
                room.gameState.currentTurn = 'decryptor';
            }

            // Act
            gameHandlers.handlePlayerGuess(mockSocket, { roomId, guess: 'wrong' });

            // Assert
            expect(mockSocket.emit).toHaveBeenCalledWith('game_end', expect.objectContaining({
                roomId,
                winner: 'ai',
                finalScore: 0
            }));
        });
    });
}); 