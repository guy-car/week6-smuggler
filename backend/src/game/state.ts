import { AITurn, AnalyzeRequest, GameState, InsiderTurn, OutsiderTurn, Player, RoleAssignment } from '../types';
import { fuzzyStringMatch, getMaxLevenshteinDistance } from '../utils/helpers';

export class GameStateManager {
    private readonly INITIAL_SCORE = 5; // Start at neutral score
    private readonly MAX_SCORE = 10;
    private readonly MIN_SCORE = 0;
    private readonly WIN_SCORE = 10;
    private readonly LOSE_SCORE = 0;

    /**
     * Create a new game state
     */
    public createGameState(secretWord: string, players: Player[]): GameState {
        return {
            score: this.INITIAL_SCORE,
            currentRound: 1,
            secretWord: secretWord.toLowerCase(),
            conversationHistory: [], // Now uses Turn[] instead of Message[]
            currentTurn: 'encryptor',
            gameStatus: 'active'
        };
    }

    /**
     * Assign roles to players based on join order
     * First player (index 0) becomes Encryptor, second player (index 1) becomes Decryptor
     */
    public assignRoles(players: Player[]): RoleAssignment {
        if (players.length !== 2) {
            throw new Error('Exactly 2 players required for role assignment');
        }

        // Assign roles based on join order (first player = Encryptor, second = Decryptor)
        return {
            encryptor: players[0]!.id,
            decryptor: players[1]!.id
        };
    }

    /**
     * Add an outsider turn to conversation history
     */
    public addOutsiderTurn(gameState: GameState, content: string): GameState {
        const outsiderTurn: OutsiderTurn = {
            type: 'outsider_hint',
            content,
            turnNumber: this.getNextTurnNumber(gameState)
        };

        return {
            ...gameState,
            conversationHistory: [...gameState.conversationHistory, outsiderTurn]
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
     * Add an insider turn to conversation history
     */
    public addInsiderTurn(gameState: GameState, guess: string): GameState {
        const insiderTurn: InsiderTurn = {
            type: 'insider_guess',
            guess,
            turnNumber: this.getNextTurnNumber(gameState)
        };

        return {
            ...gameState,
            conversationHistory: [...gameState.conversationHistory, insiderTurn]
        };
    }

    /**
     * Legacy method for backward compatibility - now delegates to specific turn methods
     */
    public addMessage(gameState: GameState, message: any): GameState {
        // This method is kept for backward compatibility but should be replaced
        // with specific turn methods in new code
        if (message.type === 'outsider_hint') {
            return this.addOutsiderTurn(gameState, message.content);
        } else if (message.type === 'ai_analysis') {
            return this.addAITurn(gameState, message.thinking, message.guess);
        } else if (message.type === 'insider_guess') {
            return this.addInsiderTurn(gameState, message.guess);
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
     * Advance to next round
     */
    public advanceRound(gameState: GameState): GameState {
        return {
            ...gameState,
            currentRound: gameState.currentRound + 1,
            conversationHistory: [],
            currentTurn: 'encryptor'
        };
    }

    /**
     * Switch roles between players for next round
     * Encryptor becomes Decryptor, Decryptor becomes Encryptor
     */
    public switchRoles(players: Player[], roles: RoleAssignment): RoleAssignment {
        return {
            encryptor: roles.decryptor,
            decryptor: roles.encryptor
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
     * Get current turn
     */
    public getCurrentTurn(gameState: GameState): 'encryptor' | 'ai' | 'decryptor' {
        return gameState.currentTurn;
    }

    /**
     * Advance turn
     */
    public advanceTurn(gameState: GameState): GameState {
        const turnOrder: ('encryptor' | 'ai' | 'decryptor')[] = ['encryptor', 'ai', 'decryptor'];
        const currentIndex = turnOrder.indexOf(gameState.currentTurn);
        const nextIndex = (currentIndex + 1) % turnOrder.length;

        return {
            ...gameState,
            currentTurn: turnOrder[nextIndex]!
        };
    }

    /**
     * Check if it's a player's turn
     */
    public isPlayerTurn(gameState: GameState, playerId: string, roles: RoleAssignment): boolean {
        if (gameState.currentTurn === 'encryptor') {
            return roles.encryptor === playerId;
        } else if (gameState.currentTurn === 'decryptor') {
            return roles.decryptor === playerId;
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
    public getPlayerRole(playerId: string, roles: RoleAssignment): 'encryptor' | 'decryptor' | null {
        if (roles.encryptor === playerId) {
            return 'encryptor';
        } else if (roles.decryptor === playerId) {
            return 'decryptor';
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
    public transformToAnalyzeRequest(gameState: GameState, gameId: string): AnalyzeRequest {
        return {
            gameId,
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
    ): { gameState: GameState; playerRole: 'encryptor' | 'decryptor' | null } {
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
        currentTurn: 'encryptor' | 'ai' | 'decryptor';
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
} 