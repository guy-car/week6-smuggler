import { AIGuess, GameState, Message, Player, RoleAssignment } from '../types';
import { GameStateManager } from './state';
import { WordManager } from './wordManager';

export class GameLogic {
    private gameStateManager: GameStateManager;
    private wordManager: WordManager;

    constructor() {
        this.gameStateManager = new GameStateManager();
        this.wordManager = new WordManager();
    }

    /**
     * Start a new game
     */
    public startGame(players: Player[]): { gameState: GameState; roles: RoleAssignment; secretWord: string } {
        if (players.length !== 2) {
            throw new Error('Exactly 2 players required to start game');
        }

        // Select random secret word
        const secretWord = this.wordManager.selectRandomWord();

        // Create game state
        const gameState = this.gameStateManager.createGameState(secretWord, players);

        // Assign roles
        const roles = this.gameStateManager.assignRoles(players);

        return { gameState, roles, secretWord };
    }

    /**
     * Handle encryptor sending a message
     */
    public handleEncryptorMessage(
        gameState: GameState,
        message: Omit<Message, 'id' | 'timestamp'>,
        roles: RoleAssignment
    ): { newGameState: GameState; shouldAdvanceTurn: boolean } {
        // Validate it's encryptor's turn
        if (gameState.currentTurn !== 'encryptor') {
            throw new Error('Not encryptor\'s turn');
        }

        // Add message to conversation history
        const newGameState = this.gameStateManager.addMessage(gameState, message);

        // Advance turn to AI
        const updatedGameState = this.gameStateManager.advanceTurn(newGameState);

        return {
            newGameState: updatedGameState,
            shouldAdvanceTurn: true
        };
    }

    /**
     * Handle AI guess
     */
    public handleAIGuess(
        gameState: GameState,
        aiGuess: Omit<AIGuess, 'id' | 'timestamp'>
    ): { newGameState: GameState; isCorrect: boolean; shouldAdvanceTurn: boolean } {
        // Validate it's AI's turn
        if (gameState.currentTurn !== 'ai') {
            throw new Error('Not AI\'s turn');
        }

        // Add AI guess to game state
        const newGameState = this.gameStateManager.addAIGuess(gameState, aiGuess);

        // Check if AI guess is correct
        const isCorrect = this.gameStateManager.validateGuess(aiGuess.guess, gameState.secretWord);

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
    ): { newGameState: GameState; isCorrect: boolean; shouldAdvanceTurn: boolean } {
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
                    shouldAdvanceTurn: false
                };
            }

            return {
                newGameState: nextRound,
                isCorrect: true,
                shouldAdvanceTurn: false
            };
        } else {
            // Decryptor incorrect - advance turn back to AI
            const updatedGameState = this.gameStateManager.advanceTurn(gameState);
            return {
                newGameState: updatedGameState,
                isCorrect: false,
                shouldAdvanceTurn: true
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
            currentTurn: this.gameStateManager.getCurrentTurn(gameState),
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
    public getConversationHistory(gameState: GameState): Message[] {
        return [...gameState.conversationHistory];
    }

    /**
     * Get AI guesses
     */
    public getAIGuesses(gameState: GameState): AIGuess[] {
        return [...gameState.aiGuesses];
    }

    /**
     * Get secret word (for testing/debugging)
     */
    public getSecretWord(gameState: GameState): string {
        return gameState.secretWord;
    }
} 