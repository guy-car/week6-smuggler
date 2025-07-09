import { GameStateManager } from '../src/game/state';
import { Player, RoleAssignment } from '../src/types';

describe('GameStateManager', () => {
    let gameStateManager: GameStateManager;
    let players: Player[];
    let roles: RoleAssignment;

    beforeEach(() => {
        gameStateManager = new GameStateManager();
        players = [
            { id: 'player1', name: 'Player 1', ready: true, role: 'encoder', socketId: 'socket1' },
            { id: 'player2', name: 'Player 2', ready: true, role: 'decoder', socketId: 'socket2' }
        ];
        roles = {
            encoder: 'player1',
            decoder: 'player2'
        };
    });

    describe('createGameState', () => {
        it('should create initial game state', () => {
            const gameState = gameStateManager.createGameState('secret', players);

            expect(gameState).toEqual({
                score: 5,
                currentRound: 1,
                secretWord: 'secret',
                conversationHistory: [],
                currentTurn: 'encoder',
                gameStatus: 'active'
            });
        });
    });

    describe('assignRoles', () => {
        it('should assign roles to players', () => {
            const assignedRoles = gameStateManager.assignRoles(players);

            expect(assignedRoles).toEqual({
                encoder: 'player1',
                decoder: 'player2'
            });
        });

        it('should throw error if not enough players', () => {
            expect(() => {
                gameStateManager.assignRoles([players[0]!]);
            }).toThrow('Not enough players to assign roles');
        });
    });

    describe('addEncoderTurn', () => {
        it('should add encoder turn to conversation history', () => {
            const gameState = gameStateManager.createGameState('secret', players);
            const updatedState = gameStateManager.addEncoderTurn(gameState, 'hint message');

            expect(updatedState.conversationHistory).toHaveLength(1);
            expect(updatedState.conversationHistory[0]).toEqual({
                type: 'encoder',
                content: 'hint message',
                turnNumber: 1
            });
            expect(updatedState.currentTurn).toBe('ai');
        });
    });

    describe('addAITurn', () => {
        it('should add AI turn to conversation history', () => {
            const gameState = gameStateManager.createGameState('secret', players);
            const updatedState = gameStateManager.addAITurn(
                gameState,
                ['thought1', 'thought2', 'thought3', 'thought4'],
                'guess'
            );

            expect(updatedState.conversationHistory).toHaveLength(1);
            expect(updatedState.conversationHistory[0]).toEqual({
                type: 'ai_analysis',
                thinking: ['thought1', 'thought2', 'thought3', 'thought4'],
                guess: 'guess',
                turnNumber: 1
            });
            expect(updatedState.currentTurn).toBe('decoder');
        });
    });

    describe('addDecoderTurn', () => {
        it('should add decoder turn to conversation history', () => {
            const gameState = gameStateManager.createGameState('secret', players);
            const updatedState = gameStateManager.addDecoderTurn(gameState, 'guess');

            expect(updatedState.conversationHistory).toHaveLength(1);
            expect(updatedState.conversationHistory[0]).toEqual({
                type: 'decoder',
                guess: 'guess',
                turnNumber: 1
            });
            expect(updatedState.currentTurn).toBe('encoder');
        });
    });

    describe('swapRoles', () => {
        it('should swap roles between players', () => {
            const swappedRoles = gameStateManager.swapRoles(roles);

            expect(swappedRoles).toEqual({
                encoder: 'player2',
                decoder: 'player1'
            });
        });
    });

    describe('isPlayerTurn', () => {
        it('should return true when it is encoder turn and encoder player', () => {
            const gameState = gameStateManager.createGameState('secret', players);
            expect(gameStateManager.isPlayerTurn(gameState, 'player1', roles)).toBe(true);
        });

        it('should return false when it is encoder turn and decoder player', () => {
            const gameState = gameStateManager.createGameState('secret', players);
            expect(gameStateManager.isPlayerTurn(gameState, 'player2', roles)).toBe(false);
        });

        it('should return false when it is AI turn', () => {
            const gameState = gameStateManager.createGameState('secret', players);
            const stateWithAITurn = gameStateManager.addEncoderTurn(gameState, 'hint');
            expect(gameStateManager.isPlayerTurn(stateWithAITurn, 'player1', roles)).toBe(false);
            expect(gameStateManager.isPlayerTurn(stateWithAITurn, 'player2', roles)).toBe(false);
        });
    });

    describe('getPlayerRole', () => {
        it('should return encoder role for encoder player', () => {
            expect(gameStateManager.getPlayerRole('player1', roles)).toBe('encoder');
        });

        it('should return decoder role for decoder player', () => {
            expect(gameStateManager.getPlayerRole('player2', roles)).toBe('decoder');
        });

        it('should return null for unknown player', () => {
            expect(gameStateManager.getPlayerRole('unknown', roles)).toBeNull();
        });
    });

    describe('transformToAnalyzeRequest', () => {
        it('should transform game state to analyze request format', () => {
            const gameState = gameStateManager.createGameState('secret', players);
            const withMessage = gameStateManager.addEncoderTurn(gameState, 'hint');
            const request = gameStateManager.transformToAnalyzeRequest(withMessage, 'room123');

            expect(request).toEqual({
                gameId: 'room123',
                conversationHistory: [{
                    type: 'encoder',
                    content: 'hint',
                    turnNumber: 1
                }]
            });
        });

        it('should handle optional gameId', () => {
            const gameState = gameStateManager.createGameState('secret', players);
            const request = gameStateManager.transformToAnalyzeRequest(gameState);

            expect(request).toEqual({
                conversationHistory: []
            });
        });
    });
});

