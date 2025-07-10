import { GameStateManager } from '../src/game/state';
import { GameState, RoleAssignment } from '../src/types';

describe('Game State Persistence', () => {
    let gameStateManager: GameStateManager;

    beforeEach(() => {
        gameStateManager = new GameStateManager();
    });

    describe('saveGameStateForPlayer', () => {
        it('should save game state for encryptor player', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [
                    { type: 'outsider_hint', content: 'Hello', turnNumber: 1 }
                ],
                previousRoundsAnalysis: [],
                currentTurn: 'decryptor',
                gameStatus: 'active'
            };

            const roles: RoleAssignment = {
                encryptor: 'player1',
                decryptor: 'player2'
            };

            const result = gameStateManager.saveGameStateForPlayer(gameState, 'player1', roles);

            expect(result.gameState).toEqual(gameState);
            expect(result.playerRole).toBe('encryptor');
        });

        it('should save game state for decryptor player', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                currentTurn: 'encryptor',
                gameStatus: 'active'
            };

            const roles: RoleAssignment = {
                encryptor: 'player1',
                decryptor: 'player2'
            };

            const result = gameStateManager.saveGameStateForPlayer(gameState, 'player2', roles);

            expect(result.gameState).toEqual(gameState);
            expect(result.playerRole).toBe('decryptor');
        });

        it('should return null role for unknown player', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                currentTurn: 'encryptor',
                gameStatus: 'active'
            };

            const roles: RoleAssignment = {
                encryptor: 'player1',
                decryptor: 'player2'
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
                currentTurn: 'encryptor',
                gameStatus: 'active'
            };

            const currentGameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [
                    { type: 'outsider_hint', content: 'Hello', turnNumber: 1 }
                ],
                currentTurn: 'ai',
                gameStatus: 'active'
            };

            const roles: RoleAssignment = {
                encryptor: 'player1',
                decryptor: 'player2'
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
                currentTurn: 'encryptor',
                gameStatus: 'active'
            };

            const currentGameState: GameState = {
                score: 10,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                currentTurn: 'encryptor',
                gameStatus: 'ended'
            };

            const roles: RoleAssignment = {
                encryptor: 'player1',
                decryptor: 'player2'
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
                currentTurn: 'encryptor',
                gameStatus: 'active'
            };

            const currentGameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                currentTurn: 'encryptor',
                gameStatus: 'active'
            };

            const roles: RoleAssignment = {
                encryptor: 'player1',
                decryptor: 'player2'
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
                currentTurn: 'encryptor',
                gameStatus: 'active'
            };

            const currentGameState: GameState = {
                score: 6,
                currentRound: 2,
                secretWord: 'banana',
                conversationHistory: [],
                currentTurn: 'encryptor',
                gameStatus: 'active'
            };

            const roles: RoleAssignment = {
                encryptor: 'player1',
                decryptor: 'player2'
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
                currentTurn: 'encryptor',
                gameStatus: 'active'
            };

            const currentGameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'banana',
                conversationHistory: [],
                currentTurn: 'encryptor',
                gameStatus: 'active'
            };

            const roles: RoleAssignment = {
                encryptor: 'player1',
                decryptor: 'player2'
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
                currentTurn: 'encryptor',
                gameStatus: 'active'
            };

            const currentGameState: GameState = {
                score: 8,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                currentTurn: 'encryptor',
                gameStatus: 'active'
            };

            const roles: RoleAssignment = {
                encryptor: 'player1',
                decryptor: 'player2'
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

    describe('getGameStateSummary', () => {
        it('should return correct summary for active game', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [
                    { type: 'outsider_hint', content: 'Hello', turnNumber: 1 },
                    { type: 'ai_analysis', thinking: ['thinking...'], guess: 'banana', turnNumber: 2 }
                ],
                currentTurn: 'decryptor',
                gameStatus: 'active'
            };

            const summary = gameStateManager.getGameStateSummary(gameState);

            expect(summary.score).toBe(5);
            expect(summary.round).toBe(1);
            expect(summary.currentTurn).toBe('decryptor');
            expect(summary.messageCount).toBe(2);
            expect(summary.gameStatus).toBe('active');
        });

        it('should return correct summary for empty game', () => {
            const gameState: GameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                currentTurn: 'encryptor',
                gameStatus: 'active'
            };

            const summary = gameStateManager.getGameStateSummary(gameState);

            expect(summary.score).toBe(5);
            expect(summary.round).toBe(1);
            expect(summary.currentTurn).toBe('encryptor');
            expect(summary.messageCount).toBe(0);
            expect(summary.gameStatus).toBe('active');
        });

        it('should return correct summary for ended game', () => {
            const gameState: GameState = {
                score: 10,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [
                    { type: 'outsider_hint', content: 'Hello', turnNumber: 1 },
                    { type: 'ai_analysis', thinking: ['thinking...'], guess: 'banana', turnNumber: 2 },
                    { type: 'insider_guess', guess: 'cherry', turnNumber: 3 }
                ],
                currentTurn: 'encryptor',
                gameStatus: 'ended'
            };

            const summary = gameStateManager.getGameStateSummary(gameState);

            expect(summary.score).toBe(10);
            expect(summary.round).toBe(1);
            expect(summary.currentTurn).toBe('encryptor');
            expect(summary.messageCount).toBe(3);
            expect(summary.gameStatus).toBe('ended');
        });
    });


}); 