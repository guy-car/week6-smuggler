import { GameStateManager } from '../src/game/state';
import { GameState } from '../src/types';

describe('Round Timer Tests', () => {
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

    describe('startRoundTimer', () => {
        it('should start a round timer with 3 minutes', () => {
            const gameState = gameStateManager.startRoundTimer(baseGameState);

            expect(gameState.roundExpiresAt).toBeDefined();
            expect(gameState.pausedRemainingTime).toBeUndefined();
            expect(gameState.timerState).toBe('running');

            // Check that the timer expires in approximately 3 minutes (180 seconds)
            const expiresAt = gameState.roundExpiresAt!;
            const now = Date.now();
            const timeUntilExpiry = expiresAt - now;

            // Should be between 179.5 and 180.5 seconds (allowing for test execution time)
            expect(timeUntilExpiry).toBeGreaterThan(179500);
            expect(timeUntilExpiry).toBeLessThan(180500);
        });
    });

    describe('pauseRoundTimer', () => {
        it('should pause a running timer and store remaining time', () => {
            // Start a timer
            let gameState = gameStateManager.startRoundTimer(baseGameState);

            // Pause the timer
            gameState = gameStateManager.pauseRoundTimer(gameState);

            expect(gameState.roundExpiresAt).toBeUndefined();
            expect(gameState.pausedRemainingTime).toBeDefined();
            expect(gameState.timerState).toBe('paused');
            expect(gameState.pausedRemainingTime).toBeGreaterThan(0);
            expect(gameState.pausedRemainingTime).toBeLessThanOrEqual(180);
        });

        it('should handle pausing an already paused timer', () => {
            // Start and pause a timer
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            gameState = gameStateManager.pauseRoundTimer(gameState);
            const pausedTime = gameState.pausedRemainingTime;

            // Try to pause again
            gameState = gameStateManager.pauseRoundTimer(gameState);

            expect(gameState.pausedRemainingTime).toBe(pausedTime);
            expect(gameState.timerState).toBe('paused');
        });
    });

    describe('resumeRoundTimer', () => {
        it('should resume a paused timer from where it left off', () => {
            // Start a timer
            let gameState = gameStateManager.startRoundTimer(baseGameState);

            // Wait a bit and pause
            gameState = gameStateManager.pauseRoundTimer(gameState);
            const pausedTime = gameState.pausedRemainingTime!;

            // Resume the timer
            gameState = gameStateManager.resumeRoundTimer(gameState);

            expect(gameState.roundExpiresAt).toBeDefined();
            expect(gameState.pausedRemainingTime).toBeUndefined();
            expect(gameState.timerState).toBe('running');

            // Check that the new expiration time accounts for the paused time
            const newExpiresAt = gameState.roundExpiresAt!;
            const now = Date.now();
            const timeUntilExpiry = newExpiresAt - now;

            // Should be approximately the paused time (allowing for test execution time)
            expect(timeUntilExpiry).toBeGreaterThan((pausedTime - 1) * 1000);
            expect(timeUntilExpiry).toBeLessThan((pausedTime + 1) * 1000);
        });

        it('should start a new timer if no paused time exists', () => {
            // Resume without any timer state
            const gameState = gameStateManager.resumeRoundTimer(baseGameState);

            expect(gameState.roundExpiresAt).toBeDefined();
            expect(gameState.pausedRemainingTime).toBeUndefined();
            expect(gameState.timerState).toBe('running');

            // Should be approximately 3 minutes
            const expiresAt = gameState.roundExpiresAt!;
            const now = Date.now();
            const timeUntilExpiry = expiresAt - now;

            expect(timeUntilExpiry).toBeGreaterThan(179500);
            expect(timeUntilExpiry).toBeLessThan(180500);
        });

        it('should not change a running timer', () => {
            // Start a timer
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            const originalExpiresAt = gameState.roundExpiresAt!;

            // Try to resume while running
            gameState = gameStateManager.resumeRoundTimer(gameState);

            expect(gameState.roundExpiresAt).toBe(originalExpiresAt);
            expect(gameState.timerState).toBe('running');
        });
    });

    describe('getRemainingTime', () => {
        it('should return correct remaining time for running timer', () => {
            const gameState = gameStateManager.startRoundTimer(baseGameState);
            const remainingTime = gameStateManager.getRemainingTime(gameState);

            expect(remainingTime).toBeGreaterThan(179);
            expect(remainingTime).toBeLessThanOrEqual(180);
        });

        it('should return paused time when timer is paused', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            gameState = gameStateManager.pauseRoundTimer(gameState);

            const remainingTime = gameStateManager.getRemainingTime(gameState);

            expect(remainingTime).toBe(gameState.pausedRemainingTime);
            expect(remainingTime).toBeGreaterThan(0);
            expect(remainingTime).toBeLessThanOrEqual(180);
        });

        it('should return 0 when no timer is active', () => {
            const remainingTime = gameStateManager.getRemainingTime(baseGameState);
            expect(remainingTime).toBe(0);
        });
    });

    describe('isRoundExpired', () => {
        it('should return false for a running timer that has not expired', () => {
            const gameState = gameStateManager.startRoundTimer(baseGameState);
            const isExpired = gameStateManager.isRoundExpired(gameState);

            expect(isExpired).toBe(false);
        });

        it('should return false for a paused timer with remaining time', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            gameState = gameStateManager.pauseRoundTimer(gameState);

            const isExpired = gameStateManager.isRoundExpired(gameState);

            expect(isExpired).toBe(false);
        });

        it('should return true for a paused timer with 0 remaining time', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            gameState = gameStateManager.pauseRoundTimer(gameState);

            // Manually set paused time to 0
            gameState.pausedRemainingTime = 0;

            const isExpired = gameStateManager.isRoundExpired(gameState);

            expect(isExpired).toBe(true);
        });

        it('should return false when no timer is active', () => {
            const isExpired = gameStateManager.isRoundExpired(baseGameState);
            expect(isExpired).toBe(false);
        });
    });

    describe('clearRoundTimer', () => {
        it('should clear both running timer and paused time', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            gameState = gameStateManager.pauseRoundTimer(gameState);

            gameState = gameStateManager.clearRoundTimer(gameState);

            expect(gameState.roundExpiresAt).toBeUndefined();
            expect(gameState.pausedRemainingTime).toBeUndefined();
            expect(gameState.timerState).toBeUndefined();
        });
    });

    describe('handleTimerExpiration', () => {
        it('should handle timer expiration and clear timer', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);

            // Manually set a very short expiration time
            gameState.roundExpiresAt = Date.now() - 1000; // Expired 1 second ago

            gameState = gameStateManager.handleTimerExpiration(gameState);

            expect(gameState.roundExpiresAt).toBeUndefined();
            expect(gameState.pausedRemainingTime).toBeUndefined();
            expect(gameState.score).toBe(4); // AI wins, score decreases
        });
    });

    describe('advanceTurn timer logic', () => {
        it('should pause timer when advancing to AI turn', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            gameState.currentTurn = 'encoder';

            gameState = gameStateManager.advanceTurn(gameState);

            expect(gameState.currentTurn).toBe('ai');
            expect(gameState.roundExpiresAt).toBeUndefined();
            expect(gameState.pausedRemainingTime).toBeDefined();
            expect(gameState.timerState).toBe('paused');
        });

        it('should resume timer when advancing from AI to human turn', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            gameState.currentTurn = 'ai';
            gameState = gameStateManager.pauseRoundTimer(gameState);

            gameState = gameStateManager.advanceTurn(gameState);

            expect(gameState.currentTurn).toBe('decoder');
            expect(gameState.roundExpiresAt).toBeDefined();
            expect(gameState.pausedRemainingTime).toBeUndefined();
            expect(gameState.timerState).toBe('running');
        });
    });
}); 