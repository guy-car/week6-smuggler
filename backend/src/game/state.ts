import { AIGuess, GameState, Message, Player, RoleAssignment } from '../types';

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
            conversationHistory: [],
            aiGuesses: [],
            currentTurn: 'encryptor',
            gameStatus: 'active'
        };
    }

    /**
 * Assign roles to players
 */
    public assignRoles(players: Player[]): RoleAssignment {
        if (players.length !== 2) {
            throw new Error('Exactly 2 players required for role assignment');
        }

        // Randomly assign roles
        const shuffled = [...players].sort(() => Math.random() - 0.5);

        return {
            encryptor: shuffled[0]!.id,
            decryptor: shuffled[1]!.id
        };
    }

    /**
     * Add a message to conversation history
     */
    public addMessage(gameState: GameState, message: Omit<Message, 'id' | 'timestamp'>): GameState {
        const newMessage: Message = {
            ...message,
            id: this.generateId(),
            timestamp: new Date()
        };

        return {
            ...gameState,
            conversationHistory: [...gameState.conversationHistory, newMessage]
        };
    }

    /**
     * Add AI guess to game state
     */
    public addAIGuess(gameState: GameState, guess: Omit<AIGuess, 'id' | 'timestamp'>): GameState {
        const newGuess: AIGuess = {
            ...guess,
            id: this.generateId(),
            timestamp: new Date()
        };

        return {
            ...gameState,
            aiGuesses: [...gameState.aiGuesses, newGuess]
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
            aiGuesses: [],
            currentTurn: 'encryptor'
        };
    }

    /**
     * Switch roles between players
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
     * Validate guess against secret word
     */
    public validateGuess(guess: string, secretWord: string): boolean {
        return guess.toLowerCase().trim() === secretWord.toLowerCase().trim();
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
     * End game
     */
    public endGame(gameState: GameState): GameState {
        return {
            ...gameState,
            gameStatus: 'ended'
        };
    }

    /**
     * Generate unique ID
     */
    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
} 