import { GameState, Player, RoleAssignment } from '../types';

export class GameValidator {
    private readonly MAX_MESSAGE_LENGTH = 500;
    private readonly MIN_MESSAGE_LENGTH = 1;
    private readonly MAX_GUESS_LENGTH = 100;

    /**
     * Validate player data
     */
    public validatePlayer(player: unknown): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!player || typeof player !== 'object') {
            errors.push('Player must be an object');
            return { valid: false, errors };
        }

        const playerObj = player as Partial<Player>;

        if (!playerObj.id || typeof playerObj.id !== 'string') {
            errors.push('Player ID is required and must be a string');
        }

        if (!playerObj.name || typeof playerObj.name !== 'string') {
            errors.push('Player name is required and must be a string');
        }

        if (playerObj.name && playerObj.name.trim().length === 0) {
            errors.push('Player name cannot be empty');
        }

        if (typeof playerObj.ready !== 'boolean') {
            errors.push('Player ready status must be a boolean');
        }

        if (playerObj.role && !['encryptor', 'decryptor', null].includes(playerObj.role)) {
            errors.push('Player role must be encryptor, decryptor, or null');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate game state
     */
    public validateGameState(gameState: unknown): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!gameState || typeof gameState !== 'object') {
            errors.push('Game state must be an object');
            return { valid: false, errors };
        }

        const state = gameState as Partial<GameState>;

        if (typeof state.score !== 'number') {
            errors.push('Score must be a number');
        }

        if (typeof state.currentRound !== 'number') {
            errors.push('Current round must be a number');
        }

        if (!state.secretWord || typeof state.secretWord !== 'string') {
            errors.push('Secret word is required and must be a string');
        }

        if (!Array.isArray(state.conversationHistory)) {
            errors.push('Conversation history must be an array');
        }

        // aiGuesses array is removed, so we don't validate it

        if (!state.currentTurn || !['encryptor', 'ai', 'decryptor'].includes(state.currentTurn)) {
            errors.push('Current turn must be encryptor, ai, or decryptor');
        }

        if (!state.gameStatus || !['waiting', 'active', 'ended'].includes(state.gameStatus)) {
            errors.push('Game status must be waiting, active, or ended');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate message
     */
    public validateMessage(message: unknown): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!message || typeof message !== 'object') {
            errors.push('Message must be an object');
            return { valid: false, errors };
        }

        const msg = message as Partial<{ content: string; senderId: string }>;

        if (!msg.content || typeof msg.content !== 'string') {
            errors.push('Message content is required and must be a string');
        } else {
            if (msg.content.length < this.MIN_MESSAGE_LENGTH) {
                errors.push(`Message content must be at least ${this.MIN_MESSAGE_LENGTH} character`);
            }

            if (msg.content.length > this.MAX_MESSAGE_LENGTH) {
                errors.push(`Message content must be no more than ${this.MAX_MESSAGE_LENGTH} characters`);
            }
        }

        if (!msg.senderId || typeof msg.senderId !== 'string') {
            errors.push('Sender ID is required and must be a string');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate AI response
     */
    public validateAIResponse(aiResponse: unknown): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!aiResponse || typeof aiResponse !== 'object') {
            errors.push('AI response must be an object');
            return { valid: false, errors };
        }

        const response = aiResponse as { thinking?: unknown; guess?: unknown };

        if (!Array.isArray(response.thinking)) {
            errors.push('Thinking process must be an array');
        } else {
            response.thinking.forEach((thought: unknown, index: number) => {
                if (typeof thought !== 'string') {
                    errors.push(`Thinking process item ${index} must be a string`);
                } else if (thought.length > 100) {
                    errors.push(`Thinking process item ${index} must be no more than 100 characters`);
                }
            });
        }

        if (!response.guess || typeof response.guess !== 'string') {
            errors.push('Guess is required and must be a string');
        } else if (response.guess.length > this.MAX_GUESS_LENGTH) {
            errors.push(`Guess must be no more than ${this.MAX_GUESS_LENGTH} characters`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate role assignment
     */
    public validateRoleAssignment(roles: unknown): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!roles || typeof roles !== 'object') {
            errors.push('Roles must be an object');
            return { valid: false, errors };
        }

        const roleAssignment = roles as Partial<RoleAssignment>;

        if (!roleAssignment.encryptor || typeof roleAssignment.encryptor !== 'string') {
            errors.push('Encryptor ID is required and must be a string');
        }

        if (!roleAssignment.decryptor || typeof roleAssignment.decryptor !== 'string') {
            errors.push('Decryptor ID is required and must be a string');
        }

        if (roleAssignment.encryptor === roleAssignment.decryptor) {
            errors.push('Encryptor and decryptor must be different players');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate player guess
     */
    public validatePlayerGuess(guess: unknown): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!guess || typeof guess !== 'string') {
            errors.push('Guess must be a string');
            return { valid: false, errors };
        }

        if (guess.trim().length === 0) {
            errors.push('Guess cannot be empty');
        }

        if (guess.length > this.MAX_GUESS_LENGTH) {
            errors.push(`Guess must be no more than ${this.MAX_GUESS_LENGTH} characters`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate room ID
     */
    public validateRoomId(roomId: unknown): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!roomId || typeof roomId !== 'string') {
            errors.push('Room ID must be a string');
            return { valid: false, errors };
        }

        if (roomId.trim().length === 0) {
            errors.push('Room ID cannot be empty');
        }

        if (roomId.length > 50) {
            errors.push('Room ID must be no more than 50 characters');
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(roomId)) {
            errors.push('Room ID must contain only alphanumeric characters, hyphens, and underscores');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate game action
     */
    public validateGameAction(
        gameState: GameState,
        playerId: string,
        action: 'send_message' | 'guess',
        roles: RoleAssignment
    ): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

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
        } else if (action === 'guess') {
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