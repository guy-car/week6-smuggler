import { GameStateManager } from '../src/game/state';
import { GameState, RoleAssignment } from '../src/types';

describe('Game State Persistence', () => {
    let gameStateManager: GameStateManager;

    beforeEach(() => {
        gameStateManager = new GameStateManager();
    });

    describe('saveGameStateForPlayer', () => {
        it('should save game state for encoder player', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [
                    { type: 'encoder_hint', content: 'Hello', turnNumber: 1 }
                ],
                previousRoundsAnalysis: [],
                currentTurn: 'decoder',
                gameStatus: 'active'
            };

            const roles: RoleAssignment = {
                encoder: 'player1',
                decoder: 'player2'
            };

            const result = gameStateManager.saveGameStateForPlayer(gameState, 'player1', roles);

            expect(result.gameState).toEqual(gameState);
            expect(result.playerRole).toBe('encoder');
        });

        it('should save game state for decoder player', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                previousRoundsAnalysis: [],
                currentTurn: 'encoder',
                gameStatus: 'active'
            };

            const roles: RoleAssignment = {
                encoder: 'player1',
                decoder: 'player2'
            };

            const result = gameStateManager.saveGameStateForPlayer(gameState, 'player2', roles);

            expect(result.gameState).toEqual(gameState);
            expect(result.playerRole).toBe('decoder');
        });

        it('should return null role for unknown player', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                previousRoundsAnalysis: [],
                currentTurn: 'encoder',
                gameStatus: 'active'
            };

            const roles: RoleAssignment = {
                encoder: 'player1',
                decoder: 'player2'
            };

            const result = gameStateManager.saveGameStateForPlayer(gameState, 'player3', roles);

            expect(result.gameState).toEqual(gameState);
            expect(result.playerRole).toBeNull();
        });
    });

    describe('restoreGameStateForPlayer', () => {
        it('should allow rejoin when game state is compatible', () => {
            const savedGameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                previousRoundsAnalysis: [],
                currentTurn: 'encoder',
                gameStatus: 'active'
            };

            const currentGameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [
                    { type: 'encoder_hint', content: 'Hello', turnNumber: 1 }
                ],
                previousRoundsAnalysis: [],
                currentTurn: 'ai',
                gameStatus: 'active'
            };

            const roles: RoleAssignment = {
                encoder: 'player1',
                decoder: 'player2'
            };

            const result = gameStateManager.restoreGameStateForPlayer(
                savedGameState,
                currentGameState,
                'player1',
                roles
            );

            expect(result.canRejoin).toBe(true);
            expect(result.gameState).toEqual(currentGameState);
            expect(result.reason).toBeUndefined();
        });

        it('should not allow rejoin when game has ended', () => {
            const savedGameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                previousRoundsAnalysis: [],
                currentTurn: 'encoder',
                gameStatus: 'active'
            };

            const currentGameState: GameState = {
                score: 10,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                previousRoundsAnalysis: [],
                currentTurn: 'encoder',
                gameStatus: 'ended'
            };

            const roles: RoleAssignment = {
                encoder: 'player1',
                decoder: 'player2'
            };

            const result = gameStateManager.restoreGameStateForPlayer(
                savedGameState,
                currentGameState,
                'player1',
                roles
            );

            expect(result.canRejoin).toBe(false);
            expect(result.reason).toBe('Game has ended');
        });

        it('should not allow rejoin when player role not found', () => {
            const savedGameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                previousRoundsAnalysis: [],
                currentTurn: 'encoder',
                gameStatus: 'active'
            };

            const currentGameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                previousRoundsAnalysis: [],
                currentTurn: 'encoder',
                gameStatus: 'active'
            };

            const roles: RoleAssignment = {
                encoder: 'player1',
                decoder: 'player2'
            };

            const result = gameStateManager.restoreGameStateForPlayer(
                savedGameState,
                currentGameState,
                'player3',
                roles
            );

            expect(result.canRejoin).toBe(false);
            expect(result.reason).toBe('Player role not found');
        });

        it('should not allow rejoin when round has changed', () => {
            const savedGameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                previousRoundsAnalysis: [],
                currentTurn: 'encoder',
                gameStatus: 'active'
            };

            const currentGameState: GameState = {
                score: 6,
                currentRound: 2,
                secretWord: 'banana',
                conversationHistory: [],
                previousRoundsAnalysis: [],
                currentTurn: 'encoder',
                gameStatus: 'active'
            };

            const roles: RoleAssignment = {
                encoder: 'player1',
                decoder: 'player2'
            };

            const result = gameStateManager.restoreGameStateForPlayer(
                savedGameState,
                currentGameState,
                'player1',
                roles
            );

            expect(result.canRejoin).toBe(false);
            expect(result.reason).toBe('Game has progressed to a different round');
        });

        it('should not allow rejoin when secret word has changed', () => {
            const savedGameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                previousRoundsAnalysis: [],
                currentTurn: 'encoder',
                gameStatus: 'active'
            };

            const currentGameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'banana',
                conversationHistory: [],
                previousRoundsAnalysis: [],
                currentTurn: 'encoder',
                gameStatus: 'active'
            };

            const roles: RoleAssignment = {
                encoder: 'player1',
                decoder: 'player2'
            };

            const result = gameStateManager.restoreGameStateForPlayer(
                savedGameState,
                currentGameState,
                'player1',
                roles
            );

            expect(result.canRejoin).toBe(false);
            expect(result.reason).toBe('Game has changed secret word');
        });

        it('should not allow rejoin when score has changed significantly', () => {
            const savedGameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                previousRoundsAnalysis: [],
                currentTurn: 'encoder',
                gameStatus: 'active'
            };

            const currentGameState: GameState = {
                score: 8,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                previousRoundsAnalysis: [],
                currentTurn: 'encoder',
                gameStatus: 'active'
            };

            const roles: RoleAssignment = {
                encoder: 'player1',
                decoder: 'player2'
            };

            const result = gameStateManager.restoreGameStateForPlayer(
                savedGameState,
                currentGameState,
                'player1',
                roles
            );

            expect(result.canRejoin).toBe(true);
        });
    });

    describe('canPlayerRejoin', () => {
        it('should allow rejoin for active game with valid role', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                previousRoundsAnalysis: [],
                currentTurn: 'encoder',
                gameStatus: 'active'
            };

            const roles: RoleAssignment = {
                encoder: 'player1',
                decoder: 'player2'
            };

            const result = gameStateManager.canPlayerRejoin(gameState, 'player1', roles);

            expect(result.canRejoin).toBe(true);
            expect(result.reason).toBeUndefined();
        });

        it('should not allow rejoin for ended game', () => {
            const gameState: GameState = {
                score: 10,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                previousRoundsAnalysis: [],
                currentTurn: 'encoder',
                gameStatus: 'ended'
            };

            const roles: RoleAssignment = {
                encoder: 'player1',
                decoder: 'player2'
            };

            const result = gameStateManager.canPlayerRejoin(gameState, 'player1', roles);

            expect(result.canRejoin).toBe(false);
            expect(result.reason).toBe('Game is not active');
        });

        it('should not allow rejoin for player without role', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                previousRoundsAnalysis: [],
                currentTurn: 'encoder',
                gameStatus: 'active'
            };

            const roles: RoleAssignment = {
                encoder: 'player1',
                decoder: 'player2'
            };

            const result = gameStateManager.canPlayerRejoin(gameState, 'player3', roles);

            expect(result.canRejoin).toBe(false);
            expect(result.reason).toBe('Player does not have a role in this game');
        });
    });

    describe('getGameStateSummary', () => {
        it('should return correct summary for active game', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [
                    { type: 'encoder_hint', content: 'Hello', turnNumber: 1 }
                ],
                previousRoundsAnalysis: [],
                currentTurn: 'decoder',
                gameStatus: 'active'
            };

            const summary = gameStateManager.getGameStateSummary(gameState);

            expect(summary.score).toBe(5);
            expect(summary.round).toBe(1);
            expect(summary.currentTurn).toBe('decoder');
            expect(summary.messageCount).toBe(1);
            expect(summary.gameStatus).toBe('active');
        });

        it('should return correct summary for ended game', () => {
            const gameState: GameState = {
                score: 10,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                previousRoundsAnalysis: [],
                currentTurn: 'encoder',
                gameStatus: 'ended'
            };

            const summary = gameStateManager.getGameStateSummary(gameState);

            expect(summary.score).toBe(10);
            expect(summary.round).toBe(1);
            expect(summary.currentTurn).toBe('encoder');
            expect(summary.messageCount).toBe(0);
            expect(summary.gameStatus).toBe('ended');
        });

        it('should handle complex conversation history', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [
                    { type: 'encoder_hint', content: 'Hello', turnNumber: 1 },
                    { type: 'ai_analysis', thinking: ['T1', 'T2', 'T3', 'T4'], guess: 'banana', turnNumber: 2 },
                    { type: 'decoder_guess', guess: 'cherry', turnNumber: 3 }
                ],
                previousRoundsAnalysis: [],
                currentTurn: 'encoder',
                gameStatus: 'active'
            };

            const summary = gameStateManager.getGameStateSummary(gameState);

            expect(summary.messageCount).toBe(3);
            expect(summary.currentTurn).toBe('encoder');
        });
    });
}); 