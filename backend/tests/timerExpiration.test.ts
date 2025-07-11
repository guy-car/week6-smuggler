import { GameStateManager } from '../src/game/state';
import { GameState } from '../src/types';

describe('Timer Expiration Tests', () => {
    let gameStateManager: GameStateManager;
    let baseGameState: GameState;

    beforeEach(() => {
        gameStateManager = new GameStateManager();
        baseGameState = {
            score: 3,
            currentRound: 1,
            secretWord: 'test',
            conversationHistory: [],
            previousRoundsAnalysis: [],
            currentTurn: 'encoder',
            gameStatus: 'active'
        };
    });

    describe('handleTimerExpiration', () => {
        it('should handle timer expiration and AI wins the point', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);

            // Manually set a very short expiration time
            gameState.roundExpiresAt = Date.now() - 1000; // Expired 1 second ago

            gameState = gameStateManager.handleTimerExpiration(gameState);

            expect(gameState.roundExpiresAt).toBeUndefined();
            expect(gameState.pausedRemainingTime).toBeUndefined();
            expect(gameState.timerState).toBeUndefined();
            expect(gameState.score).toBe(4); // AI wins, score decreases
        });

        it('should handle timer expiration when timer is paused', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            gameState = gameStateManager.pauseRoundTimer(gameState);

            // Set paused time to 0 to simulate expiration
            gameState.pausedRemainingTime = 0;

            gameState = gameStateManager.handleTimerExpiration(gameState);

            expect(gameState.roundExpiresAt).toBeUndefined();
            expect(gameState.pausedRemainingTime).toBeUndefined();
            expect(gameState.timerState).toBeUndefined();
            expect(gameState.score).toBe(4); // AI wins, score decreases
        });
    });

    describe('isRoundExpired', () => {
        it('should detect expired running timer', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);

            // Set expiration time in the past
            gameState.roundExpiresAt = Date.now() - 1000;

            expect(gameStateManager.isRoundExpired(gameState)).toBe(true);
        });

        it('should detect expired paused timer', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            gameState = gameStateManager.pauseRoundTimer(gameState);

            // Set paused time to 0
            gameState.pausedRemainingTime = 0;

            expect(gameStateManager.isRoundExpired(gameState)).toBe(true);
        });

        it('should not detect expiration for running timer with time remaining', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);

            expect(gameStateManager.isRoundExpired(gameState)).toBe(false);
        });

        it('should not detect expiration for paused timer with time remaining', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            gameState = gameStateManager.pauseRoundTimer(gameState);

            expect(gameStateManager.isRoundExpired(gameState)).toBe(false);
        });

        it('should not detect expiration when no timer is active', () => {
            expect(gameStateManager.isRoundExpired(baseGameState)).toBe(false);
        });
    });

    describe('Timer Expiration with Round Advancement', () => {
        it('should advance round after timer expiration', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);

            // Simulate timer expiration
            gameState.roundExpiresAt = Date.now() - 1000;
            gameState = gameStateManager.handleTimerExpiration(gameState);

            // Verify score was updated
            expect(gameState.score).toBe(4);

            // Verify timer was cleared
            expect(gameState.roundExpiresAt).toBeUndefined();
            expect(gameState.pausedRemainingTime).toBeUndefined();
            expect(gameState.timerState).toBeUndefined();
        });

        it('should start new round timer after round advancement', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);

            // Simulate timer expiration and round advancement
            gameState.roundExpiresAt = Date.now() - 1000;
            gameState = gameStateManager.handleTimerExpiration(gameState);

            // Advance to next round
            const roles = { encoder: 'player1', decoder: 'player2' };
            const { newGameState } = gameStateManager.advanceRound(gameState, roles);

            // Verify new round timer is started
            expect(newGameState.roundExpiresAt).toBeDefined();
            expect(newGameState.timerState).toBe('running');
            expect(newGameState.currentRound).toBe(2);
            expect(newGameState.conversationHistory).toEqual([]);
        });
    });

    describe('Timer Expiration Edge Cases', () => {
        it('should handle timer expiration during AI turn', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            gameState.currentTurn = 'ai';
            gameState = gameStateManager.pauseRoundTimer(gameState);

            // Set paused time to 0
            gameState.pausedRemainingTime = 0;

            expect(gameStateManager.isRoundExpired(gameState)).toBe(true);

            gameState = gameStateManager.handleTimerExpiration(gameState);
            expect(gameState.score).toBe(4); // AI wins
        });

        it('should handle timer expiration during decoder turn', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            gameState.currentTurn = 'decoder';

            // Set expiration time in the past
            gameState.roundExpiresAt = Date.now() - 1000;

            expect(gameStateManager.isRoundExpired(gameState)).toBe(true);

            gameState = gameStateManager.handleTimerExpiration(gameState);
            expect(gameState.score).toBe(4); // AI wins
        });

        it('should handle multiple timer expirations', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);

            // First expiration
            gameState.roundExpiresAt = Date.now() - 1000;
            gameState = gameStateManager.handleTimerExpiration(gameState);
            expect(gameState.score).toBe(4);

            // Advance round and start new timer
            const roles = { encoder: 'player1', decoder: 'player2' };
            const { newGameState } = gameStateManager.advanceRound(gameState, roles);
            gameState = newGameState;

            // Second expiration
            gameState.roundExpiresAt = Date.now() - 1000;
            gameState = gameStateManager.handleTimerExpiration(gameState);
            expect(gameState.score).toBe(3); // Score decreases again
        });
    });

    describe('Timer Expiration with Game End', () => {
        it('should end game when score reaches 0 after timer expiration', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            gameState.score = 1; // One point away from AI win

            // Simulate timer expiration
            gameState.roundExpiresAt = Date.now() - 1000;
            gameState = gameStateManager.handleTimerExpiration(gameState);

            expect(gameState.score).toBe(0);
            expect(gameStateManager.isGameEnded(gameState)).toBe(true);
            expect(gameStateManager.getGameWinner(gameState)).toBe('ai');
        });

        it('should not end game when score is above 0 after timer expiration', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            gameState.score = 3; // Multiple points remaining

            // Simulate timer expiration
            gameState.roundExpiresAt = Date.now() - 1000;
            gameState = gameStateManager.handleTimerExpiration(gameState);

            expect(gameState.score).toBe(2);
            expect(gameStateManager.isGameEnded(gameState)).toBe(false);
        });
    });
}); 