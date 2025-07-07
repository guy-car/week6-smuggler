"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameStateManager = void 0;
class GameStateManager {
    constructor() {
        this.INITIAL_SCORE = 5;
        this.MAX_SCORE = 10;
        this.MIN_SCORE = 0;
        this.WIN_SCORE = 10;
        this.LOSE_SCORE = 0;
    }
    createGameState(secretWord, players) {
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
    assignRoles(players) {
        if (players.length !== 2) {
            throw new Error('Exactly 2 players required for role assignment');
        }
        const shuffled = [...players].sort(() => Math.random() - 0.5);
        return {
            encryptor: shuffled[0].id,
            decryptor: shuffled[1].id
        };
    }
    addMessage(gameState, message) {
        const newMessage = {
            ...message,
            id: this.generateId(),
            timestamp: new Date()
        };
        return {
            ...gameState,
            conversationHistory: [...gameState.conversationHistory, newMessage]
        };
    }
    addAIGuess(gameState, guess) {
        const newGuess = {
            ...guess,
            id: this.generateId(),
            timestamp: new Date()
        };
        return {
            ...gameState,
            aiGuesses: [...gameState.aiGuesses, newGuess]
        };
    }
    updateScore(gameState, correct) {
        let newScore = gameState.score;
        if (correct) {
            newScore = Math.min(this.MAX_SCORE, newScore + 1);
        }
        else {
            newScore = Math.max(this.MIN_SCORE, newScore - 1);
        }
        return {
            ...gameState,
            score: newScore
        };
    }
    advanceRound(gameState) {
        return {
            ...gameState,
            currentRound: gameState.currentRound + 1,
            conversationHistory: [],
            aiGuesses: [],
            currentTurn: 'encryptor'
        };
    }
    switchRoles(players, roles) {
        return {
            encryptor: roles.decryptor,
            decryptor: roles.encryptor
        };
    }
    isGameEnded(gameState) {
        return gameState.score >= this.WIN_SCORE || gameState.score <= this.LOSE_SCORE;
    }
    getGameWinner(gameState) {
        if (gameState.score >= this.WIN_SCORE) {
            return 'players';
        }
        else if (gameState.score <= this.LOSE_SCORE) {
            return 'ai';
        }
        return null;
    }
    validateGuess(guess, secretWord) {
        return guess.toLowerCase().trim() === secretWord.toLowerCase().trim();
    }
    getCurrentTurn(gameState) {
        return gameState.currentTurn;
    }
    advanceTurn(gameState) {
        const turnOrder = ['encryptor', 'ai', 'decryptor'];
        const currentIndex = turnOrder.indexOf(gameState.currentTurn);
        const nextIndex = (currentIndex + 1) % turnOrder.length;
        return {
            ...gameState,
            currentTurn: turnOrder[nextIndex]
        };
    }
    isPlayerTurn(gameState, playerId, roles) {
        if (gameState.currentTurn === 'encryptor') {
            return roles.encryptor === playerId;
        }
        else if (gameState.currentTurn === 'decryptor') {
            return roles.decryptor === playerId;
        }
        return false;
    }
    isAITurn(gameState) {
        return gameState.currentTurn === 'ai';
    }
    getPlayerRole(playerId, roles) {
        if (roles.encryptor === playerId) {
            return 'encryptor';
        }
        else if (roles.decryptor === playerId) {
            return 'decryptor';
        }
        return null;
    }
    endGame(gameState) {
        return {
            ...gameState,
            gameStatus: 'ended'
        };
    }
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}
exports.GameStateManager = GameStateManager;
//# sourceMappingURL=state.js.map