"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameHandlers = void 0;
const mock_1 = require("../../ai/mock");
const state_1 = require("../../game/state");
const wordManager_1 = require("../../game/wordManager");
class GameHandlers {
    constructor(roomManager, io) {
        this.handleStartGame = (socket, data) => {
            try {
                const { roomId } = data;
                if (!roomId) {
                    socket.emit('error', { message: 'Room ID is required' });
                    return;
                }
                const room = this.roomManager.getRoom(roomId);
                if (!room) {
                    socket.emit('error', { message: 'Room not found' });
                    return;
                }
                if (!this.roomManager.isRoomReady(roomId)) {
                    socket.emit('start_game_error', {
                        roomId,
                        error: 'Room is not ready to start'
                    });
                    return;
                }
                const secretWord = this.wordManager.selectRandomWord();
                const roles = this.gameStateManager.assignRoles(room.players);
                const gameState = this.gameStateManager.createGameState(secretWord, room.players);
                room.gameState = gameState;
                room.players.forEach(player => {
                    if (roles.encryptor === player.id) {
                        player.role = 'encryptor';
                    }
                    else if (roles.decryptor === player.id) {
                        player.role = 'decryptor';
                    }
                });
                const gameStartData = {
                    roomId,
                    players: room.players,
                    roles,
                    secretWord
                };
                socket.to(roomId).emit('start_game', gameStartData);
                socket.emit('start_game', gameStartData);
                console.log(`Game started in room ${roomId} with word: ${secretWord}`);
            }
            catch (error) {
                console.error('Error in handleStartGame:', error);
                socket.emit('error', { message: 'Internal server error' });
            }
        };
        this.handleSendMessage = (socket, data) => {
            try {
                const { roomId, message } = data;
                if (!roomId || !message) {
                    socket.emit('error', { message: 'Room ID and message are required' });
                    return;
                }
                const room = this.roomManager.getRoom(roomId);
                if (!room || !room.gameState) {
                    socket.emit('error', { message: 'Game not found or not started' });
                    return;
                }
                if (room.gameState.currentTurn !== 'encryptor') {
                    socket.emit('send_message_error', {
                        roomId,
                        error: 'Not your turn to send a message'
                    });
                    return;
                }
                const encryptor = room.players.find(p => p.role === 'encryptor');
                if (!encryptor || encryptor.socketId !== socket.id) {
                    socket.emit('send_message_error', {
                        roomId,
                        error: 'Only the encryptor can send messages'
                    });
                    return;
                }
                const updatedGameState = this.gameStateManager.addMessage(room.gameState, {
                    content: message,
                    senderId: socket.id
                });
                const nextGameState = this.gameStateManager.advanceTurn(updatedGameState);
                room.gameState = nextGameState;
                const messageData = {
                    roomId,
                    message: {
                        id: updatedGameState.conversationHistory[updatedGameState.conversationHistory.length - 1].id,
                        content: message,
                        senderId: socket.id,
                        timestamp: new Date()
                    },
                    currentTurn: nextGameState.currentTurn
                };
                socket.to(roomId).emit('message_received', messageData);
                socket.emit('message_sent', messageData);
                setTimeout(() => {
                    this.handleAIResponse(roomId);
                }, 1000);
                console.log(`Message sent in room ${roomId}: ${message}`);
            }
            catch (error) {
                console.error('Error in handleSendMessage:', error);
                socket.emit('error', { message: 'Internal server error' });
            }
        };
        this.handlePlayerGuess = (socket, data) => {
            try {
                const { roomId, guess } = data;
                if (!roomId || !guess) {
                    socket.emit('error', { message: 'Room ID and guess are required' });
                    return;
                }
                const room = this.roomManager.getRoom(roomId);
                if (!room || !room.gameState) {
                    socket.emit('error', { message: 'Game not found or not started' });
                    return;
                }
                if (room.gameState.currentTurn !== 'decryptor') {
                    socket.emit('player_guess_error', {
                        roomId,
                        error: 'Not your turn to guess'
                    });
                    return;
                }
                const decryptor = room.players.find(p => p.role === 'decryptor');
                if (!decryptor || decryptor.socketId !== socket.id) {
                    socket.emit('player_guess_error', {
                        roomId,
                        error: 'Only the decryptor can make guesses'
                    });
                    return;
                }
                const isCorrect = this.gameStateManager.validateGuess(guess, room.gameState.secretWord);
                const updatedGameState = this.gameStateManager.updateScore(room.gameState, isCorrect);
                const gameEnded = this.gameStateManager.isGameEnded(updatedGameState);
                const winner = this.gameStateManager.getGameWinner(updatedGameState);
                if (gameEnded) {
                    const finalGameState = this.gameStateManager.endGame(updatedGameState);
                    room.gameState = finalGameState;
                    const gameEndData = {
                        roomId,
                        winner,
                        finalScore: finalGameState.score,
                        correct: isCorrect
                    };
                    socket.to(roomId).emit('game_end', gameEndData);
                    socket.emit('game_end', gameEndData);
                }
                else {
                    const nextRoundState = this.gameStateManager.advanceRound(updatedGameState);
                    const newRoles = this.gameStateManager.switchRoles(room.players, {
                        encryptor: room.players.find(p => p.role === 'encryptor').id,
                        decryptor: room.players.find(p => p.role === 'decryptor').id
                    });
                    room.players.forEach(player => {
                        if (newRoles.encryptor === player.id) {
                            player.role = 'encryptor';
                        }
                        else if (newRoles.decryptor === player.id) {
                            player.role = 'decryptor';
                        }
                    });
                    const newSecretWord = this.wordManager.selectRandomWord();
                    nextRoundState.secretWord = newSecretWord;
                    room.gameState = nextRoundState;
                    const roundEndData = {
                        roomId,
                        correct: isCorrect,
                        score: nextRoundState.score,
                        gameEnded: false,
                        newRoles,
                        newSecretWord
                    };
                    socket.to(roomId).emit('round_end', roundEndData);
                    socket.emit('round_end', roundEndData);
                }
                const guessResultData = {
                    roomId,
                    correct: isCorrect,
                    guess,
                    score: updatedGameState.score
                };
                socket.to(roomId).emit('guess_result', guessResultData);
                socket.emit('guess_result', guessResultData);
                console.log(`Guess made in room ${roomId}: ${guess} (correct: ${isCorrect})`);
            }
            catch (error) {
                console.error('Error in handlePlayerGuess:', error);
                socket.emit('error', { message: 'Internal server error' });
            }
        };
        this.handleAIResponse = async (roomId) => {
            try {
                const room = this.roomManager.getRoom(roomId);
                if (!room || !room.gameState) {
                    return;
                }
                if (room.gameState.currentTurn !== 'ai') {
                    return;
                }
                const gameContext = {
                    currentRound: room.gameState.currentRound,
                    score: room.gameState.score,
                    gameStatus: room.gameState.gameStatus,
                    previousGuesses: room.gameState.aiGuesses.map(guess => guess.guess)
                };
                const aiResponse = await this.aiService.analyzeConversation(room.gameState.conversationHistory, room.gameState.secretWord, gameContext);
                const updatedGameState = this.gameStateManager.addAIGuess(room.gameState, {
                    thinking: aiResponse.thinking,
                    guess: aiResponse.guess,
                    confidence: 0.5
                });
                const nextGameState = this.gameStateManager.advanceTurn(updatedGameState);
                room.gameState = nextGameState;
                const aiResponseData = {
                    roomId,
                    thinking: aiResponse.thinking,
                    guess: aiResponse.guess,
                    confidence: 0.5,
                    currentTurn: nextGameState.currentTurn
                };
                this.io.to(roomId).emit('ai_response', aiResponseData);
                console.log(`AI response generated in room ${roomId}: ${aiResponse.guess}`);
            }
            catch (error) {
                console.error('Error in handleAIResponse:', error);
                this.handleAIFallback(roomId);
            }
        };
        this.handleAIFallback = (roomId) => {
            try {
                const room = this.roomManager.getRoom(roomId);
                if (!room || !room.gameState) {
                    return;
                }
                const thinking = ["Analyzing conversation...", "Processing clues..."];
                const availableWords = this.wordManager.getAllWords();
                const guess = availableWords[Math.floor(Math.random() * availableWords.length)];
                const confidence = 0.5;
                const updatedGameState = this.gameStateManager.addAIGuess(room.gameState, {
                    thinking,
                    guess,
                    confidence
                });
                const nextGameState = this.gameStateManager.advanceTurn(updatedGameState);
                room.gameState = nextGameState;
                const aiResponseData = {
                    roomId,
                    thinking,
                    guess,
                    confidence,
                    reasoning: "Fallback response due to AI service error",
                    currentTurn: nextGameState.currentTurn
                };
                this.io.to(roomId).emit('ai_response', aiResponseData);
                console.log(`AI fallback response generated in room ${roomId}: ${guess}`);
            }
            catch (error) {
                console.error('Error in handleAIFallback:', error);
            }
        };
        this.roomManager = roomManager;
        this.gameStateManager = new state_1.GameStateManager();
        this.wordManager = new wordManager_1.WordManager();
        this.aiService = new mock_1.MockAIService();
        this.io = io;
    }
}
exports.GameHandlers = GameHandlers;
//# sourceMappingURL=gameHandlers.js.map