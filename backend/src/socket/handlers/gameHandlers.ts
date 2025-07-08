import { Socket } from 'socket.io';
import { MockAIService } from '../../ai/mock';
import { GameLogic } from '../../game/logic';
import { GameStateManager } from '../../game/state';
import { WordManager } from '../../game/wordManager';
import { RoomManager } from '../../rooms/manager';
import { GameStartData } from '../../types';

export class GameHandlers {
    private roomManager: RoomManager;
    private gameStateManager: GameStateManager;
    private wordManager: WordManager;
    private aiService: MockAIService;
    private gameLogic: GameLogic;
    private io: any;

    constructor(roomManager: RoomManager, io: any) {
        this.roomManager = roomManager;
        this.gameStateManager = new GameStateManager();
        this.wordManager = new WordManager();
        this.aiService = new MockAIService();
        this.gameLogic = new GameLogic();
        this.io = io;
    }

    /**
     * Handle start_game event - starts the game when both players are ready
     */
    public handleStartGame = (socket: Socket, data: { roomId: string }) => {
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

            // Check if room is ready to start
            if (!this.roomManager.isRoomReady(roomId)) {
                socket.emit('start_game_error', {
                    roomId,
                    error: 'Room is not ready to start'
                });
                return;
            }

            // Select a secret word
            const secretWord = this.wordManager.selectRandomWord();

            // Assign roles to players
            const roles = this.gameStateManager.assignRoles(room.players);

            // Create game state
            const gameState = this.gameStateManager.createGameState(secretWord, room.players);

            // Update room with game state
            room.gameState = gameState;

            // Update player roles in the room
            room.players.forEach(player => {
                if (roles.encryptor === player.id) {
                    player.role = 'encryptor';
                } else if (roles.decryptor === player.id) {
                    player.role = 'decryptor';
                }
            });

            // Prepare game start data
            const gameStartData: GameStartData = {
                roomId,
                players: room.players,
                roles,
                secretWord
            };

            // Emit to all players in the room
            socket.to(roomId).emit('start_game', gameStartData);
            socket.emit('start_game', gameStartData);

            console.log(`Game started in room ${roomId} with word: ${secretWord}`);
        } catch (error) {
            console.error('Error in handleStartGame:', error);
            socket.emit('error', { message: 'Internal server error' });
        }
    };

    /**
     * Handle send_message event - encryptor sends a message
     */
    public handleSendMessage = (socket: Socket, data: { roomId: string; message: string }) => {
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

            // Get current roles
            const roles = {
                encryptor: room.players.find(p => p.role === 'encryptor')!.id,
                decryptor: room.players.find(p => p.role === 'decryptor')!.id
            };

            // Validate turn order
            const turnValidation = this.gameLogic.validateTurnOrder(
                room.gameState,
                socket.id,
                'send_message',
                roles
            );

            if (!turnValidation.valid) {
                socket.emit('send_message_error', {
                    roomId,
                    error: turnValidation.errors.join(', ')
                });
                return;
            }

            // Validate conversation flow
            const flowValidation = this.gameLogic.validateConversationFlow(room.gameState);
            if (!flowValidation.valid && room.gameState.conversationHistory.length > 0) {
                socket.emit('send_message_error', {
                    roomId,
                    error: flowValidation.errors.join(', ')
                });
                return;
            }

            // Validate game state consistency
            const consistencyValidation = this.gameLogic.validateGameStateConsistency(room.gameState);
            if (!consistencyValidation.valid) {
                socket.emit('send_message_error', {
                    roomId,
                    error: 'Game state is inconsistent: ' + consistencyValidation.errors.join(', ')
                });
                return;
            }

            // Add message to conversation history
            const updatedGameState = this.gameStateManager.addMessage(room.gameState, {
                content: message,
                senderId: socket.id
            });

            // Advance turn to AI
            const nextGameState = this.gameStateManager.advanceTurn(updatedGameState);

            // Update room game state
            room.gameState = nextGameState;

            // Broadcast message to all players in the room
            const messageData = {
                roomId,
                message: {
                    id: updatedGameState.conversationHistory[updatedGameState.conversationHistory.length - 1]!.id,
                    content: message,
                    senderId: socket.id,
                    timestamp: new Date()
                },
                currentTurn: nextGameState.currentTurn
            };

            socket.to(roomId).emit('message_received', messageData);
            socket.emit('message_sent', messageData);

            // Trigger AI response after a short delay
            setTimeout(() => {
                this.handleAIResponse(roomId);
            }, 1000);

            console.log(`Message sent in room ${roomId}: ${message}`);
        } catch (error) {
            console.error('Error in handleSendMessage:', error);
            socket.emit('error', { message: 'Internal server error' });
        }
    };

    /**
     * Handle player_guess event - decryptor attempts to guess the secret word
     */
    public handlePlayerGuess = (socket: Socket, data: { roomId: string; guess: string }) => {
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

            // Get current roles
            const roles = {
                encryptor: room.players.find(p => p.role === 'encryptor')!.id,
                decryptor: room.players.find(p => p.role === 'decryptor')!.id
            };

            // Validate turn order
            const turnValidation = this.gameLogic.validateTurnOrder(
                room.gameState,
                socket.id,
                'guess',
                roles
            );

            if (!turnValidation.valid) {
                socket.emit('player_guess_error', {
                    roomId,
                    error: turnValidation.errors.join(', ')
                });
                return;
            }

            // Validate conversation flow
            const flowValidation = this.gameLogic.validateConversationFlow(room.gameState);
            if (!flowValidation.valid) {
                socket.emit('player_guess_error', {
                    roomId,
                    error: flowValidation.errors.join(', ')
                });
                return;
            }

            // Validate game state consistency
            const consistencyValidation = this.gameLogic.validateGameStateConsistency(room.gameState);
            if (!consistencyValidation.valid) {
                socket.emit('player_guess_error', {
                    roomId,
                    error: 'Game state is inconsistent: ' + consistencyValidation.errors.join(', ')
                });
                return;
            }

            // Validate the guess using Levenshtein distance
            const isCorrect = this.gameStateManager.validateGuess(guess, room.gameState.secretWord);

            // Update score
            const updatedGameState = this.gameStateManager.updateScore(room.gameState, isCorrect);

            // Check if game has ended
            const gameEnded = this.gameStateManager.isGameEnded(updatedGameState);
            const winner = this.gameStateManager.getGameWinner(updatedGameState);

            if (gameEnded) {
                // End the game
                const finalGameState = this.gameStateManager.endGame(updatedGameState);
                room.gameState = finalGameState;

                // Emit game end event
                const gameEndData = {
                    roomId,
                    winner,
                    finalScore: finalGameState.score,
                    correct: isCorrect
                };

                socket.to(roomId).emit('game_end', gameEndData);
                socket.emit('game_end', gameEndData);
            } else {
                // Advance to next round
                const nextRoundState = this.gameStateManager.advanceRound(updatedGameState);

                // Switch roles
                const newRoles = this.gameStateManager.switchRoles(room.players, {
                    encryptor: room.players.find(p => p.role === 'encryptor')!.id,
                    decryptor: room.players.find(p => p.role === 'decryptor')!.id
                });

                // Update player roles
                room.players.forEach(player => {
                    if (newRoles.encryptor === player.id) {
                        player.role = 'encryptor';
                    } else if (newRoles.decryptor === player.id) {
                        player.role = 'decryptor';
                    }
                });

                // Select new secret word
                const newSecretWord = this.wordManager.selectRandomWord();
                nextRoundState.secretWord = newSecretWord;

                room.gameState = nextRoundState;

                // Emit round end event
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

            // Emit guess result
            const guessResultData = {
                roomId,
                correct: isCorrect,
                guess,
                score: updatedGameState.score
            };

            socket.to(roomId).emit('guess_result', guessResultData);
            socket.emit('guess_result', guessResultData);

            console.log(`Guess made in room ${roomId}: ${guess} (correct: ${isCorrect})`);
        } catch (error) {
            console.error('Error in handlePlayerGuess:', error);
            socket.emit('error', { message: 'Internal server error' });
        }
    };

    /**
     * Handle player reconnection
     */
    public handlePlayerReconnect = (socket: Socket, data: { roomId: string; playerId: string }) => {
        try {
            const { roomId, playerId } = data;

            if (!roomId || !playerId) {
                socket.emit('error', { message: 'Room ID and player ID are required' });
                return;
            }

            const room = this.roomManager.getRoom(roomId);
            if (!room) {
                socket.emit('reconnect_error', {
                    roomId,
                    error: 'Room not found'
                });
                return;
            }

            // Find the player
            const player = room.players.find(p => p.id === playerId);
            if (!player) {
                socket.emit('reconnect_error', {
                    roomId,
                    error: 'Player not found in room'
                });
                return;
            }

            // Update player's socket ID
            player.socketId = socket.id;

            // If game is active, check if player can rejoin
            if (room.gameState) {
                const roles = {
                    encryptor: room.players.find(p => p.role === 'encryptor')!.id,
                    decryptor: room.players.find(p => p.role === 'decryptor')!.id
                };

                const canRejoin = this.gameStateManager.canPlayerRejoin(
                    room.gameState,
                    playerId,
                    roles
                );

                if (!canRejoin.canRejoin) {
                    socket.emit('reconnect_error', {
                        roomId,
                        error: canRejoin.reason || 'Cannot rejoin game'
                    });
                    return;
                }

                // Get game state summary for rejoining player
                const gameSummary = this.gameStateManager.getGameStateSummary(room.gameState);

                // Emit reconnection success with game state
                const reconnectData = {
                    roomId,
                    playerId,
                    gameState: gameSummary,
                    role: player.role,
                    players: room.players
                };

                socket.emit('player_reconnected', reconnectData);
                socket.to(roomId).emit('player_rejoined', {
                    roomId,
                    playerId,
                    playerName: player.name
                });

                console.log(`Player ${playerId} reconnected to room ${roomId}`);
            } else {
                // Game not started yet, just rejoin room
                socket.emit('player_reconnected', {
                    roomId,
                    playerId,
                    players: room.players
                });
                socket.to(roomId).emit('player_rejoined', {
                    roomId,
                    playerId,
                    playerName: player.name
                });

                console.log(`Player ${playerId} reconnected to room ${roomId} (no active game)`);
            }
        } catch (error) {
            console.error('Error in handlePlayerReconnect:', error);
            socket.emit('error', { message: 'Internal server error' });
        }
    };

    /**
     * Handle AI response generation
     */
    private handleAIResponse = async (roomId: string) => {
        try {
            const room = this.roomManager.getRoom(roomId);
            if (!room || !room.gameState) {
                return;
            }

            // Check if it's AI's turn
            if (room.gameState.currentTurn !== 'ai') {
                return;
            }

            // Create game context for AI
            const gameContext = {
                currentRound: room.gameState.currentRound,
                score: room.gameState.score,
                gameStatus: room.gameState.gameStatus,
                previousGuesses: room.gameState.aiGuesses.map(guess => guess.guess)
            };

            // Generate AI response using the comprehensive service
            const aiResponse = await this.aiService.analyzeConversation(
                room.gameState.conversationHistory,
                room.gameState.secretWord,
                gameContext
            );

            // Add AI guess to game state
            const updatedGameState = this.gameStateManager.addAIGuess(room.gameState, {
                thinking: aiResponse.thinking,
                guess: aiResponse.guess,
                confidence: 0.5 // Default confidence since it's no longer part of AI response
            });

            // Advance turn to decryptor
            const nextGameState = this.gameStateManager.advanceTurn(updatedGameState);

            // Update room game state
            room.gameState = nextGameState;

            // Broadcast AI response to all players
            const aiResponseData = {
                roomId,
                thinking: aiResponse.thinking,
                guess: aiResponse.guess,
                confidence: 0.5, // Default confidence
                currentTurn: nextGameState.currentTurn
            };

            // Emit to all players in the room
            this.io.to(roomId).emit('ai_response', aiResponseData);

            console.log(`AI response generated in room ${roomId}: ${aiResponse.guess}`);
        } catch (error) {
            console.error('Error in handleAIResponse:', error);

            // Fallback to simple mock response if AI service fails
            this.handleAIFallback(roomId);
        }
    };

    /**
     * Fallback AI response when main AI service fails
     */
    private handleAIFallback = (roomId: string) => {
        try {
            const room = this.roomManager.getRoom(roomId);
            if (!room || !room.gameState) {
                return;
            }

            // Simple fallback response
            const thinking = ["Analyzing conversation...", "Processing clues..."];
            const availableWords = this.wordManager.getAllWords();
            const guess = availableWords[Math.floor(Math.random() * availableWords.length)]!;
            const confidence = 0.5;

            // Add AI guess to game state
            const updatedGameState = this.gameStateManager.addAIGuess(room.gameState, {
                thinking,
                guess,
                confidence
            });

            // Advance turn to decryptor
            const nextGameState = this.gameStateManager.advanceTurn(updatedGameState);

            // Update room game state
            room.gameState = nextGameState;

            // Broadcast fallback AI response
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
        } catch (error) {
            console.error('Error in handleAIFallback:', error);
        }
    };
} 