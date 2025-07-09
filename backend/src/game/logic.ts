import { GameState, Player, RoleAssignment } from '../types';
import { GameStateManager } from './state';
import { WordManager } from './wordManager';

export class GameLogic {
    private readonly gameStateManager: GameStateManager;
    private readonly wordManager: WordManager;

    constructor() {
        this.gameStateManager = new GameStateManager();
        this.wordManager = new WordManager();
    }

    /**
     * Start a new game
     * Assigns roles based on join order: first player is Encoder, second is Decoder
     */
    public startGame(players: Player[]): { gameState: GameState; roles: RoleAssignment; secretWord: string } {
        if (players.length !== 2) {
            throw new Error('Exactly 2 players required to start game');
        }

        const roles = this.gameStateManager.assignRoles(players);
        const secretWord = this.wordManager.selectRandomWord();
        const gameState = this.gameStateManager.createGameState(secretWord, players);

        return { gameState, roles, secretWord };
    }

    /**
     * Handle encoder sending a message
     */
    public handleEncoderMessage(
        gameState: GameState,
        message: string,
        roles: RoleAssignment
    ): { newGameState: GameState; shouldAdvanceTurn: boolean } {
        // Validate it's encoder's turn
        if (gameState.currentTurn !== 'encoder') {
            throw new Error('Not encoder\'s turn');
        }

        // Add message to conversation history
        const newGameState = this.gameStateManager.addEncoderTurn(gameState, message);

        return {
            newGameState,
            shouldAdvanceTurn: true
        };
    }

    /**
     * Handle AI response
     */
    public handleAIResponse(
        gameState: GameState,
        aiResponse: { thinking: string[]; guess: string }
    ): { newGameState: GameState; shouldAdvanceTurn: boolean; isCorrect: boolean } {
        // Add AI response to conversation history
        const newGameState = this.gameStateManager.addAITurn(
            gameState,
            aiResponse.thinking,
            aiResponse.guess
        );

        // Check if AI guessed correctly
        const isCorrect = this.gameStateManager.validateGuess(aiResponse.guess, gameState.secretWord);

        if (isCorrect) {
            // AI wins - decrease score and advance round
            const updatedState = this.gameStateManager.updateScore(newGameState, false);
            const finalState = this.gameStateManager.advanceRound(updatedState);

            return {
                newGameState: finalState,
                shouldAdvanceTurn: false,
                isCorrect: true
            };
        }

        // AI incorrect - advance turn to decoder
        return {
            newGameState,
            shouldAdvanceTurn: true,
            isCorrect: false
        };
    }

    /**
     * Handle decoder guess
     */
    public handleDecoderGuess(
        gameState: GameState,
        guess: string,
        playerId: string,
        roles: RoleAssignment
    ): { newGameState: GameState; shouldAdvanceTurn: boolean; isCorrect: boolean; isMessage: boolean } {
        // Validate it's decoder's turn
        if (gameState.currentTurn !== 'decoder') {
            throw new Error('Not decoder\'s turn');
        }

        // Validate it's the decoder's guess
        if (roles.decoder !== playerId) {
            throw new Error('Not decoder\'s turn');
        }

        // Check if guess is correct
        const isCorrect = this.gameStateManager.validateGuess(guess, gameState.secretWord);

        if (isCorrect) {
            // Players win - increase score and advance round
            const updatedState = this.gameStateManager.updateScore(gameState, true);
            const finalState = this.gameStateManager.advanceRound(updatedState);

            return {
                newGameState: finalState,
                shouldAdvanceTurn: false,
                isCorrect: true,
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

        // Decoder incorrect - add to conversation history as decoder turn and advance turn to AI
        const newGameState = this.gameStateManager.addDecoderTurn(gameState, guess);

        // For incorrect decoder guess, we want to go back to AI, not to encoder
        return {
            newGameState,
            shouldAdvanceTurn: true,
            isCorrect: false,
            isMessage: true
        };
    }
} 