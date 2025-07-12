import { AITurn, AnalyzeRequest, DecoderTurn, EncoderTurn, GameState, Player, RoleAssignment } from '../types';
import { fuzzyStringMatch, getMaxLevenshteinDistance } from '../utils/helpers';

export class GameStateManager {
    private readonly INITIAL_SCORE = 3; // Start at neutral score
    private readonly MAX_SCORE = 6;
    private readonly MIN_SCORE = 0;
    private readonly WIN_SCORE = 6;
    private readonly LOSE_SCORE = 0;
    private readonly ROUND_DURATION = 180; // 3 minutes for round timer

    /**
     * Create a new game state
     */
    public createGameState(secretWord: string, players: Player[]): GameState {
        const baseGameState: GameState = {
            score: this.INITIAL_SCORE,
            currentRound: 1,
            secretWord: secretWord.toLowerCase(),
            conversationHistory: [], // Now uses Turn[] instead of Message[]
            previousRoundsAnalysis: [], // Initialize empty array for round analysis
            currentTurn: 'encoder' as const,
            gameStatus: 'active'
        };

        // Start timer for the first round
        return this.startRoundTimer(baseGameState);
    }

    /**
     * Assign roles to players based on join order
     * First player (index 0) becomes Encoder, second player (index 1) becomes Decoder
     */
    public assignRoles(players: Player[]): RoleAssignment {
        if (players.length !== 2) {
            throw new Error('Exactly 2 players required for role assignment');
        }

        // Assign roles based on join order (first player = Encoder, second = Decoder)
        return {
            encoder: players[0]!.id,
            decoder: players[1]!.id
        };
    }

    /**
     * Add an encoder turn to conversation history
     */
    public addEncoderTurn(gameState: GameState, content: string): GameState {
        const encoderTurn: EncoderTurn = {
            type: 'encoder_hint',
            content,
            turnNumber: this.getNextTurnNumber(gameState)
        };

        return {
            ...gameState,
            conversationHistory: [...gameState.conversationHistory, encoderTurn]
        };
    }

    /**
     * Add an AI turn to conversation history
     */
    public addAITurn(gameState: GameState, thinking: string[], guess: string): GameState {
        const aiTurn: AITurn = {
            type: 'ai_analysis',
            thinking,
            guess,
            turnNumber: this.getNextTurnNumber(gameState)
        };

        return {
            ...gameState,
            conversationHistory: [...gameState.conversationHistory, aiTurn]
        };
    }

    /**
     * Add a decoder turn to conversation history
     */
    public addDecoderTurn(gameState: GameState, guess: string): GameState {
        const decoderTurn: DecoderTurn = {
            type: 'decoder_guess',
            guess,
            turnNumber: this.getNextTurnNumber(gameState)
        };

        return {
            ...gameState,
            conversationHistory: [...gameState.conversationHistory, decoderTurn]
        };
    }

    /**
     * Legacy method for backward compatibility - now delegates to specific turn methods
     */
    public addMessage(gameState: GameState, message: any): GameState {
        // This method is kept for backward compatibility but should be replaced
        // with specific turn methods in new code
        if (message.type === 'encoder_hint') {
            return this.addEncoderTurn(gameState, message.content);
        } else if (message.type === 'ai_analysis') {
            return this.addAITurn(gameState, message.thinking, message.guess);
        } else if (message.type === 'decoder_guess') {
            return this.addDecoderTurn(gameState, message.guess);
        }

        throw new Error('Invalid message type for addMessage');
    }

    /**
     * Update score based on guess result
     */
    public updateScore(gameState: GameState, correct: boolean): GameState {
        let newScore = gameState.score;

        if (correct) {
            // Players win the round
            newScore = Math.min(this.MAX_SCORE, newScore + 1);
        } else {
            // AI wins the round
            newScore = Math.max(this.MIN_SCORE, newScore - 1);
        }

        return {
            ...gameState,
            score: newScore
        };
    }

    /**
     * Advance to next round and switch roles
     */
    public advanceRound(gameState: GameState, roles: RoleAssignment): {
        newGameState: GameState;
        newRoles: RoleAssignment;
    } {
        const newRoles = this.switchRoles([], roles);
        const baseGameState: GameState = {
            ...gameState,
            currentRound: gameState.currentRound + 1,
            conversationHistory: [],
            currentTurn: 'encoder' as const
        };

        // Start timer for the first round
        const newGameState = this.startRoundTimer(baseGameState);

        return { newGameState, newRoles };
    }

    /**
     * Switch roles between players for next round
     * Encoder becomes Decoder, Decoder becomes Encoder
     */
    public switchRoles(players: Player[], roles: RoleAssignment): RoleAssignment {
        return {
            encoder: roles.decoder,
            decoder: roles.encoder
        };
    }

    /**
     * Check if game has ended
     */
    public isGameEnded(gameState: GameState): boolean {
        return gameState.score >= this.WIN_SCORE ||
            gameState.score <= this.LOSE_SCORE;
    }

    /**
     * Get game winner
     */
    public getGameWinner(gameState: GameState): 'players' | 'ai' | null {
        if (gameState.score >= this.WIN_SCORE) {
            return 'players';
        } else if (gameState.score <= this.LOSE_SCORE) {
            return 'ai';
        }
        return null;
    }

    /**
     * Validate guess against secret word using Levenshtein distance
     */
    public validateGuess(guess: string, secretWord: string): boolean {
        const maxDistance = getMaxLevenshteinDistance();
        return fuzzyStringMatch(guess, secretWord, maxDistance);
    }

    /**
     * Get current turn
     */
    public getCurrentTurn(gameState: GameState): 'encoder' | 'ai' | 'decoder' {
        return gameState.currentTurn;
    }

    /**
     * Advance turn
     */
    public advanceTurn(gameState: GameState): GameState {
        let nextTurn: 'encoder' | 'ai' | 'decoder';

        switch (gameState.currentTurn) {
            case 'encoder':
                nextTurn = 'ai';
                break;
            case 'ai':
                // AI should go to decoder if the last non-AI turn was from encoder
                // AI should go to encoder if the last non-AI turn was from decoder
                const lastNonAITurn = gameState.conversationHistory
                    .slice().reverse()
                    .find(turn => turn.type === 'encoder_hint' || turn.type === 'decoder_guess');

                if (lastNonAITurn?.type === 'encoder_hint') {
                    // Last turn was from encoder, AI should go to decoder
                    nextTurn = 'decoder';
                } else if (lastNonAITurn?.type === 'decoder_guess') {
                    // Last turn was from decoder, AI should go to encoder
                    nextTurn = 'encoder';
                } else {
                    // Fallback: go to decoder
                    nextTurn = 'decoder';
                }
                break;
            case 'decoder':
                nextTurn = 'ai';
                break;
            default:
                throw new Error(`Invalid current turn: ${gameState.currentTurn}`);
        }

        console.log(`[DEBUG] advanceTurn: ${gameState.currentTurn} → ${nextTurn}`);

        // Handle timer pause/resume based on turn type
        let updatedGameState = gameState;

        if (nextTurn === 'ai') {
            // Pause timer during AI turns
            updatedGameState = this.pauseRoundTimer(gameState);
        } else if (nextTurn === 'encoder' || nextTurn === 'decoder') {
            // Resume timer during human turns
            updatedGameState = this.resumeRoundTimer(gameState);
        }

        return {
            ...updatedGameState,
            currentTurn: nextTurn
        };
    }

    /**
     * Check if it's a player's turn
     */
    public isPlayerTurn(gameState: GameState, playerId: string, roles: RoleAssignment): boolean {
        if (gameState.currentTurn === 'encoder') {
            return roles.encoder === playerId;
        } else if (gameState.currentTurn === 'decoder') {
            return roles.decoder === playerId;
        }
        return false;
    }

    /**
     * Check if it's AI's turn
     */
    public isAITurn(gameState: GameState): boolean {
        return gameState.currentTurn === 'ai';
    }

    /**
     * Get player role
     */
    public getPlayerRole(playerId: string, roles: RoleAssignment): 'encoder' | 'decoder' | null {
        if (roles.encoder === playerId) {
            return 'encoder';
        } else if (roles.decoder === playerId) {
            return 'decoder';
        }
        return null;
    }

    /**
     * Get next turn number for conversation history
     */
    public getNextTurnNumber(gameState: GameState): number {
        return gameState.conversationHistory.length + 1;
    }

    /**
     * Transform conversation history to AnalyzeRequest format
     */
    public transformToAnalyzeRequest(gameState: GameState, gameId?: string): AnalyzeRequest {
        return {
            ...(gameId && { gameId }),
            conversationHistory: gameState.conversationHistory
        };
    }

    /**
     * End game
     */
    public endGame(gameState: GameState): GameState {
        return {
            ...gameState,
            gameStatus: 'ended'
        };
    }



    /**
     * Save game state for disconnected player
     */
    public saveGameStateForPlayer(
        gameState: GameState,
        playerId: string,
        roles: RoleAssignment
    ): { gameState: GameState; playerRole: 'encoder' | 'decoder' | null } {
        // Create a copy of the game state for the player
        const savedGameState = { ...gameState };

        // Get player's role
        const playerRole = this.getPlayerRole(playerId, roles);

        return {
            gameState: savedGameState,
            playerRole
        };
    }

    /**
     * Restore game state for rejoining player
     */
    public restoreGameStateForPlayer(
        savedGameState: GameState,
        currentGameState: GameState,
        playerId: string,
        roles: RoleAssignment
    ): { gameState: GameState; canRejoin: boolean; reason?: string } {
        // Check if the game is still active
        if (currentGameState.gameStatus !== 'active') {
            return {
                gameState: currentGameState,
                canRejoin: false,
                reason: 'Game has ended'
            };
        }

        // Check if the player's role still exists
        const playerRole = this.getPlayerRole(playerId, roles);
        if (!playerRole) {
            return {
                gameState: currentGameState,
                canRejoin: false,
                reason: 'Player role not found'
            };
        }

        // Check if the game state is compatible (same round, same secret word)
        if (savedGameState.currentRound !== currentGameState.currentRound) {
            return {
                gameState: currentGameState,
                canRejoin: false,
                reason: 'Game has progressed to a different round'
            };
        }

        if (savedGameState.secretWord !== currentGameState.secretWord) {
            return {
                gameState: currentGameState,
                canRejoin: false,
                reason: 'Game has changed secret word'
            };
        }

        // Player can rejoin - return current game state
        return {
            gameState: currentGameState,
            canRejoin: true
        };
    }

    /**
     * Check if a player can rejoin the game
     */
    public canPlayerRejoin(
        gameState: GameState,
        playerId: string,
        roles: RoleAssignment
    ): { canRejoin: boolean; reason?: string } {
        // Check if game is active
        if (gameState.gameStatus !== 'active') {
            return {
                canRejoin: false,
                reason: 'Game is not active'
            };
        }

        // Check if player has a role
        const playerRole = this.getPlayerRole(playerId, roles);
        if (!playerRole) {
            return {
                canRejoin: false,
                reason: 'Player does not have a role in this game'
            };
        }

        return {
            canRejoin: true
        };
    }

    /**
     * Get game state summary for rejoining player
     */
    public getGameStateSummary(gameState: GameState): {
        score: number;
        round: number;
        currentTurn: 'encoder' | 'ai' | 'decoder';
        messageCount: number;
        gameStatus: 'waiting' | 'active' | 'ended';
    } {
        return {
            score: gameState.score,
            round: gameState.currentRound,
            currentTurn: gameState.currentTurn,
            messageCount: gameState.conversationHistory.length,
            gameStatus: gameState.gameStatus
        };
    }

    /**
     * Start the round timer (3 minutes). Sets roundExpiresAt and timerState to 'running'.
     */
    public startRoundTimer(gameState: GameState): GameState {
        const expiresAt = Date.now() + (this.ROUND_DURATION * 1000);
        const { pausedRemainingTime, ...rest } = gameState;
        return {
            ...rest,
            roundExpiresAt: expiresAt,
            timerState: 'running'
        };
    }

    /**
     * Clear all timer state (used at round end or game end).
     */
    public clearRoundTimer(gameState: GameState): GameState {
        const { roundExpiresAt, pausedRemainingTime, timerState, ...rest } = gameState;
        return rest;
    }

    /**
     * Check if the round timer has expired (either running or paused with 0 time left).
     */
    public isRoundExpired(gameState: GameState): boolean {
        if (gameState.roundExpiresAt) {
            // Timer is running - check if expired
            return Date.now() >= gameState.roundExpiresAt;
        } else if (gameState.pausedRemainingTime !== undefined) {
            // Timer is paused - check if remaining time is 0
            return gameState.pausedRemainingTime <= 0;
        }
        // No timer active - not expired
        return false;
    }

    /**
     * Handle timer expiration: AI wins the round, score is updated, timer is cleared.
     */
    public handleTimerExpiration(gameState: GameState): GameState {
        // AI wins the round - update score
        const scoreUpdated = this.updateScore(gameState, false); // false = AI wins
        // Clear the timer
        return this.clearRoundTimer(scoreUpdated);
    }

    /**
     * Get remaining time in seconds for the current round (running or paused).
     */
    public getRemainingTime(gameState: GameState): number {
        if (gameState.roundExpiresAt) {
            // Timer is running - calculate from expiration time
            const remaining = Math.max(0, Math.ceil((gameState.roundExpiresAt - Date.now()) / 1000));
            return remaining;
        } else if (gameState.pausedRemainingTime !== undefined) {
            // Timer is paused - return stored remaining time
            return gameState.pausedRemainingTime;
        }
        // No timer active
        return 0;
    }

    /**
     * Pause the round timer (for AI turns). Stores remaining time and sets timerState to 'paused'.
     */
    public pauseRoundTimer(gameState: GameState): GameState {
        if (!gameState.roundExpiresAt) {
            // Timer is already paused or doesn't exist
            return gameState;
        }
        // Calculate remaining time and store it
        const remainingTime = this.getRemainingTime(gameState);
        const { roundExpiresAt, ...rest } = gameState;
        return {
            ...rest,
            pausedRemainingTime: remainingTime,
            timerState: 'paused'
        };
    }

    /**
     * Resume the round timer (for human turns). Restores timer from pausedRemainingTime or starts new timer.
     */
    public resumeRoundTimer(gameState: GameState): GameState {
        if (gameState.roundExpiresAt) {
            // Timer is already running
            return gameState;
        }
        // If we have paused time, resume from there
        if (gameState.pausedRemainingTime !== undefined && gameState.pausedRemainingTime > 0) {
            const expiresAt = Date.now() + (gameState.pausedRemainingTime * 1000);
            const { pausedRemainingTime, ...rest } = gameState;
            return {
                ...rest,
                roundExpiresAt: expiresAt,
                timerState: 'running'
            };
        }
        // If no paused time, start a new round timer
        return this.startRoundTimer(gameState);
    }
} 