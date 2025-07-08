import { GameLogic } from '../src/game/logic';
import { GameState, RoleAssignment } from '../src/types';

describe('Game Logic Validation', () => {
    let gameLogic: GameLogic;

    beforeEach(() => {
        gameLogic = new GameLogic();
    });

    describe('validateConversationFlow', () => {
        it('should return valid for proper conversation flow', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [
                    { id: '1', content: 'Hello', senderId: 'player1', timestamp: new Date() },
                    { id: '2', content: 'Hi there', senderId: 'player2', timestamp: new Date() }
                ],
                aiGuesses: [
                    { id: '1', thinking: ['thinking...'], guess: 'banana', confidence: 0.5, timestamp: new Date() }
                ],
                currentTurn: 'decryptor',
                gameStatus: 'active'
            };

            const result = gameLogic.validateConversationFlow(gameState);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should return invalid when game is not active', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                aiGuesses: [],
                currentTurn: 'encryptor',
                gameStatus: 'ended'
            };

            const result = gameLogic.validateConversationFlow(gameState);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Game is not active');
        });

        it('should return invalid when conversation has not started', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                aiGuesses: [],
                currentTurn: 'encryptor',
                gameStatus: 'active'
            };

            const result = gameLogic.validateConversationFlow(gameState);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Conversation has not started');
        });

        it('should return invalid when AI has not made guesses', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [
                    { id: '1', content: 'Hello', senderId: 'player1', timestamp: new Date() }
                ],
                aiGuesses: [],
                currentTurn: 'ai',
                gameStatus: 'active'
            };

            const result = gameLogic.validateConversationFlow(gameState);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('AI has not made any guesses yet');
        });

        it('should return invalid when not enough messages', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [
                    { id: '1', content: 'Hello', senderId: 'player1', timestamp: new Date() }
                ],
                aiGuesses: [
                    { id: '1', thinking: ['thinking...'], guess: 'banana', confidence: 0.5, timestamp: new Date() }
                ],
                currentTurn: 'decryptor',
                gameStatus: 'active'
            };

            const result = gameLogic.validateConversationFlow(gameState);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Not enough messages for meaningful conversation');
        });
    });

    describe('validateTurnOrder', () => {
        const roles: RoleAssignment = {
            encryptor: 'player1',
            decryptor: 'player2'
        };

        it('should return valid for encryptor sending message on their turn', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                aiGuesses: [],
                currentTurn: 'encryptor',
                gameStatus: 'active'
            };

            const result = gameLogic.validateTurnOrder(gameState, 'player1', 'send_message', roles);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should return invalid when encryptor tries to send message on wrong turn', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                aiGuesses: [],
                currentTurn: 'decryptor',
                gameStatus: 'active'
            };

            const result = gameLogic.validateTurnOrder(gameState, 'player1', 'send_message', roles);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Not encryptor\'s turn');
        });

        it('should return invalid when wrong player tries to send message', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                aiGuesses: [],
                currentTurn: 'encryptor',
                gameStatus: 'active'
            };

            const result = gameLogic.validateTurnOrder(gameState, 'player2', 'send_message', roles);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Only encryptor can send messages');
        });

        it('should return valid for decryptor making guess on their turn', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                aiGuesses: [],
                currentTurn: 'decryptor',
                gameStatus: 'active'
            };

            const result = gameLogic.validateTurnOrder(gameState, 'player2', 'guess', roles);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should return invalid when decryptor tries to guess on wrong turn', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                aiGuesses: [],
                currentTurn: 'encryptor',
                gameStatus: 'active'
            };

            const result = gameLogic.validateTurnOrder(gameState, 'player2', 'guess', roles);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Not decryptor\'s turn');
        });

        it('should return invalid when wrong player tries to guess', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                aiGuesses: [],
                currentTurn: 'decryptor',
                gameStatus: 'active'
            };

            const result = gameLogic.validateTurnOrder(gameState, 'player1', 'guess', roles);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Only decryptor can make guesses');
        });
    });

    describe('validateGameStateConsistency', () => {
        it('should return valid for consistent game state', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                aiGuesses: [],
                currentTurn: 'encryptor',
                gameStatus: 'active'
            };

            const result = gameLogic.validateGameStateConsistency(gameState);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should return invalid when score is out of bounds', () => {
            const gameState: GameState = {
                score: 11,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                aiGuesses: [],
                currentTurn: 'encryptor',
                gameStatus: 'active'
            };

            const result = gameLogic.validateGameStateConsistency(gameState);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Score is out of bounds (0-10)');
        });

        it('should return invalid when round number is less than 1', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 0,
                secretWord: 'apple',
                conversationHistory: [],
                aiGuesses: [],
                currentTurn: 'encryptor',
                gameStatus: 'active'
            };

            const result = gameLogic.validateGameStateConsistency(gameState);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Round number must be at least 1');
        });

        it('should return invalid when game should be ended but status is active', () => {
            const gameState: GameState = {
                score: 10,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                aiGuesses: [],
                currentTurn: 'encryptor',
                gameStatus: 'active'
            };

            const result = gameLogic.validateGameStateConsistency(gameState);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Game should be ended but status is still active');
        });

        it('should return invalid when game is ended but score is not at win/lose condition', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                aiGuesses: [],
                currentTurn: 'encryptor',
                gameStatus: 'ended'
            };

            const result = gameLogic.validateGameStateConsistency(gameState);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Game is ended but score is not at win/lose condition');
        });

        it('should return valid when game is ended with correct score', () => {
            const gameState: GameState = {
                score: 10,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                aiGuesses: [],
                currentTurn: 'encryptor',
                gameStatus: 'ended'
            };

            const result = gameLogic.validateGameStateConsistency(gameState);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });
}); 