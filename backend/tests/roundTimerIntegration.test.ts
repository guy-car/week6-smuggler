import { GameStateManager } from '../src/game/state';
import { GameState } from '../src/types';

describe('Round Timer Integration Tests', () => {
    let gameStateManager: GameStateManager;
    let baseGameState: GameState;

    beforeEach(() => {
        gameStateManager = new GameStateManager();
        baseGameState = {
            score: 5,
            currentRound: 1,
            secretWord: 'test',
            conversationHistory: [],
            previousRoundsAnalysis: [],
            currentTurn: 'encoder',
            gameStatus: 'active'
        };
    });

    describe('Complete Round Timer Lifecycle', () => {
        it('should start timer at beginning of each round', () => {
            // Start first round
            let gameState = gameStateManager.startRoundTimer(baseGameState);

            expect(gameState.roundExpiresAt).toBeDefined();
            expect(gameState.timerState).toBe('running');
            expect(gameStateManager.getRemainingTime(gameState)).toBeGreaterThan(179);
            expect(gameStateManager.getRemainingTime(gameState)).toBeLessThanOrEqual(180);

            // Advance to next round
            const roles = { encoder: 'player1', decoder: 'player2' };
            const { newGameState } = gameStateManager.advanceRound(gameState, roles);

            // Verify new round timer is started
            expect(newGameState.roundExpiresAt).toBeDefined();
            expect(newGameState.timerState).toBe('running');
            expect(newGameState.currentRound).toBe(2);
            expect(gameStateManager.getRemainingTime(newGameState)).toBeGreaterThan(179);
            expect(gameStateManager.getRemainingTime(newGameState)).toBeLessThanOrEqual(180);
        });

        it('should pause timer during AI turns and resume during human turns', () => {
            // Start round timer
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            const initialRemainingTime = gameStateManager.getRemainingTime(gameState);

            // Advance to AI turn (should pause timer)
            gameState = gameStateManager.advanceTurn(gameState);
            expect(gameState.currentTurn).toBe('ai');
            expect(gameState.roundExpiresAt).toBeUndefined();
            expect(gameState.pausedRemainingTime).toBeDefined();
            expect(gameState.timerState).toBe('paused');
            expect(gameStateManager.getRemainingTime(gameState)).toBe(initialRemainingTime);

            // Advance to decoder turn (should resume timer)
            gameState = gameStateManager.advanceTurn(gameState);
            expect(gameState.currentTurn).toBe('decoder');
            expect(gameState.roundExpiresAt).toBeDefined();
            expect(gameState.pausedRemainingTime).toBeUndefined();
            expect(gameState.timerState).toBe('running');

            // Timer should resume from where it was paused
            const resumedRemainingTime = gameStateManager.getRemainingTime(gameState);
            expect(resumedRemainingTime).toBeLessThanOrEqual(initialRemainingTime);
            expect(resumedRemainingTime).toBeGreaterThan(initialRemainingTime - 5); // Allow small time difference
        });

        it('should maintain timer state through multiple turn transitions', () => {
            // Start round timer
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            const initialRemainingTime = gameStateManager.getRemainingTime(gameState);

            // Encoder → AI (pause)
            gameState = gameStateManager.advanceTurn(gameState);
            expect(gameState.currentTurn).toBe('ai');
            expect(gameState.timerState).toBe('paused');
            expect(gameStateManager.getRemainingTime(gameState)).toBe(initialRemainingTime);

            // AI → Decoder (resume) - AI goes to decoder when no conversation history
            gameState = gameStateManager.advanceTurn(gameState);
            expect(gameState.currentTurn).toBe('decoder');
            expect(gameState.timerState).toBe('running');

            // Decoder → AI (pause again)
            gameState = gameStateManager.advanceTurn(gameState);
            expect(gameState.currentTurn).toBe('ai');
            expect(gameState.timerState).toBe('paused');

            // AI → Decoder (resume again) - AI goes to decoder when last turn was decoder
            gameState = gameStateManager.advanceTurn(gameState);
            expect(gameState.currentTurn).toBe('decoder');
            expect(gameState.timerState).toBe('running');

            // Timer should still have time remaining
            expect(gameStateManager.getRemainingTime(gameState)).toBeGreaterThan(0);
        });
    });

    describe('Timer Expiration Scenarios', () => {
        it('should expire after 3 minutes of human turn time', () => {
            // Start round timer
            let gameState = gameStateManager.startRoundTimer(baseGameState);

            // Simulate some time passing during human turns
            // Encoder → AI (pause)
            gameState = gameStateManager.advanceTurn(gameState);
            expect(gameState.timerState).toBe('paused');

            // AI → Decoder (resume)
            gameState = gameStateManager.advanceTurn(gameState);
            expect(gameState.timerState).toBe('running');

            // Manually set timer to expire
            gameState.roundExpiresAt = Date.now() - 1000;

            // Verify timer is expired
            expect(gameStateManager.isRoundExpired(gameState)).toBe(true);

            // Handle expiration
            gameState = gameStateManager.handleTimerExpiration(gameState);
            expect(gameState.score).toBe(4); // AI wins
            expect(gameState.roundExpiresAt).toBeUndefined();
            expect(gameState.pausedRemainingTime).toBeUndefined();
            expect(gameState.timerState).toBeUndefined();
        });

        it('should handle timer expiration during paused state', () => {
            // Start round timer
            let gameState = gameStateManager.startRoundTimer(baseGameState);

            // Pause timer during AI turn
            gameState = gameStateManager.advanceTurn(gameState);
            expect(gameState.timerState).toBe('paused');

            // Set paused time to 0 to simulate expiration
            gameState.pausedRemainingTime = 0;

            // Verify timer is expired
            expect(gameStateManager.isRoundExpired(gameState)).toBe(true);

            // Handle expiration
            gameState = gameStateManager.handleTimerExpiration(gameState);
            expect(gameState.score).toBe(4); // AI wins
        });
    });

    describe('Round Advancement After Timer Expiration', () => {
        it('should advance round and start new timer after expiration', () => {
            // Start round timer
            let gameState = gameStateManager.startRoundTimer(baseGameState);

            // Simulate timer expiration
            gameState.roundExpiresAt = Date.now() - 1000;
            gameState = gameStateManager.handleTimerExpiration(gameState);
            expect(gameState.score).toBe(4);

            // Advance to next round
            const roles = { encoder: 'player1', decoder: 'player2' };
            const { newGameState } = gameStateManager.advanceRound(gameState, roles);

            // Verify new round is set up correctly
            expect(newGameState.currentRound).toBe(2);
            expect(newGameState.conversationHistory).toEqual([]);
            expect(newGameState.currentTurn).toBe('encoder');
            expect(newGameState.roundExpiresAt).toBeDefined();
            expect(newGameState.timerState).toBe('running');
            expect(gameStateManager.getRemainingTime(newGameState)).toBeGreaterThan(179);
        });

        it('should handle multiple rounds with timer expirations', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            const roles = { encoder: 'player1', decoder: 'player2' };

            // First round expiration
            gameState.roundExpiresAt = Date.now() - 1000;
            gameState = gameStateManager.handleTimerExpiration(gameState);
            expect(gameState.score).toBe(4);

            // Advance to round 2
            const { newGameState: round2State } = gameStateManager.advanceRound(gameState, roles);
            gameState = round2State;
            expect(gameState.currentRound).toBe(2);
            expect(gameState.timerState).toBe('running');

            // Second round expiration
            gameState.roundExpiresAt = Date.now() - 1000;
            gameState = gameStateManager.handleTimerExpiration(gameState);
            expect(gameState.score).toBe(3);

            // Advance to round 3
            const { newGameState: round3State } = gameStateManager.advanceRound(gameState, roles);
            gameState = round3State;
            expect(gameState.currentRound).toBe(3);
            expect(gameState.timerState).toBe('running');
        });
    });

    describe('Timer Reset for New Rounds', () => {
        it('should reset timer to 3 minutes for each new round', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            const roles = { encoder: 'player1', decoder: 'player2' };

            // First round
            expect(gameStateManager.getRemainingTime(gameState)).toBeGreaterThan(179);
            expect(gameStateManager.getRemainingTime(gameState)).toBeLessThanOrEqual(180);

            // Simulate some time passing
            gameState.roundExpiresAt = Date.now() + (120 * 1000); // 2 minutes remaining

            // Expire timer
            gameState.roundExpiresAt = Date.now() - 1000;
            gameState = gameStateManager.handleTimerExpiration(gameState);

            // Advance to new round
            const { newGameState } = gameStateManager.advanceRound(gameState, roles);

            // Verify timer is reset to 3 minutes
            expect(gameStateManager.getRemainingTime(newGameState)).toBeGreaterThan(179);
            expect(gameStateManager.getRemainingTime(newGameState)).toBeLessThanOrEqual(180);
        });

        it('should maintain timer state through role switching', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            const roles = { encoder: 'player1', decoder: 'player2' };

            // Simulate timer expiration
            gameState.roundExpiresAt = Date.now() - 1000;
            gameState = gameStateManager.handleTimerExpiration(gameState);

            // Advance round (switches roles)
            const { newGameState, newRoles } = gameStateManager.advanceRound(gameState, roles);

            // Verify roles are switched
            expect(newRoles.encoder).toBe('player2');
            expect(newRoles.decoder).toBe('player1');

            // Verify timer is reset and running
            expect(newGameState.timerState).toBe('running');
            expect(gameStateManager.getRemainingTime(newGameState)).toBeGreaterThan(179);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle rapid turn transitions correctly', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            // Rapid transitions: encoder → ai → decoder → ai → ai
            for (let i = 0; i < 5; i++) {
                gameState = gameStateManager.advanceTurn(gameState);
            }
            // Should end up at ai with timer running (AI alternates based on conversation history)
            expect(gameState.currentTurn).toBe('ai');
            expect(gameState.timerState).toBe('paused');
            expect(gameStateManager.getRemainingTime(gameState)).toBeGreaterThan(0);
        });

        it('should preserve timer state during player disconnection and reconnection', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            // Simulate some time passing and pause for AI turn
            gameState = gameStateManager.advanceTurn(gameState);
            const savedState = { ...gameState };
            // Simulate player disconnect and reconnect
            const rejoined = gameStateManager.restoreGameStateForPlayer(savedState, gameState, 'player1', { encoder: 'player1', decoder: 'player2' });
            expect(rejoined.canRejoin).toBe(true);
            expect(rejoined.gameState.pausedRemainingTime).toBe(gameState.pausedRemainingTime);
            expect(rejoined.gameState.timerState).toBe(gameState.timerState);
        });

        it('should handle timer operations on expired game state', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            gameState.gameStatus = 'ended';

            // Timer operations should not fail on ended game
            expect(() => gameStateManager.getRemainingTime(gameState)).not.toThrow();
            expect(() => gameStateManager.isRoundExpired(gameState)).not.toThrow();
            expect(() => gameStateManager.pauseRoundTimer(gameState)).not.toThrow();
            expect(() => gameStateManager.resumeRoundTimer(gameState)).not.toThrow();
        });

        it('should handle timer with very short remaining time', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);

            // Set timer to expire very soon
            gameState.roundExpiresAt = Date.now() + 1000; // 1 second remaining

            expect(gameStateManager.getRemainingTime(gameState)).toBe(1);
            expect(gameStateManager.isRoundExpired(gameState)).toBe(false);

            // Wait for expiration
            gameState.roundExpiresAt = Date.now() - 1000;
            expect(gameStateManager.isRoundExpired(gameState)).toBe(true);
        });

        it('should keep timer paused during AI response delays', () => {
            let gameState = gameStateManager.startRoundTimer(baseGameState);
            // Advance to AI turn (pause timer)
            gameState = gameStateManager.advanceTurn(gameState);
            const pausedTime = gameState.pausedRemainingTime;
            // Simulate a long AI delay (no resume)
            for (let i = 0; i < 10; i++) {
                // Timer should remain paused
                expect(gameState.timerState).toBe('paused');
                expect(gameState.pausedRemainingTime).toBe(pausedTime);
            }
        });

        it('should handle multiple concurrent games with independent timers', () => {
            const NUM_GAMES = 10;
            const games = [] as GameState[];
            for (let i = 0; i < NUM_GAMES; i++) {
                const gameState = gameStateManager.startRoundTimer({
                    ...baseGameState,
                    secretWord: `word${i}`,
                    currentRound: i + 1,
                });
                games.push(gameState!);
            }
            // Advance each game independently
            for (let i = 0; i < games.length; i++) {
                let gameState = games[i];
                if (!gameState) continue;

                // Pause timer for AI turn
                gameState = gameStateManager.advanceTurn(gameState);
                expect(gameState.timerState).toBe('paused');
                // Resume timer for human turn
                gameState = gameStateManager.advanceTurn(gameState);
                expect(gameState.timerState).toBe('running');
                // Expire timer
                gameState.roundExpiresAt = Date.now() - 1000;
                expect(gameStateManager.isRoundExpired(gameState)).toBe(true);
                // Handle expiration
                gameState = gameStateManager.handleTimerExpiration(gameState);
                expect(gameState.roundExpiresAt).toBeUndefined();
            }
        });
    });
}); 