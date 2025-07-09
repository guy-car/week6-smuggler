import { act, renderHook } from '@testing-library/react-native';
import { useGameStore } from '../store/gameStore';

describe('GameStore', () => {
    beforeEach(() => {
        // Reset store before each test
        act(() => {
            useGameStore.getState().reset();
        });
    });

    describe('Initial State', () => {
        it('should have correct initial state', () => {
            const { result } = renderHook(() => useGameStore());

            expect(result.current.connected).toBe(false);
            expect(result.current.socketId).toBe(null);
            expect(result.current.player).toBe(null);
            expect(result.current.playerRole).toBe(null);
            expect(result.current.roomId).toBe(null);
            expect(result.current.players).toEqual([]);
            expect(result.current.isReady).toBe(false);
            expect(result.current.gameStatus).toBe('waiting');
            expect(result.current.conversationHistory).toEqual([]);
            expect(result.current.currentTurn).toBe(null);
            expect(result.current.secretWord).toBe(null);
            expect(result.current.score).toBe(0);
            expect(result.current.round).toBe(1);
            expect(result.current.maxRounds).toBe(5);
            expect(result.current.currentScreen).toBe('lobby');
            expect(result.current.isLoading).toBe(false);
            expect(result.current.error).toBe(null);
            expect(result.current.showGuessesModal).toBe(false);
            expect(result.current.showCluesModal).toBe(false);
            expect(result.current.showSecretModal).toBe(false);
            expect(result.current.showQuitConfirm).toBe(false);
            expect(result.current.availableRooms).toEqual([]);
        });
    });

    describe('Connection State', () => {
        it('should update connection state', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setConnected(true);
            });

            expect(result.current.connected).toBe(true);
        });

        it('should update socket ID', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setSocketId('socket-123');
            });

            expect(result.current.socketId).toBe('socket-123');
        });
    });

    describe('Player State', () => {
        it('should update player', () => {
            const { result } = renderHook(() => useGameStore());
            const player = {
                id: 'player-1',
                name: 'Player 1',
                ready: false,
                role: 'encryptor' as const,
                socketId: 'socket-123'
            };

            act(() => {
                result.current.setPlayer(player);
            });

            expect(result.current.player).toEqual(player);
        });

        it('should update player role', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setPlayerRole('decryptor');
            });

            expect(result.current.playerRole).toBe('decryptor');
        });
    });

    describe('Room State', () => {
        it('should update room ID', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setRoomId('room-123');
            });

            expect(result.current.roomId).toBe('room-123');
        });

        it('should update players', () => {
            const { result } = renderHook(() => useGameStore());
            const players = [
                {
                    id: 'player-1',
                    name: 'Player 1',
                    ready: true,
                    role: 'encryptor' as const,
                    socketId: 'socket-1'
                },
                {
                    id: 'player-2',
                    name: 'Player 2',
                    ready: false,
                    role: 'decryptor' as const,
                    socketId: 'socket-2'
                }
            ];

            act(() => {
                result.current.setPlayers(players);
            });

            expect(result.current.players).toEqual(players);
        });

        it('should update ready status', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setIsReady(true);
            });

            expect(result.current.isReady).toBe(true);
        });
    });

    describe('Game State', () => {
        it('should update game status', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setGameStatus('active');
            });

            expect(result.current.gameStatus).toBe('active');
        });

        it('should update conversation history', () => {
            const { result } = renderHook(() => useGameStore());
            const history = [
                {
                    id: 'turn-1',
                    type: 'encryptor' as const,
                    content: 'This is a hint',
                    timestamp: '2023-01-01T00:00:00Z',
                    playerId: 'player-1'
                }
            ];

            act(() => {
                result.current.setConversationHistory(history);
            });

            expect(result.current.conversationHistory).toEqual(history);
        });

        it('should add turn to conversation history', () => {
            const { result } = renderHook(() => useGameStore());
            const turn = {
                id: 'turn-1',
                type: 'ai' as const,
                content: 'AI is thinking...',
                timestamp: '2023-01-01T00:00:00Z'
            };

            act(() => {
                result.current.addTurn(turn);
            });

            expect(result.current.conversationHistory).toHaveLength(1);
            expect(result.current.conversationHistory[0]).toEqual(turn);
        });

        it('should update current turn', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setCurrentTurn('encryptor');
            });

            expect(result.current.currentTurn).toBe('encryptor');
        });

        it('should update secret word', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setSecretWord('apple');
            });

            expect(result.current.secretWord).toBe('apple');
        });

        it('should update score', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setScore(10);
            });

            expect(result.current.score).toBe(10);
        });

        it('should update round', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setRound(3);
            });

            expect(result.current.round).toBe(3);
        });

        it('should update max rounds', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setMaxRounds(10);
            });

            expect(result.current.maxRounds).toBe(10);
        });
    });

    describe('UI State', () => {
        it('should update current screen', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setCurrentScreen('encryptor-game');
            });

            expect(result.current.currentScreen).toBe('encryptor-game');
        });

        it('should update loading state', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setIsLoading(true);
            });

            expect(result.current.isLoading).toBe(true);
        });

        it('should update error', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setError('Something went wrong');
            });

            expect(result.current.error).toBe('Something went wrong');
        });

        it('should update modal states', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setShowGuessesModal(true);
                result.current.setShowCluesModal(true);
                result.current.setShowSecretModal(true);
                result.current.setShowQuitConfirm(true);
            });

            expect(result.current.showGuessesModal).toBe(true);
            expect(result.current.showCluesModal).toBe(true);
            expect(result.current.showSecretModal).toBe(true);
            expect(result.current.showQuitConfirm).toBe(true);
        });
    });

    describe('Available Rooms', () => {
        it('should update available rooms', () => {
            const { result } = renderHook(() => useGameStore());
            const rooms = [
                {
                    id: 'room-1',
                    playerCount: 1,
                    maxPlayers: 2,
                    createdAt: '2023-01-01T00:00:00Z'
                }
            ];

            act(() => {
                result.current.setAvailableRooms(rooms);
            });

            expect(result.current.availableRooms).toEqual(rooms);
        });
    });

    describe('Reset', () => {
        it('should reset all state to initial values', () => {
            const { result } = renderHook(() => useGameStore());

            // Set some state
            act(() => {
                result.current.setConnected(true);
                result.current.setPlayer({ id: 'test', name: 'Test', ready: false, role: 'encryptor', socketId: 'test' });
                result.current.setRoomId('room-123');
                result.current.setGameStatus('active');
                result.current.setScore(10);
                result.current.setCurrentScreen('encryptor-game');
            });

            // Reset
            act(() => {
                result.current.reset();
            });

            // Check that everything is reset
            expect(result.current.connected).toBe(false);
            expect(result.current.player).toBe(null);
            expect(result.current.roomId).toBe(null);
            expect(result.current.gameStatus).toBe('waiting');
            expect(result.current.score).toBe(0);
            expect(result.current.currentScreen).toBe('lobby');
        });
    });
}); 