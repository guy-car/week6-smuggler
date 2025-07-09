import { AITurn, AnalyzeRequest, DecoderTurn, EncoderTurn, GameState, Player, RoleAssignment } from '../types';
import { fuzzyStringMatch, getMaxLevenshteinDistance } from '../utils/helpers';

export class GameStateManager {
    private readonly INITIAL_SCORE = 5; // Start at neutral score
    private readonly MAX_SCORE = 10;
    private readonly MIN_SCORE = 0;
    private readonly WIN_SCORE = 10;
    private readonly LOSE_SCORE = 0;

    /**
     * Create initial game state
     */
    public createGameState(secretWord: string, players: Player[]): GameState {
        return {
            score: 5,
            currentRound: 1,
            secretWord,
            conversationHistory: [],
            currentTurn: 'encoder',
            gameStatus: 'active'
        };
    }

    /**
     * Assign roles to players
     * First player (index 0) becomes Encoder, second player (index 1) becomes Decoder
     */
    public assignRoles(players: Player[]): RoleAssignment {
        if (players.length < 2) {
            throw new Error('Not enough players to assign roles');
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
            type: 'encoder',
            content,
            turnNumber: gameState.conversationHistory.length + 1
        };

        return {
            ...gameState,
            conversationHistory: [...gameState.conversationHistory, encoderTurn],
            currentTurn: 'ai'
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
            turnNumber: gameState.conversationHistory.length + 1
        };

        return {
            ...gameState,
            conversationHistory: [...gameState.conversationHistory, aiTurn],
            currentTurn: 'decoder'
        };
    }

    /**
     * Add a decoder turn to conversation history
     */
    public addDecoderTurn(gameState: GameState, guess: string): GameState {
        const decoderTurn: DecoderTurn = {
            type: 'decoder',
            guess,
            turnNumber: gameState.conversationHistory.length + 1
        };

        return {
            ...gameState,
            conversationHistory: [...gameState.conversationHistory, decoderTurn],
            currentTurn: 'encoder'
        };
    }

    /**
     * Add a turn to conversation history based on type
     */
    public addTurn(gameState: GameState, message: { type: 'encoder' | 'decoder'; content?: string; guess?: string }): GameState {
        if (message.type === 'encoder' && message.content) {
            return this.addEncoderTurn(gameState, message.content);
        } else if (message.type === 'decoder' && message.guess) {
            return this.addDecoderTurn(gameState, message.guess);
        }
        throw new Error(`Invalid turn type or missing required fields: ${message.type}`);
    }

    /**
     * Swap roles between players
     * Encoder becomes Decoder, Decoder becomes Encoder
     */
    public swapRoles(roles: RoleAssignment): RoleAssignment {
        return {
            encoder: roles.decoder,
            decoder: roles.encoder
        };
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
     * Advance to next round
     */
    public advanceRound(gameState: GameState): GameState {
        return {
            ...gameState,
            currentRound: gameState.currentRound + 1,
            conversationHistory: [],
            currentTurn: 'encoder'
        };
    }

    /**
     * Check if game has ended
     */
    public isGameEnded(gameState: GameState): boolean {
        return gameState.score >= this.WIN_SCORE || gameState.score <= this.LOSE_SCORE;
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
     * Get current turn type
     */
    public getCurrentTurn(gameState: GameState): 'encoder' | 'ai' | 'decoder' {
        return gameState.currentTurn;
    }

    /**
 * Advance turn
 */
    public advanceTurn(gameState: GameState): GameState {

        let nextTurn: 'encryptor' | 'ai' | 'decryptor';

        switch (gameState.currentTurn) {
            case 'encryptor':
                nextTurn = 'ai';
                break;
            case 'ai':
                // AI should go to decryptor if the last non-AI turn was from encryptor
                // AI should go to encryptor if the last non-AI turn was from decryptor
                const lastNonAITurn = gameState.conversationHistory
                    .reverse()
                    .find(turn => turn.type === 'outsider_hint' || turn.type === 'insider_guess');

                if (lastNonAITurn?.type === 'outsider_hint') {
                    // Last turn was from encryptor, AI should go to decryptor
                    nextTurn = 'decryptor';
                } else if (lastNonAITurn?.type === 'insider_guess') {
                    // Last turn was from decryptor, AI should go to encryptor
                    nextTurn = 'encryptor';
                } else {
                    // Fallback: go to decryptor
                    nextTurn = 'decryptor';
                }
                break;
            case 'decryptor':
                nextTurn = 'ai';
                break;
            default:
                throw new Error(`Invalid current turn: ${gameState.currentTurn}`);
        }

        console.log(`[DEBUG] advanceTurn: ${gameState.currentTurn} → ${nextTurn}`);


        return {
            ...gameState,
            currentTurn: nextTurn
        };
    }

    /**
     * Check if it's player's turn
     */
    public isPlayerTurn(gameState: GameState, playerId: string, roles: RoleAssignment): boolean {
        const turnOrder: ('encoder' | 'ai' | 'decoder')[] = ['encoder', 'ai', 'decoder'];
        const currentTurnIndex = turnOrder.indexOf(gameState.currentTurn);

        if (currentTurnIndex === -1) {
            throw new Error(`Invalid turn: ${gameState.currentTurn}`);
        }

        if (gameState.currentTurn === 'encoder') {
            return roles.encoder === playerId;
        } else if (gameState.currentTurn === 'decoder') {
            return roles.decoder === playerId;
        }

        return false; // AI's turn
    }

    /**
     * Check if it's AI's turn
     */
    public isAITurn(gameState: GameState): boolean {
        return gameState.currentTurn === 'ai';
    }

    /**
     * Get player's role
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
     * Get game state for a specific player
     */
    public getGameStateForPlayer(
        gameState: GameState,
        playerId: string,
        roles: RoleAssignment
    ): { gameState: GameState; playerRole: 'encoder' | 'decoder' | null } {
        const playerRole = this.getPlayerRole(playerId, roles);

        return {
            gameState,
            playerRole
        };
    }
} 