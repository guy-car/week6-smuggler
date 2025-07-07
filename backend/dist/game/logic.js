"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameLogic = void 0;
const state_1 = require("./state");
const wordManager_1 = require("./wordManager");
class GameLogic {
    constructor() {
        this.gameStateManager = new state_1.GameStateManager();
        this.wordManager = new wordManager_1.WordManager();
    }
    startGame(players) {
        if (players.length !== 2) {
            throw new Error('Exactly 2 players required to start game');
        }
        const secretWord = this.wordManager.selectRandomWord();
        const gameState = this.gameStateManager.createGameState(secretWord, players);
        const roles = this.gameStateManager.assignRoles(players);
        return { gameState, roles, secretWord };
    }
    handleEncryptorMessage(gameState, message, roles) {
        if (gameState.currentTurn !== 'encryptor') {
            throw new Error('Not encryptor\'s turn');
        }
        const newGameState = this.gameStateManager.addMessage(gameState, message);
        const updatedGameState = this.gameStateManager.advanceTurn(newGameState);
        return {
            newGameState: updatedGameState,
            shouldAdvanceTurn: true
        };
    }
    handleAIGuess(gameState, aiGuess) {
        if (gameState.currentTurn !== 'ai') {
            throw new Error('Not AI\'s turn');
        }
        const newGameState = this.gameStateManager.addAIGuess(gameState, aiGuess);
        const isCorrect = this.gameStateManager.validateGuess(aiGuess.guess, gameState.secretWord);
        if (isCorrect) {
            const scoreUpdated = this.gameStateManager.updateScore(newGameState, false);
            const nextRound = this.gameStateManager.advanceRound(scoreUpdated);
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
        }
        else {
            const updatedGameState = this.gameStateManager.advanceTurn(newGameState);
            return {
                newGameState: updatedGameState,
                isCorrect: false,
                shouldAdvanceTurn: true
            };
        }
    }
    handleDecryptorGuess(gameState, guess, playerId, roles) {
        if (gameState.currentTurn !== 'decryptor') {
            throw new Error('Not decryptor\'s turn');
        }
        if (roles.decryptor !== playerId) {
            throw new Error('Not decryptor\'s turn');
        }
        const isCorrect = this.gameStateManager.validateGuess(guess, gameState.secretWord);
        if (isCorrect) {
            const scoreUpdated = this.gameStateManager.updateScore(gameState, true);
            const nextRound = this.gameStateManager.advanceRound(scoreUpdated);
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
        }
        else {
            const updatedGameState = this.gameStateManager.advanceTurn(gameState);
            return {
                newGameState: updatedGameState,
                isCorrect: false,
                shouldAdvanceTurn: true
            };
        }
    }
    getGameStatus(gameState) {
        return {
            isGameEnded: this.gameStateManager.isGameEnded(gameState),
            winner: this.gameStateManager.getGameWinner(gameState),
            currentTurn: this.gameStateManager.getCurrentTurn(gameState),
            score: gameState.score,
            round: gameState.currentRound
        };
    }
    canPlayerAct(gameState, playerId, action, roles) {
        if (gameState.gameStatus !== 'active') {
            return false;
        }
        if (action === 'send_message') {
            return gameState.currentTurn === 'encryptor' && roles.encryptor === playerId;
        }
        else if (action === 'guess') {
            return gameState.currentTurn === 'decryptor' && roles.decryptor === playerId;
        }
        return false;
    }
    getPlayerRole(playerId, roles) {
        return this.gameStateManager.getPlayerRole(playerId, roles);
    }
    switchRolesForNextRound(roles) {
        return this.gameStateManager.switchRoles([], roles);
    }
    getConversationHistory(gameState) {
        return [...gameState.conversationHistory];
    }
    getAIGuesses(gameState) {
        return [...gameState.aiGuesses];
    }
    getSecretWord(gameState) {
        return gameState.secretWord;
    }
}
exports.GameLogic = GameLogic;
//# sourceMappingURL=logic.js.map