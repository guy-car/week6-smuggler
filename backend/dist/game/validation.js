"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameValidator = void 0;
class GameValidator {
    constructor() {
        this.MAX_MESSAGE_LENGTH = 500;
        this.MIN_MESSAGE_LENGTH = 1;
        this.MAX_GUESS_LENGTH = 100;
    }
    validatePlayer(player) {
        const errors = [];
        if (!player || typeof player !== 'object') {
            errors.push('Player must be an object');
            return { valid: false, errors };
        }
        if (!player.id || typeof player.id !== 'string') {
            errors.push('Player ID is required and must be a string');
        }
        if (!player.name || typeof player.name !== 'string') {
            errors.push('Player name is required and must be a string');
        }
        if (player.name && player.name.trim().length === 0) {
            errors.push('Player name cannot be empty');
        }
        if (typeof player.ready !== 'boolean') {
            errors.push('Player ready status must be a boolean');
        }
        if (player.role && !['encryptor', 'decryptor', null].includes(player.role)) {
            errors.push('Player role must be encryptor, decryptor, or null');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    validateGameState(gameState) {
        const errors = [];
        if (!gameState || typeof gameState !== 'object') {
            errors.push('Game state must be an object');
            return { valid: false, errors };
        }
        if (typeof gameState.score !== 'number' || gameState.score < 0 || gameState.score > 10) {
            errors.push('Score must be a number between 0 and 10');
        }
        if (typeof gameState.currentRound !== 'number' || gameState.currentRound < 1) {
            errors.push('Current round must be a positive number');
        }
        if (!gameState.secretWord || typeof gameState.secretWord !== 'string') {
            errors.push('Secret word is required and must be a string');
        }
        if (!Array.isArray(gameState.conversationHistory)) {
            errors.push('Conversation history must be an array');
        }
        if (!Array.isArray(gameState.aiGuesses)) {
            errors.push('AI guesses must be an array');
        }
        if (!['encryptor', 'ai', 'decryptor'].includes(gameState.currentTurn)) {
            errors.push('Current turn must be encryptor, ai, or decryptor');
        }
        if (!['waiting', 'active', 'ended'].includes(gameState.gameStatus)) {
            errors.push('Game status must be waiting, active, or ended');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    validateMessage(message) {
        const errors = [];
        if (!message || typeof message !== 'object') {
            errors.push('Message must be an object');
            return { valid: false, errors };
        }
        if (!message.content || typeof message.content !== 'string') {
            errors.push('Message content is required and must be a string');
        }
        else {
            const content = message.content.trim();
            if (content.length < this.MIN_MESSAGE_LENGTH) {
                errors.push(`Message content must be at least ${this.MIN_MESSAGE_LENGTH} character long`);
            }
            if (content.length > this.MAX_MESSAGE_LENGTH) {
                errors.push(`Message content cannot exceed ${this.MAX_MESSAGE_LENGTH} characters`);
            }
        }
        if (!message.senderId || typeof message.senderId !== 'string') {
            errors.push('Sender ID is required and must be a string');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    validateAIGuess(aiGuess) {
        const errors = [];
        if (!aiGuess || typeof aiGuess !== 'object') {
            errors.push('AI guess must be an object');
            return { valid: false, errors };
        }
        if (!Array.isArray(aiGuess.thinking)) {
            errors.push('AI thinking process must be an array');
        }
        else {
            aiGuess.thinking.forEach((thought, index) => {
                if (typeof thought !== 'string') {
                    errors.push(`AI thinking item ${index} must be a string`);
                }
            });
        }
        if (!aiGuess.guess || typeof aiGuess.guess !== 'string') {
            errors.push('AI guess is required and must be a string');
        }
        else {
            const guess = aiGuess.guess.trim();
            if (guess.length === 0) {
                errors.push('AI guess cannot be empty');
            }
            if (guess.length > this.MAX_GUESS_LENGTH) {
                errors.push(`AI guess cannot exceed ${this.MAX_GUESS_LENGTH} characters`);
            }
        }
        if (typeof aiGuess.confidence !== 'number' || aiGuess.confidence < 0 || aiGuess.confidence > 1) {
            errors.push('AI confidence must be a number between 0 and 1');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    validateRoleAssignment(roles) {
        const errors = [];
        if (!roles || typeof roles !== 'object') {
            errors.push('Role assignment must be an object');
            return { valid: false, errors };
        }
        if (!roles.encryptor || typeof roles.encryptor !== 'string') {
            errors.push('Encryptor ID is required and must be a string');
        }
        if (!roles.decryptor || typeof roles.decryptor !== 'string') {
            errors.push('Decryptor ID is required and must be a string');
        }
        if (roles.encryptor === roles.decryptor) {
            errors.push('Encryptor and decryptor must be different players');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    validatePlayerGuess(guess) {
        const errors = [];
        if (!guess || typeof guess !== 'string') {
            errors.push('Guess must be a string');
            return { valid: false, errors };
        }
        const trimmedGuess = guess.trim();
        if (trimmedGuess.length === 0) {
            errors.push('Guess cannot be empty');
        }
        if (trimmedGuess.length > this.MAX_GUESS_LENGTH) {
            errors.push(`Guess cannot exceed ${this.MAX_GUESS_LENGTH} characters`);
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    validateRoomId(roomId) {
        const errors = [];
        if (!roomId || typeof roomId !== 'string') {
            errors.push('Room ID is required and must be a string');
        }
        else {
            if (roomId.trim().length === 0) {
                errors.push('Room ID cannot be empty');
            }
            if (roomId.length > 50) {
                errors.push('Room ID cannot exceed 50 characters');
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    validateGameAction(gameState, playerId, action, roles) {
        const errors = [];
        if (gameState.gameStatus !== 'active') {
            errors.push('Game is not active');
        }
        if (action === 'send_message') {
            if (gameState.currentTurn !== 'encryptor') {
                errors.push('Not encryptor\'s turn');
            }
            if (roles.encryptor !== playerId) {
                errors.push('Not the encryptor');
            }
        }
        else if (action === 'guess') {
            if (gameState.currentTurn !== 'decryptor') {
                errors.push('Not decryptor\'s turn');
            }
            if (roles.decryptor !== playerId) {
                errors.push('Not the decryptor');
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
}
exports.GameValidator = GameValidator;
//# sourceMappingURL=validation.js.map