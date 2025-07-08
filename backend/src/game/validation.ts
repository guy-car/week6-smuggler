import { AIResponse, AITurn, GameState, InsiderTurn, OutsiderTurn, Player, RoleAssignment, Turn } from '../types';

export class GameValidator {
    private readonly MAX_MESSAGE_LENGTH = 500;
    private readonly MIN_MESSAGE_LENGTH = 1;
    private readonly MAX_GUESS_LENGTH = 12; // Updated to match spec (3-12 characters)
    private readonly MIN_GUESS_LENGTH = 3;  // Added minimum guess length
    private readonly AI_THINKING_SENTENCES = 4; // Exactly 4 sentences required
    private readonly MAX_THINKING_SENTENCE_LENGTH = 100;

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
        } else {
            // Validate each turn in conversation history
            const turnValidation = this.validateConversationHistory(state.conversationHistory);
            if (!turnValidation.valid) {
                errors.push(...turnValidation.errors);
            }
        }

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
     * Validate individual turn
     */
    public validateTurn(turn: unknown): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!turn || typeof turn !== 'object') {
            errors.push('Turn must be an object');
            return { valid: false, errors };
        }

        const turnObj = turn as Partial<Turn>;

        if (!turnObj.type || !['outsider_hint', 'ai_analysis', 'insider_guess'].includes(turnObj.type)) {
            errors.push('Turn type must be outsider_hint, ai_analysis, or insider_guess');
            return { valid: false, errors };
        }

        // Validate turn number
        if (typeof turnObj.turnNumber !== 'number' || turnObj.turnNumber < 1) {
            errors.push('Turn number must be a positive integer');
        }

        // Type-specific validation
        switch (turnObj.type) {
            case 'outsider_hint':
                const outsiderValidation = this.validateOutsiderTurn(turnObj as OutsiderTurn);
                if (!outsiderValidation.valid) {
                    errors.push(...outsiderValidation.errors);
                }
                break;
            case 'ai_analysis':
                const aiValidation = this.validateAITurn(turnObj as AITurn);
                if (!aiValidation.valid) {
                    errors.push(...aiValidation.errors);
                }
                break;
            case 'insider_guess':
                const insiderValidation = this.validateInsiderTurn(turnObj as InsiderTurn);
                if (!insiderValidation.valid) {
                    errors.push(...insiderValidation.errors);
                }
                break;
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate outsider turn
     */
    public validateOutsiderTurn(turn: OutsiderTurn): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!turn.content || typeof turn.content !== 'string') {
            errors.push('Outsider hint content is required and must be a string');
        } else {
            if (turn.content.length < this.MIN_MESSAGE_LENGTH) {
                errors.push(`Outsider hint content must be at least ${this.MIN_MESSAGE_LENGTH} character`);
            }

            if (turn.content.length > this.MAX_MESSAGE_LENGTH) {
                errors.push(`Outsider hint content must be no more than ${this.MAX_MESSAGE_LENGTH} characters`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate AI turn
     */
    public validateAITurn(turn: AITurn): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!Array.isArray(turn.thinking)) {
            errors.push('AI thinking process must be an array');
        } else {
            if (turn.thinking.length !== this.AI_THINKING_SENTENCES) {
                errors.push(`AI thinking process must contain exactly ${this.AI_THINKING_SENTENCES} sentences`);
            }

            turn.thinking.forEach((thought: unknown, index: number) => {
                if (typeof thought !== 'string') {
                    errors.push(`AI thinking sentence ${index} must be a string`);
                } else if (thought.trim().length === 0) {
                    errors.push(`AI thinking sentence ${index} cannot be empty`);
                } else if (thought.length > this.MAX_THINKING_SENTENCE_LENGTH) {
                    errors.push(`AI thinking sentence ${index} must be no more than ${this.MAX_THINKING_SENTENCE_LENGTH} characters`);
                }
            });
        }

        if (!turn.guess || typeof turn.guess !== 'string') {
            errors.push('AI guess is required and must be a string');
        } else {
            if (turn.guess.length < this.MIN_GUESS_LENGTH) {
                errors.push(`AI guess must be at least ${this.MIN_GUESS_LENGTH} characters`);
            }
            if (turn.guess.length > this.MAX_GUESS_LENGTH) {
                errors.push(`AI guess must be no more than ${this.MAX_GUESS_LENGTH} characters`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate insider turn
     */
    public validateInsiderTurn(turn: InsiderTurn): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!turn.guess || typeof turn.guess !== 'string') {
            errors.push('Insider guess is required and must be a string');
        } else {
            if (turn.guess.length < this.MIN_GUESS_LENGTH) {
                errors.push(`Insider guess must be at least ${this.MIN_GUESS_LENGTH} characters`);
            }
            if (turn.guess.length > this.MAX_GUESS_LENGTH) {
                errors.push(`Insider guess must be no more than ${this.MAX_GUESS_LENGTH} characters`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate conversation history (turn order and structure)
     */
    public validateConversationHistory(history: Turn[]): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Validate each turn individually
        for (let i = 0; i < history.length; i++) {
            const turnValidation = this.validateTurn(history[i]);
            if (!turnValidation.valid) {
                errors.push(`Turn ${i + 1}: ${turnValidation.errors.join(', ')}`);
            }
        }

        // Validate turn order
        const orderValidation = this.validateTurnOrder(history);
        if (!orderValidation.valid) {
            errors.push(...orderValidation.errors);
        }

        // Validate turn numbers are sequential
        const numberValidation = this.validateTurnNumbers(history);
        if (!numberValidation.valid) {
            errors.push(...numberValidation.errors);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate turn order follows the pattern: outsider → ai → insider → ai → outsider → ...
     */
    public validateTurnOrder(history: Turn[]): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (history.length === 0) {
            return { valid: true, errors: [] };
        }

        // First turn must be outsider_hint
        const firstTurn = history[0];
        if (!firstTurn || firstTurn.type !== 'outsider_hint') {
            errors.push('First turn must be outsider_hint');
        }

        // Validate subsequent turns follow the pattern
        for (let i = 1; i < history.length; i++) {
            const currentTurn = history[i];
            const previousTurn = history[i - 1];

            if (!currentTurn || !previousTurn) {
                errors.push(`Turn ${i + 1}: Invalid turn data`);
                continue;
            }

            switch (currentTurn.type) {
                case 'outsider_hint':
                    // outsider_hint can only follow ai_analysis
                    if (previousTurn.type !== 'ai_analysis') {
                        errors.push(`Turn ${i + 1}: outsider_hint can only follow ai_analysis, but previous turn was ${previousTurn.type}`);
                    }
                    break;
                case 'ai_analysis':
                    // ai_analysis can only follow outsider_hint or insider_guess
                    if (previousTurn.type !== 'outsider_hint' && previousTurn.type !== 'insider_guess') {
                        errors.push(`Turn ${i + 1}: ai_analysis can only follow outsider_hint or insider_guess, but previous turn was ${previousTurn.type}`);
                    }
                    break;
                case 'insider_guess':
                    // insider_guess can only follow ai_analysis
                    if (previousTurn.type !== 'ai_analysis') {
                        errors.push(`Turn ${i + 1}: insider_guess can only follow ai_analysis, but previous turn was ${previousTurn.type}`);
                    }
                    break;
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate turn numbers are sequential starting from 1
     */
    public validateTurnNumbers(history: Turn[]): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        for (let i = 0; i < history.length; i++) {
            const turn = history[i];
            if (!turn) {
                errors.push(`Turn ${i + 1}: Invalid turn data`);
                continue;
            }

            const expectedTurnNumber = i + 1;
            if (turn.turnNumber !== expectedTurnNumber) {
                errors.push(`Turn ${i + 1} has turnNumber ${turn.turnNumber}, but expected ${expectedTurnNumber}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate AI response (for API endpoint)
     */
    public validateAIResponse(aiResponse: unknown): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!aiResponse || typeof aiResponse !== 'object') {
            errors.push('AI response must be an object');
            return { valid: false, errors };
        }

        const response = aiResponse as Partial<AIResponse>;

        if (!Array.isArray(response.thinking)) {
            errors.push('Thinking process must be an array');
        } else {
            if (response.thinking.length !== this.AI_THINKING_SENTENCES) {
                errors.push(`Thinking process must contain exactly ${this.AI_THINKING_SENTENCES} sentences`);
            }

            response.thinking.forEach((thought: unknown, index: number) => {
                if (typeof thought !== 'string') {
                    errors.push(`Thinking process item ${index} must be a string`);
                } else if (thought.trim().length === 0) {
                    errors.push(`Thinking process item ${index} cannot be empty`);
                } else if (thought.length > this.MAX_THINKING_SENTENCE_LENGTH) {
                    errors.push(`Thinking process item ${index} must be no more than ${this.MAX_THINKING_SENTENCE_LENGTH} characters`);
                }
            });
        }

        if (!response.guess || typeof response.guess !== 'string') {
            errors.push('Guess is required and must be a string');
        } else {
            if (response.guess.length < this.MIN_GUESS_LENGTH) {
                errors.push(`Guess must be at least ${this.MIN_GUESS_LENGTH} characters`);
            }
            if (response.guess.length > this.MAX_GUESS_LENGTH) {
                errors.push(`Guess must be no more than ${this.MAX_GUESS_LENGTH} characters`);
            }
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

        if (guess.length < this.MIN_GUESS_LENGTH) {
            errors.push(`Guess must be at least ${this.MIN_GUESS_LENGTH} characters`);
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