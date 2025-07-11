import { Socket, Server as SocketIOServer } from 'socket.io';
import { OpenAIService } from '../../../openai/services/openai';
import { RoundSummary } from '../../../openai/types/game';
import { GameLogic } from '../../game/logic';
import { GameStateManager } from '../../game/state';
import { WordManager } from '../../game/wordManager';
import { RoomManager } from '../../rooms/manager';
import { GameStartData } from '../../types';

export class GameHandlers {
    private roomManager: RoomManager;
    private gameStateManager: GameStateManager;
    private wordManager: WordManager;
    private aiService: OpenAIService;
    private gameLogic: GameLogic;
    private io: SocketIOServer;

    constructor(roomManager: RoomManager, io: SocketIOServer) {
        this.roomManager = roomManager;
        this.gameStateManager = new GameStateManager();
        this.wordManager = new WordManager();
        this.aiService = new OpenAIService();
        this.gameLogic = new GameLogic();
        this.io = io;
    }

    /**
     * Emit timer update to all players in a room
     */
    public emitTimerUpdate = (roomId: string) => {
        const room = this.roomManager.getRoom(roomId);
        if (!room || !room.gameState) {
            return;
        }

        const remainingTime = this.gameStateManager.getRemainingTime(room.gameState);

        this.io.to(roomId).emit('timer_update', {
            roomId,
            remainingTime,
            currentTurn: room.gameState.currentTurn
        });
    };

    /**
     * Check for timer expiration and handle AI win if needed
     */
    public checkTimerExpiration = (roomId: string) => {
        const room = this.roomManager.getRoom(roomId);
        if (!room || !room.gameState) {
            return;
        }

        // Emit timer update for all turns (timer is paused during AI turns)
        this.emitTimerUpdate(roomId);

        // Check if timer has expired
        if (this.gameStateManager.isRoundExpired(room.gameState)) {
            console.log(`[TIMER] Round timer expired in room ${roomId}. AI wins the round.`);

            // Handle timer expiration - AI wins
            const updatedGameState = this.gameStateManager.handleTimerExpiration(room.gameState);
            room.gameState = updatedGameState;

            // Check if game ended
            if (this.gameStateManager.isGameEnded(updatedGameState)) {
                const gameEnded = this.gameStateManager.endGame(updatedGameState);
                room.gameState = gameEnded;

                // Emit game end event
                const gameEndData = {
                    roomId,
                    winner: 'ai',
                    finalScore: gameEnded.score,
                    humansWon: false,
                    reason: 'timer_expired'
                };

                this.io.to(roomId).emit('game_end', gameEndData);
            } else {
                // Advance to next round with role switching
                const { newGameState, newRoles } = this.gameStateManager.advanceRound(updatedGameState, room.roles!);

                // Update player roles in room
                room.players.forEach(player => {
                    if (newRoles.encoder === player.id) {
                        player.role = 'encoder';
                    } else if (newRoles.decoder === player.id) {
                        player.role = 'decoder';
                    }
                });

                // Update room state with new roles
                room.gameState = newGameState;
                room.roles = newRoles;

                // Select new secret word
                const newSecretWord = this.wordManager.selectRandomWord();
                newGameState.secretWord = newSecretWord;

                // Emit round end event with timer expiration reason
                const roundEndData = {
                    roomId,
                    humansWon: false,
                    score: newGameState.score,
                    gameEnded: false,
                    newSecretWord,
                    currentTurn: newGameState.currentTurn,
                    roles: newRoles,
                    reason: 'timer_expired',
                    round: newGameState.currentRound
                };

                this.io.to(roomId).emit('round_end', roundEndData);
            }
        }
    };

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

            // Update room with game state and roles
            room.gameState = gameState;
            room.roles = roles;

            // Update player roles in the room
            room.players.forEach(player => {
                if (roles.encoder === player.id) {
                    player.role = 'encoder';
                } else if (roles.decoder === player.id) {
                    player.role = 'decoder';
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
     * Handle send_message event - encoder sends a message
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
                encoder: room.players.find(p => p.role === 'encoder')!.id,
                decoder: room.players.find(p => p.role === 'decoder')!.id
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

            // Add encoder message to conversation history
            const updatedGameState = this.gameStateManager.addEncoderTurn(room.gameState, message);

            // Advance turn to AI
            const nextGameState = this.gameStateManager.advanceTurn(updatedGameState);
            console.log(`[DEBUG] handleSendMessage: Turn advanced from ${updatedGameState.currentTurn} to ${nextGameState.currentTurn}`);

            // Update room game state
            room.gameState = nextGameState;

            // Broadcast message to all players in the room
            const messageData = {
                roomId,
                message: {
                    content: message,
                    senderId: socket.id,
                    timestamp: new Date(),
                    type: 'encoder' // <-- Added type field
                },
                currentTurn: nextGameState.currentTurn
            };

            socket.to(roomId).emit('message_received', messageData);
            socket.emit('message_sent', messageData);

            // Trigger AI response after a short delay
            console.log(`[DEBUG] About to trigger AI response for room ${roomId}. Current turn: ${nextGameState.currentTurn}`);
            setTimeout(() => {
                console.log(`[DEBUG] Triggering AI response for room ${roomId}`);
                this.handleAIResponse(roomId);
            }, 1000);

            console.log(`Message sent in room ${roomId}: ${message}`);
        } catch (error) {
            console.error('Error in handleSendMessage:', error);
            socket.emit('error', { message: 'Internal server error' });
        }
    };

    /**
     * Handle player_guess event - decoder attempts to guess the secret word
     */
    public handlePlayerGuess = async (socket: Socket, data: { roomId: string; guess: string }) => {
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
                encoder: room.players.find(p => p.role === 'encoder')!.id,
                decoder: room.players.find(p => p.role === 'decoder')!.id
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

            if (isCorrect) {
                // Correct guess - end the round

                // Attempt to analyze the round strategy (non-blocking)
                try {
                    const roundSummary: RoundSummary = {
                        winner: 'players' as const,
                        secretWord: room.gameState.secretWord,
                        conversation: room.gameState.conversationHistory,
                        round: room.gameState.currentRound
                    };
                    const analysis = await this.aiService.analyzeRoundStrategy(roundSummary);
                    if (analysis?.analysis) {
                        room.gameState.previousRoundsAnalysis.push(analysis.analysis);
                    }
                } catch (error) {
                    console.error('🚨 Failed to analyze round strategy:', error);
                    // Non-blocking - continue with game flow
                }

                // Update score
                const updatedGameState = this.gameStateManager.updateScore(room.gameState, true);

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
                        humansWon: isCorrect
                    };

                    socket.to(roomId).emit('game_end', gameEndData);
                    socket.emit('game_end', gameEndData);

                    // Emit guess result for game end
                    const guessResultData = {
                        roomId,
                        humansWon: isCorrect,
                        guess,
                        score: finalGameState.score
                    };

                    socket.to(roomId).emit('guess_result', guessResultData);
                    socket.emit('guess_result', guessResultData);
                } else {
                    // Advance to next round with role switching
                    const { newGameState, newRoles } = this.gameStateManager.advanceRound(updatedGameState, room.roles!);

                    // Update player roles in room
                    room.players.forEach(player => {
                        if (newRoles.encoder === player.id) {
                            player.role = 'encoder';
                        } else if (newRoles.decoder === player.id) {
                            player.role = 'decoder';
                        }
                    });

                    // Update room state with new roles
                    room.gameState = newGameState;
                    room.roles = newRoles;

                    // Select new secret word
                    const newSecretWord = this.wordManager.selectRandomWord();
                    newGameState.secretWord = newSecretWord;

                    // Emit round end event with new roles
                    const roundEndData = {
                        roomId,
                        humansWon: isCorrect,
                        score: newGameState.score,
                        gameEnded: false,
                        newSecretWord,
                        currentTurn: newGameState.currentTurn,
                        roles: newRoles // Include new roles in round_end event
                    };

                    socket.to(roomId).emit('round_end', roundEndData);
                    socket.emit('round_end', roundEndData);

                    // Emit guess result for round end
                    const guessResultData = {
                        roomId,
                        humansWon: isCorrect,
                        guess,
                        score: newGameState.score
                    };

                    socket.to(roomId).emit('guess_result', guessResultData);
                    socket.emit('guess_result', guessResultData);
                }
            } else {
                // Incorrect guess - add to conversation history and continue
                // Add decoder guess to conversation history
                const updatedGameState = this.gameStateManager.addDecoderTurn(room.gameState, guess);

                // Advance turn to AI
                const nextGameState = this.gameStateManager.advanceTurn(updatedGameState);
                console.log(`[DEBUG] handlePlayerGuess: Turn advanced from ${updatedGameState.currentTurn} to ${nextGameState.currentTurn}`);

                // Update room game state
                room.gameState = nextGameState;

                // Broadcast message to all players in the room
                const messageData = {
                    roomId,
                    message: {
                        content: guess,
                        senderId: socket.id,
                        timestamp: new Date(),
                        type: 'decoder' // <-- Added type field
                    },
                    currentTurn: nextGameState.currentTurn
                };

                socket.to(roomId).emit('message_received', messageData);
                socket.emit('message_sent', messageData);

                // Emit guess result (incorrect)
                const guessResultData = {
                    roomId,
                    humansWon: false,
                    guess,
                    score: room.gameState.score
                };

                socket.to(roomId).emit('guess_result', guessResultData);
                socket.emit('guess_result', guessResultData);

                // Trigger AI response after a short delay
                console.log(`[DEBUG] About to trigger AI response for room ${roomId}. Current turn: ${nextGameState.currentTurn}`);
                setTimeout(() => {
                    console.log(`[DEBUG] Triggering AI response for room ${roomId}`);
                    this.handleAIResponse(roomId);
                }, 1000);
            }

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
                    encoder: room.players.find(p => p.role === 'encoder')!.id,
                    decoder: room.players.find(p => p.role === 'decoder')!.id
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
                console.log(`[DEBUG] handleAIResponse: Room or game state not found for room ${roomId}`);
                return;
            }

            console.log(`[DEBUG] handleAIResponse: Current turn is ${room.gameState.currentTurn} for room ${roomId}`);

            // Check if it's AI's turn
            if (room.gameState.currentTurn !== 'ai') {
                console.log(`[DEBUG] handleAIResponse: Not AI's turn, current turn is ${room.gameState.currentTurn} for room ${roomId}`);
                return;
            }

            // Generate AI response using the OpenAI service
            console.log(`[DEBUG] ========= AI TURN CONTEXT =========`);
            console.log(`[DEBUG] Conversation History:`);
            room.gameState.conversationHistory.forEach((turn, index) => {
                console.log(`[DEBUG] Turn ${index + 1}:`, turn);
            });
            console.log(`[DEBUG] Previous Round Analyses:`, room.gameState.previousRoundsAnalysis);
            console.log(`[DEBUG] ==================================`);

            const aiResponse = await this.aiService.analyzeConversation(
                room.gameState.conversationHistory,
                room.gameState.previousRoundsAnalysis
            );
            console.log(`[DEBUG] AI service returned:`, aiResponse);

            // Add AI response to conversation history
            const updatedGameState = this.gameStateManager.addAITurn(room.gameState, aiResponse.thinking, aiResponse.guess);

            // Check if AI guess is correct
            const isCorrect = this.gameStateManager.validateGuess(aiResponse.guess, room.gameState.secretWord);

            if (isCorrect) {
                // Attempt to analyze the round strategy (non-blocking)
                try {
                    const roundSummary: RoundSummary = {
                        winner: 'ai' as const,
                        secretWord: updatedGameState.secretWord,
                        conversation: updatedGameState.conversationHistory,
                        round: updatedGameState.currentRound
                    };
                    const analysis = await this.aiService.analyzeRoundStrategy(roundSummary);
                    if (analysis?.analysis) {
                        updatedGameState.previousRoundsAnalysis.push(analysis.analysis);
                    }
                } catch (error) {
                    console.error('🚨 Failed to analyze round strategy:', error);
                    // Non-blocking - continue with game flow
                }

                // AI wins the round - update score and advance to next round with role switching
                const scoreUpdated = this.gameStateManager.updateScore(updatedGameState, false); // false = AI wins
                const { newGameState, newRoles } = this.gameStateManager.advanceRound(scoreUpdated, room.roles!);

                // Check if game ended
                if (this.gameStateManager.isGameEnded(newGameState)) {
                    const gameEnded = this.gameStateManager.endGame(newGameState);
                    room.gameState = gameEnded;

                    // Emit game end event
                    const gameEndData = {
                        roomId,
                        winner: 'ai',
                        finalScore: gameEnded.score,
                        humansWon: false
                    };

                    this.io.to(roomId).emit('game_end', gameEndData);

                    // Emit guess result for game end
                    const guessResultData = {
                        roomId,
                        humansWon: false,
                        guess: aiResponse.guess,
                        score: gameEnded.score
                    };

                    this.io.to(roomId).emit('guess_result', guessResultData);
                } else {
                    // Update player roles in room
                    room.players.forEach(player => {
                        if (newRoles.encoder === player.id) {
                            player.role = 'encoder';
                        } else if (newRoles.decoder === player.id) {
                            player.role = 'decoder';
                        }
                    });

                    // Update room state with new roles
                    room.gameState = newGameState;
                    room.roles = newRoles;

                    // Select new secret word
                    const newSecretWord = this.wordManager.selectRandomWord();
                    newGameState.secretWord = newSecretWord;

                    // Emit round end event with new roles
                    const roundEndData = {
                        roomId,
                        humansWon: false,
                        score: newGameState.score,
                        gameEnded: false,
                        newSecretWord,
                        currentTurn: newGameState.currentTurn,
                        roles: newRoles // Include new roles in round_end event
                    };

                    this.io.to(roomId).emit('round_end', roundEndData);

                    // Emit guess result for round end
                    const guessResultData = {
                        roomId,
                        humansWon: false,
                        guess: aiResponse.guess,
                        score: newGameState.score
                    };

                    this.io.to(roomId).emit('guess_result', guessResultData);
                }
            } else {
                // AI incorrect - advance turn to decoder
                const nextGameState = this.gameStateManager.advanceTurn(updatedGameState);
                room.gameState = nextGameState;
            }

            // Broadcast AI response to all players
            const aiResponseData = {
                roomId,
                turn: {
                    thinking: aiResponse.thinking,
                    guess: aiResponse.guess
                },
                currentTurn: room.gameState!.currentTurn
            };

            // Emit to all players in the room
            this.io.to(roomId).emit('ai_response', aiResponseData);

            console.log(`[DEBUG] AI response successfully generated and emitted in room ${roomId}: ${aiResponse.guess}`);
            console.log(`AI response generated in room ${roomId}: ${aiResponse.guess}`);
        } catch (error) {
            console.error('[DEBUG] Error in handleAIResponse:', error);

            // Fallback to simple mock response if AI service fails
            console.log(`[DEBUG] Falling back to AI fallback response for room ${roomId}`);
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
            console.log(`[DEBUG] ‼ ⚠️ handleAIFallback: Room or game state not found for room ${roomId}`);

            // Simple fallback response using real word list
            const thinking = ["Analyzing conversation...", "Processing clues...", "Evaluating context...", "Making educated guess..."];
            const availableWords = this.wordManager.getAllWords();

            // Try to make a contextual guess based on conversation history
            let guess: string;
            if (room.gameState.conversationHistory.length > 0) {
                // Look for words in the conversation that might be clues
                const conversationText = room.gameState.conversationHistory
                    .map(turn => {
                        if (turn.type === 'encoder_hint') {
                            return (turn as any).content?.toLowerCase?.() || '';
                        } else if (turn.type === 'decoder_guess') {
                            return (turn as any).guess?.toLowerCase?.() || '';
                        }
                        return '';
                    })
                    .join(' ');

                // Find words that might be related to the conversation
                const relatedWords = availableWords.filter(word =>
                    conversationText.includes(word.toLowerCase()) ||
                    word.toLowerCase().includes(conversationText.split(' ')[0] || '')
                );

                if (relatedWords.length > 0) {
                    guess = relatedWords[Math.floor(Math.random() * relatedWords.length)]!;
                } else {
                    guess = availableWords[Math.floor(Math.random() * availableWords.length)]!;
                }
            } else {
                guess = availableWords[Math.floor(Math.random() * availableWords.length)]!;
            }

            // Add AI response to conversation history
            const updatedGameState = this.gameStateManager.addAITurn(room.gameState, thinking, guess);

            // Check if AI guess is correct
            const isCorrect = this.gameStateManager.validateGuess(guess, room.gameState.secretWord);

            if (isCorrect) {
                // AI wins the round - update score and advance to next round with role switching
                const scoreUpdated = this.gameStateManager.updateScore(updatedGameState, false); // false = AI wins
                const { newGameState, newRoles } = this.gameStateManager.advanceRound(scoreUpdated, room.roles!);

                // Check if game ended
                if (this.gameStateManager.isGameEnded(newGameState)) {
                    const gameEnded = this.gameStateManager.endGame(newGameState);
                    room.gameState = gameEnded;

                    // Emit game end event
                    const gameEndData = {
                        roomId,
                        winner: 'ai',
                        finalScore: gameEnded.score,
                        humansWon: false
                    };

                    this.io.to(roomId).emit('game_end', gameEndData);

                    // Emit guess result for game end
                    const guessResultData = {
                        roomId,
                        humansWon: false,
                        guess: guess,
                        score: gameEnded.score
                    };

                    this.io.to(roomId).emit('guess_result', guessResultData);
                } else {
                    // Update player roles in room
                    room.players.forEach(player => {
                        if (newRoles.encoder === player.id) {
                            player.role = 'encoder';
                        } else if (newRoles.decoder === player.id) {
                            player.role = 'decoder';
                        }
                    });

                    // Update room state with new roles
                    room.gameState = newGameState;
                    room.roles = newRoles;

                    // Select new secret word
                    const newSecretWord = this.wordManager.selectRandomWord();
                    newGameState.secretWord = newSecretWord;

                    // Emit round end event with new roles
                    const roundEndData = {
                        roomId,
                        humansWon: false,
                        score: newGameState.score,
                        gameEnded: false,
                        newSecretWord,
                        currentTurn: newGameState.currentTurn,
                        roles: newRoles // Include new roles in round_end event
                    };

                    this.io.to(roomId).emit('round_end', roundEndData);

                    // Emit guess result for round end
                    const guessResultData = {
                        roomId,
                        humansWon: false,
                        guess: guess,
                        score: newGameState.score
                    };

                    this.io.to(roomId).emit('guess_result', guessResultData);
                }
            } else {
                // AI incorrect - advance turn to decoder
                const nextGameState = this.gameStateManager.advanceTurn(updatedGameState);
                room.gameState = nextGameState;
            }

            // Broadcast fallback AI response
            const aiResponseData = {
                roomId,
                turn: {
                    thinking: thinking,
                    guess: guess
                },
                currentTurn: room.gameState.currentTurn
            };

            this.io.to(roomId).emit('ai_response', aiResponseData);

            console.log(`[DEBUG] AI fallback response successfully generated and emitted in room ${roomId}: ${guess}`);
            console.log(`AI fallback response generated in room ${roomId}: ${guess}`);
        } catch (error) {
            console.error('Error in handleAIFallback:', error);
        }
    };
} 