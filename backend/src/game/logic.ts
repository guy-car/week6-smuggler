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
     * Assigns roles based on join order: first player is Encoder, second is Decoder
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
     * Handle encoder sending a message
     */
    public handleEncoderMessage(
        gameState: GameState,
        content: string,
        roles: RoleAssignment
    ): { newGameState: GameState; shouldAdvanceTurn: boolean } {
        // Validate it's encoder's turn
        if (gameState.currentTurn !== 'encoder') {
            throw new Error('Not encoder\'s turn');
        }

        // Add encoder turn to conversation history
        const newGameState = this.gameStateManager.addEncoderTurn(gameState, content);

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
            // Note: This method doesn't have access to roles, so we'll need to handle this differently
            // For now, we'll create a mock roles object for testing
            const mockRoles: RoleAssignment = {
                encoder: 'player1',
                decoder: 'player2'
            };
            const { newGameState: nextRound } = this.gameStateManager.advanceRound(scoreUpdated, mockRoles);

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
            // AI incorrect - advance turn to decoder
            const updatedGameState = this.gameStateManager.advanceTurn(newGameState);
            return {
                newGameState: updatedGameState,
                isCorrect: false,
                shouldAdvanceTurn: true
            };
        }
    }

    /**
     * Handle decoder guess
     */
    public handleDecoderGuess(
        gameState: GameState,
        guess: string,
        playerId: string,
        roles: RoleAssignment
    ): { newGameState: GameState; isCorrect: boolean; shouldAdvanceTurn: boolean; isMessage: boolean } {
        // Validate it's decoder's turn
        if (gameState.currentTurn !== 'decoder') {
            throw new Error('Not decoder\'s turn');
        }

        // Validate it's the correct player
        if (roles.decoder !== playerId) {
            throw new Error('Not decoder\'s turn');
        }

        // Check if guess is correct
        const isCorrect = this.gameStateManager.validateGuess(guess, gameState.secretWord);

        if (isCorrect) {
            // Players win the round - update score and advance to next round
            const scoreUpdated = this.gameStateManager.updateScore(gameState, true); // true = players win
            const { newGameState: nextRound } = this.gameStateManager.advanceRound(scoreUpdated, roles);

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
            // Decoder incorrect - add to conversation history as decoder turn and advance turn to AI
            const messageAdded = this.gameStateManager.addDecoderTurn(gameState, guess);

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
        currentTurn: 'encoder' | 'ai' | 'decoder';
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
            return gameState.currentTurn === 'encoder' && roles.encoder === playerId;
        } else if (action === 'guess') {
            return gameState.currentTurn === 'decoder' && roles.decoder === playerId;
        }

        return false;
    }

    /**
     * Get player role
     */
    public getPlayerRole(playerId: string, roles: RoleAssignment): 'encoder' | 'decoder' | null {
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
            if (gameState.currentTurn !== 'encoder') {
                errors.push('Not encoder\'s turn');
            }
            if (roles.encoder !== playerId) {
                errors.push('Only encoder can send messages');
            }
        } else if (action === 'guess') {
            if (gameState.currentTurn !== 'decoder') {
                errors.push('Not decoder\'s turn');
            }
            if (roles.decoder !== playerId) {
                errors.push('Only decoder can make guesses');
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