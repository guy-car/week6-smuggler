import { GameState, Player, RoleAssignment, Turn } from '../types';
import { GameStateManager } from './state';
import { WordManager } from './wordManager';

export class GameLogic {
    private gameStateManager: GameStateManager;
    private wordManager: WordManager;

    constructor() {
        this.gameStateManager = new GameStateManager();
        this.wordManager = new WordManager();

        ///
    }

    /**
     * Start a new game
     * Assigns roles based on join order: first player is Encryptor, second is Decryptor
     */
    public startGame(players: Player[]): { gameState: GameState; roles: RoleAssignment; secretWord: string } {
        if (players.length !== 2) {
            throw new Error('Exactly 2 players required to start game');
        }

        // Select random secret word
        const secretWord = this.wordManager.selectRandomWord();

        // Create game state
        const gameState = this.gameStateManager.createGameState(secretWord, players);

        // Assign roles based on join order (deterministic)
        const roles = this.gameStateManager.assignRoles(players);

        return { gameState, roles, secretWord };
    }

    /**
     * Handle encryptor sending a message
     */
    public handleEncryptorMessage(
        gameState: GameState,
        content: string,
        roles: RoleAssignment
    ): { newGameState: GameState; shouldAdvanceTurn: boolean } {
        // Validate it's encryptor's turn
        if (gameState.currentTurn !== 'encryptor') {
            throw new Error('Not encryptor\'s turn');
        }

        // Add outsider turn to conversation history
        const newGameState = this.gameStateManager.addOutsiderTurn(gameState, content);

        // Advance turn to AI
        const updatedGameState = this.gameStateManager.advanceTurn(newGameState);

        return {
            newGameState: updatedGameState,
            shouldAdvanceTurn: true
        };
    }

    /**
     * Handle AI response
     */
    public handleAIResponse(
        gameState: GameState,
        aiResponse: { thinking: string[]; guess: string }
    ): { newGameState: GameState; isCorrect: boolean; shouldAdvanceTurn: boolean } {
        // Validate it's AI's turn
        if (gameState.currentTurn !== 'ai') {
            throw new Error('Not AI\'s turn');
        }

        // Add AI turn to conversation history
        const newGameState = this.gameStateManager.addAITurn(gameState, aiResponse.thinking, aiResponse.guess);

        // Check if AI guess is correct
        const isCorrect = this.gameStateManager.validateGuess(aiResponse.guess, gameState.secretWord);

        if (isCorrect) {
            // AI wins the round - update score and advance to next round
            const scoreUpdated = this.gameStateManager.updateScore(newGameState, false); // false = AI wins
            const nextRound = this.gameStateManager.advanceRound(scoreUpdated);

            // Check if game ended
            if (this.gameStateManager.isGameEnded(nextRound)) {
                const gameEnded = this.gameStateManager.endGame(nextRound);
                return {
                    newGameState: gameEnded,
                    isCorrect: true,
                    shouldAdvanceTurn: false
                };
            }

            return {
                newGameState: nextRound,
                isCorrect: true,
                shouldAdvanceTurn: false
            };
        } else {
            // AI incorrect - advance turn to decryptor
            const updatedGameState = this.gameStateManager.advanceTurn(newGameState);
            return {
                newGameState: updatedGameState,
                isCorrect: false,
                shouldAdvanceTurn: true
            };
        }
    }

    /**
     * Handle decryptor guess
     */
    public handleDecryptorGuess(
        gameState: GameState,
        guess: string,
        playerId: string,
        roles: RoleAssignment
    ): { newGameState: GameState; isCorrect: boolean; shouldAdvanceTurn: boolean; isMessage: boolean } {
        // Validate it's decryptor's turn
        if (gameState.currentTurn !== 'decryptor') {
            throw new Error('Not decryptor\'s turn');
        }

        // Validate it's the correct player
        if (roles.decryptor !== playerId) {
            throw new Error('Not decryptor\'s turn');
        }

        // Check if guess is correct
        const isCorrect = this.gameStateManager.validateGuess(guess, gameState.secretWord);

        if (isCorrect) {
            // Players win the round - update score and advance to next round
            const scoreUpdated = this.gameStateManager.updateScore(gameState, true); // true = players win
            const nextRound = this.gameStateManager.advanceRound(scoreUpdated);

            // Check if game ended
            if (this.gameStateManager.isGameEnded(nextRound)) {
                const gameEnded = this.gameStateManager.endGame(nextRound);
                return {
                    newGameState: gameEnded,
                    isCorrect: true,
                    shouldAdvanceTurn: false,
                    isMessage: false
                };
            }

            return {
                newGameState: nextRound,
                isCorrect: true,
                shouldAdvanceTurn: false,
                isMessage: false
            };
        } else {
            // Decryptor incorrect - add to conversation history as insider turn and advance turn to AI
            const messageAdded = this.gameStateManager.addInsiderTurn(gameState, guess);

            // Use the advanceTurn method for consistency with the 4-step cycle
            const updatedGameState = this.gameStateManager.advanceTurn(messageAdded);

            return {
                newGameState: updatedGameState,
                isCorrect: false,
                shouldAdvanceTurn: true,
                isMessage: true
            };
        }
    }

    /**
     * Get current game status
     */
    public getGameStatus(gameState: GameState): {
        isGameEnded: boolean;
        winner: 'players' | 'ai' | null;
        currentTurn: 'encryptor' | 'ai' | 'decryptor';
        score: number;
        round: number;
    } {
        return {
            isGameEnded: this.gameStateManager.isGameEnded(gameState),
            winner: this.gameStateManager.getGameWinner(gameState),
            currentTurn: gameState.currentTurn,
            score: gameState.score,
            round: gameState.currentRound
        };
    }

    /**
     * Check if a player can perform an action
     */
    public canPlayerAct(
        gameState: GameState,
        playerId: string,
        action: 'send_message' | 'guess',
        roles: RoleAssignment
    ): boolean {
        if (gameState.gameStatus !== 'active') {
            return false;
        }

        if (action === 'send_message') {
            return gameState.currentTurn === 'encryptor' && roles.encryptor === playerId;
        } else if (action === 'guess') {
            return gameState.currentTurn === 'decryptor' && roles.decryptor === playerId;
        }

        return false;
    }

    /**
     * Get player role
     */
    public getPlayerRole(playerId: string, roles: RoleAssignment): 'encryptor' | 'decryptor' | null {
        return this.gameStateManager.getPlayerRole(playerId, roles);
    }

    /**
     * Switch roles for next round (if needed)
     */
    public switchRolesForNextRound(roles: RoleAssignment): RoleAssignment {
        return this.gameStateManager.switchRoles([], roles);
    }

    /**
     * Get conversation history
     */
    public getConversationHistory(gameState: GameState): Turn[] {
        return [...gameState.conversationHistory];
    }

    /**
     * Get AI turns from conversation history
     */
    public getAITurns(gameState: GameState): Turn[] {
        return gameState.conversationHistory.filter(turn => turn.type === 'ai_analysis');
    }

    /**
     * Get secret word (for testing/debugging)
     */
    public getSecretWord(gameState: GameState): string {
        return gameState.secretWord;
    }

    /**
     * Validate conversation flow
     */
    public validateConversationFlow(gameState: GameState): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check if game is active
        if (gameState.gameStatus !== 'active') {
            errors.push('Game is not active');
            return { valid: false, errors };
        }

        // Check if conversation has started
        if (gameState.conversationHistory.length === 0) {
            errors.push('Conversation has not started');
            return { valid: false, errors };
        }

        // Check if it's time for a guess (AI has made at least one guess)
        const aiTurns = gameState.conversationHistory.filter(turn => turn.type === 'ai_analysis');
        if (aiTurns.length === 0) {
            errors.push('AI has not made any guesses yet');
            return { valid: false, errors };
        }

        // Check if there are enough turns for meaningful conversation
        if (gameState.conversationHistory.length < 2) {
            errors.push('Not enough turns for meaningful conversation');
            return { valid: false, errors };
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Check if turn order is being followed correctly
     */
    public validateTurnOrder(
        gameState: GameState,
        playerId: string,
        action: 'send_message' | 'guess',
        roles: RoleAssignment
    ): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (action === 'send_message') {
            if (gameState.currentTurn !== 'encryptor') {
                errors.push('Not encryptor\'s turn');
            }
            if (roles.encryptor !== playerId) {
                errors.push('Only encryptor can send messages');
            }
        } else if (action === 'guess') {
            if (gameState.currentTurn !== 'decryptor') {
                errors.push('Not decryptor\'s turn');
            }
            if (roles.decryptor !== playerId) {
                errors.push('Only decryptor can make guesses');
            }
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Check if game state is consistent
     */
    public validateGameStateConsistency(gameState: GameState): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check score bounds
        if (gameState.score < 0 || gameState.score > 10) {
            errors.push('Score is out of bounds (0-10)');
        }

        // Check round number
        if (gameState.currentRound < 1) {
            errors.push('Round number must be at least 1');
        }

        // Check if game ended but status is still active
        if ((gameState.score >= 10 || gameState.score <= 0) && gameState.gameStatus === 'active') {
            errors.push('Game should be ended but status is still active');
        }

        // Check if game is ended but score is in valid range
        if (gameState.gameStatus === 'ended' && gameState.score > 0 && gameState.score < 10) {
            errors.push('Game is ended but score is not at win/lose condition');
        }

        return { valid: errors.length === 0, errors };
    }
} 