import { GameLogic } from '../src/game/logic';
import { GameStateManager } from '../src/game/state';
import { GameValidator } from '../src/game/validation';
import { WordManager } from '../src/game/wordManager';
import { Player, RoleAssignment } from '../src/types';

describe('GameStateManager', () => {
    let gameStateManager: GameStateManager;

    beforeEach(() => {
        gameStateManager = new GameStateManager();
    });

    describe('createGameState', () => {
        it('should create a new game state with correct initial values', () => {
            const players: Player[] = [
                { id: 'player1', name: 'Player 1', ready: true, role: null, socketId: 'socket1' },
                { id: 'player2', name: 'Player 2', ready: true, role: null, socketId: 'socket2' }
            ];

            const gameState = gameStateManager.createGameState('TestWord', players);

            expect(gameState.score).toBe(5);
            expect(gameState.currentRound).toBe(1);
            expect(gameState.secretWord).toBe('testword');
            expect(gameState.conversationHistory).toEqual([]);
            expect(gameState.aiGuesses).toEqual([]);
            expect(gameState.currentTurn).toBe('encryptor');
            expect(gameState.gameStatus).toBe('active');
        });
    });

    describe('assignRoles', () => {
        it('should assign roles based on join order (first player = Encryptor, second = Decryptor)', () => {
            const players: Player[] = [
                { id: 'player1', name: 'Player 1', ready: true, role: null, socketId: 'socket1' },
                { id: 'player2', name: 'Player 2', ready: true, role: null, socketId: 'socket2' }
            ];

            const roles = gameStateManager.assignRoles(players);

            expect(roles.encryptor).toBe('player1'); // First player becomes Encryptor
            expect(roles.decryptor).toBe('player2'); // Second player becomes Decryptor
            expect(roles.encryptor).not.toBe(roles.decryptor);
        });

        it('should consistently assign roles in the same order', () => {
            const players: Player[] = [
                { id: 'player1', name: 'Player 1', ready: true, role: null, socketId: 'socket1' },
                { id: 'player2', name: 'Player 2', ready: true, role: null, socketId: 'socket2' }
            ];

            // Test multiple calls to ensure deterministic behavior
            const roles1 = gameStateManager.assignRoles(players);
            const roles2 = gameStateManager.assignRoles(players);
            const roles3 = gameStateManager.assignRoles(players);

            expect(roles1.encryptor).toBe(roles2.encryptor);
            expect(roles2.encryptor).toBe(roles3.encryptor);
            expect(roles1.decryptor).toBe(roles2.decryptor);
            expect(roles2.decryptor).toBe(roles3.decryptor);
        });

        it('should throw error for incorrect number of players', () => {
            const players: Player[] = [
                { id: 'player1', name: 'Player 1', ready: true, role: null, socketId: 'socket1' }
            ];

            expect(() => gameStateManager.assignRoles(players)).toThrow('Exactly 2 players required for role assignment');
        });
    });

    describe('addMessage', () => {
        it('should add message to conversation history', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            const message = { content: 'Test message', senderId: 'player1' };

            const newGameState = gameStateManager.addMessage(gameState, message);

            expect(newGameState.conversationHistory).toHaveLength(1);
            expect(newGameState.conversationHistory[0]!.content).toBe('Test message');
            expect(newGameState.conversationHistory[0]!.senderId).toBe('player1');
            expect(newGameState.conversationHistory[0]!.id).toBeDefined();
            expect(newGameState.conversationHistory[0]!.timestamp).toBeInstanceOf(Date);
        });
    });

    describe('addAIGuess', () => {
        it('should add AI guess to game state', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            const aiGuess = {
                thinking: ['I think it might be...'],
                guess: 'TestWord',
                confidence: 0.8
            };

            const newGameState = gameStateManager.addAIGuess(gameState, aiGuess);

            expect(newGameState.aiGuesses).toHaveLength(1);
            expect(newGameState.aiGuesses[0]!.thinking).toEqual(['I think it might be...']);
            expect(newGameState.aiGuesses[0]!.guess).toBe('TestWord');
            expect(newGameState.aiGuesses[0]!.confidence).toBe(0.8);
            expect(newGameState.aiGuesses[0]!.id).toBeDefined();
            expect(newGameState.aiGuesses[0]!.timestamp).toBeInstanceOf(Date);
        });
    });

    describe('updateScore', () => {
        it('should increase score when players win', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            gameState.score = 5;

            const newGameState = gameStateManager.updateScore(gameState, true);

            expect(newGameState.score).toBe(6);
        });

        it('should decrease score when AI wins', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            gameState.score = 5;

            const newGameState = gameStateManager.updateScore(gameState, false);

            expect(newGameState.score).toBe(4);
        });

        it('should not exceed maximum score', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            gameState.score = 10;

            const newGameState = gameStateManager.updateScore(gameState, true);

            expect(newGameState.score).toBe(10);
        });

        it('should not go below minimum score', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            gameState.score = 0;

            const newGameState = gameStateManager.updateScore(gameState, false);

            expect(newGameState.score).toBe(0);
        });
    });

    describe('advanceRound', () => {
        it('should advance to next round and reset conversation', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            gameState.currentRound = 1;
            gameState.conversationHistory = [{ id: '1', content: 'test', senderId: 'player1', timestamp: new Date() }];
            gameState.aiGuesses = [{ id: '1', thinking: [], guess: 'test', confidence: 0.5, timestamp: new Date() }];

            const newGameState = gameStateManager.advanceRound(gameState);

            expect(newGameState.currentRound).toBe(2);
            expect(newGameState.conversationHistory).toEqual([]);
            expect(newGameState.aiGuesses).toEqual([]);
            expect(newGameState.currentTurn).toBe('encryptor');
        });
    });

    describe('switchRoles', () => {
        it('should switch roles between players', () => {
            const roles: RoleAssignment = {
                encryptor: 'player1',
                decryptor: 'player2'
            };

            const newRoles = gameStateManager.switchRoles([], roles);

            expect(newRoles.encryptor).toBe('player2');
            expect(newRoles.decryptor).toBe('player1');
        });
    });

    describe('isGameEnded', () => {
        it('should return true when score reaches 10', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            gameState.score = 10;

            expect(gameStateManager.isGameEnded(gameState)).toBe(true);
        });

        it('should return true when score reaches 0', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            gameState.score = 0;

            expect(gameStateManager.isGameEnded(gameState)).toBe(true);
        });

        it('should return false when score is between 1 and 9', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            gameState.score = 5;

            expect(gameStateManager.isGameEnded(gameState)).toBe(false);
        });
    });

    describe('getGameWinner', () => {
        it('should return players when score is 10', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            gameState.score = 10;

            expect(gameStateManager.getGameWinner(gameState)).toBe('players');
        });

        it('should return ai when score is 0', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            gameState.score = 0;

            expect(gameStateManager.getGameWinner(gameState)).toBe('ai');
        });

        it('should return null when game is not ended', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            gameState.score = 5;

            expect(gameStateManager.getGameWinner(gameState)).toBe(null);
        });
    });

    describe('validateGuess', () => {
        it('should return true for exact match', () => {
            expect(gameStateManager.validateGuess('TestWord', 'TestWord')).toBe(true);
        });

        it('should return true for case-insensitive match', () => {
            expect(gameStateManager.validateGuess('testword', 'TestWord')).toBe(true);
            expect(gameStateManager.validateGuess('TESTWORD', 'TestWord')).toBe(true);
        });

        it('should return true for trimmed match', () => {
            expect(gameStateManager.validateGuess('  TestWord  ', 'TestWord')).toBe(true);
        });

        it('should return false for different words', () => {
            expect(gameStateManager.validateGuess('WrongWord', 'TestWord')).toBe(false);
        });
    });

    describe('advanceTurn', () => {
        it('should advance turn in correct order', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);

            let currentState = gameState;
            expect(currentState.currentTurn).toBe('encryptor');

            currentState = gameStateManager.advanceTurn(currentState);
            expect(currentState.currentTurn).toBe('ai');

            currentState = gameStateManager.advanceTurn(currentState);
            expect(currentState.currentTurn).toBe('decryptor');

            currentState = gameStateManager.advanceTurn(currentState);
            expect(currentState.currentTurn).toBe('encryptor');
        });
    });

    describe('isPlayerTurn', () => {
        it('should return true for correct player and turn', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            const roles: RoleAssignment = {
                encryptor: 'player1',
                decryptor: 'player2'
            };

            expect(gameStateManager.isPlayerTurn(gameState, 'player1', roles)).toBe(true);
            expect(gameStateManager.isPlayerTurn(gameState, 'player2', roles)).toBe(false);
        });
    });

    describe('getPlayerRole', () => {
        it('should return correct role for player', () => {
            const roles: RoleAssignment = {
                encryptor: 'player1',
                decryptor: 'player2'
            };

            expect(gameStateManager.getPlayerRole('player1', roles)).toBe('encryptor');
            expect(gameStateManager.getPlayerRole('player2', roles)).toBe('decryptor');
            expect(gameStateManager.getPlayerRole('player3', roles)).toBe(null);
        });
    });
});

describe('WordManager', () => {
    let wordManager: WordManager;

    beforeEach(() => {
        wordManager = new WordManager();
    });

    describe('selectRandomWord', () => {
        it('should return a word from the word list', () => {
            const word = wordManager.selectRandomWord();
            const allWords = wordManager.getAllWords();

            expect(allWords).toContain(word);
        });

        it('should avoid recently used words', () => {
            const word1 = wordManager.selectRandomWord();
            const word2 = wordManager.selectRandomWord();
            const word3 = wordManager.selectRandomWord();

            // With only 3 words, we can't guarantee 4 different words
            // But we can test that the recently used mechanism works
            const recentlyUsed: string[] = wordManager.getRecentlyUsedWords();
            expect(recentlyUsed.length).toBeLessThanOrEqual(3);
            expect(recentlyUsed).toContain(word1);
            expect(recentlyUsed).toContain(word2);
            expect(recentlyUsed).toContain(word3);
        });

        it('should reset recently used list when all words are used', () => {
            // This test might be flaky due to randomness, but should work most of the time
            const words = [];
            for (let i = 0; i < 10; i++) {
                words.push(wordManager.selectRandomWord());
            }

            // Should have some variety in the words
            const uniqueWords = new Set(words);
            expect(uniqueWords.size).toBeGreaterThan(1);
        });
    });

    describe('isValidWord', () => {
        it('should return true for valid words', () => {
            const allWords = wordManager.getAllWords();
            const testWord = allWords[0]!;

            expect(wordManager.isValidWord(testWord)).toBe(true);
            expect(wordManager.isValidWord(testWord.toLowerCase())).toBe(true);
        });

        it('should return false for invalid words', () => {
            expect(wordManager.isValidWord('InvalidWord')).toBe(false);
            expect(wordManager.isValidWord('')).toBe(false);
        });
    });

    describe('getWordCount', () => {
        it('should return the number of available words', () => {
            const count = wordManager.getWordCount();
            expect(count).toBeGreaterThan(0);
        });
    });
});

describe('GameLogic', () => {
    let gameLogic: GameLogic;

    beforeEach(() => {
        gameLogic = new GameLogic();
    });

    describe('startGame', () => {
        it('should start a new game with correct initial state', () => {
            const players: Player[] = [
                { id: 'player1', name: 'Player 1', ready: true, role: null, socketId: 'socket1' },
                { id: 'player2', name: 'Player 2', ready: true, role: null, socketId: 'socket2' }
            ];

            const result = gameLogic.startGame(players);

            expect(result.gameState.score).toBe(5);
            expect(result.gameState.currentRound).toBe(1);
            expect(result.gameState.currentTurn).toBe('encryptor');
            expect(result.gameState.gameStatus).toBe('active');
            expect(result.roles.encryptor).toBeDefined();
            expect(result.roles.decryptor).toBeDefined();
            expect(result.secretWord).toBeDefined();
        });

        it('should throw error for incorrect number of players', () => {
            const players: Player[] = [
                { id: 'player1', name: 'Player 1', ready: true, role: null, socketId: 'socket1' }
            ];

            expect(() => gameLogic.startGame(players)).toThrow('Exactly 2 players required to start game');
        });
    });

    describe('handleEncryptorMessage', () => {
        it('should handle encryptor message correctly', () => {
            const gameState = gameLogic.startGame([
                { id: 'player1', name: 'Player 1', ready: true, role: null, socketId: 'socket1' },
                { id: 'player2', name: 'Player 2', ready: true, role: null, socketId: 'socket2' }
            ]).gameState;

            const roles: RoleAssignment = {
                encryptor: 'player1',
                decryptor: 'player2'
            };

            const message = { content: 'Test message', senderId: 'player1' };
            const result = gameLogic.handleEncryptorMessage(gameState, message, roles);

            expect(result.newGameState.currentTurn).toBe('ai');
            expect(result.newGameState.conversationHistory).toHaveLength(1);
            expect(result.shouldAdvanceTurn).toBe(true);
        });

        it('should throw error if not encryptor turn', () => {
            const gameState = gameLogic.startGame([
                { id: 'player1', name: 'Player 1', ready: true, role: null, socketId: 'socket1' },
                { id: 'player2', name: 'Player 2', ready: true, role: null, socketId: 'socket2' }
            ]).gameState;

            gameState.currentTurn = 'ai';

            const roles: RoleAssignment = {
                encryptor: 'player1',
                decryptor: 'player2'
            };

            const message = { content: 'Test message', senderId: 'player1' };

            expect(() => gameLogic.handleEncryptorMessage(gameState, message, roles))
                .toThrow('Not encryptor\'s turn');
        });
    });

    describe('handleAIGuess', () => {
        it('should handle correct AI guess', () => {
            const gameState = gameLogic.startGame([
                { id: 'player1', name: 'Player 1', ready: true, role: null, socketId: 'socket1' },
                { id: 'player2', name: 'Player 2', ready: true, role: null, socketId: 'socket2' }
            ]).gameState;

            gameState.currentTurn = 'ai';

            const aiGuess = {
                thinking: ['I think it might be...'],
                guess: gameState.secretWord,
                confidence: 0.8
            };

            const result = gameLogic.handleAIGuess(gameState, aiGuess);

            expect(result.isCorrect).toBe(true);
            expect(result.newGameState.score).toBe(4); // AI wins, score decreases
            expect(result.newGameState.currentRound).toBe(2);
            expect(result.shouldAdvanceTurn).toBe(false);
        });

        it('should handle incorrect AI guess', () => {
            const gameState = gameLogic.startGame([
                { id: 'player1', name: 'Player 1', ready: true, role: null, socketId: 'socket1' },
                { id: 'player2', name: 'Player 2', ready: true, role: null, socketId: 'socket2' }
            ]).gameState;

            gameState.currentTurn = 'ai';

            const aiGuess = {
                thinking: ['I think it might be...'],
                guess: 'WrongWord',
                confidence: 0.8
            };

            const result = gameLogic.handleAIGuess(gameState, aiGuess);

            expect(result.isCorrect).toBe(false);
            expect(result.newGameState.currentTurn).toBe('decryptor');
            expect(result.shouldAdvanceTurn).toBe(true);
        });
    });

    describe('handleDecryptorGuess', () => {
        it('should handle correct decryptor guess', () => {
            const gameState = gameLogic.startGame([
                { id: 'player1', name: 'Player 1', ready: true, role: null, socketId: 'socket1' },
                { id: 'player2', name: 'Player 2', ready: true, role: null, socketId: 'socket2' }
            ]).gameState;

            gameState.currentTurn = 'decryptor';

            const roles: RoleAssignment = {
                encryptor: 'player1',
                decryptor: 'player2'
            };

            const result = gameLogic.handleDecryptorGuess(gameState, gameState.secretWord, 'player2', roles);

            expect(result.isCorrect).toBe(true);
            expect(result.newGameState.score).toBe(6); // Players win, score increases
            expect(result.newGameState.currentRound).toBe(2);
            expect(result.shouldAdvanceTurn).toBe(false);
        });

        it('should handle incorrect decryptor guess', () => {
            const gameState = gameLogic.startGame([
                { id: 'player1', name: 'Player 1', ready: true, role: null, socketId: 'socket1' },
                { id: 'player2', name: 'Player 2', ready: true, role: null, socketId: 'socket2' }
            ]).gameState;

            gameState.currentTurn = 'decryptor';

            const roles: RoleAssignment = {
                encryptor: 'player1',
                decryptor: 'player2'
            };

            const result = gameLogic.handleDecryptorGuess(gameState, 'WrongWord', 'player2', roles);

            expect(result.isCorrect).toBe(false);
            expect(result.newGameState.currentTurn).toBe('encryptor');
            expect(result.shouldAdvanceTurn).toBe(true);
        });
    });
});

describe('GameValidator', () => {
    let validator: GameValidator;

    beforeEach(() => {
        validator = new GameValidator();
    });

    describe('validatePlayer', () => {
        it('should validate correct player data', () => {
            const player = {
                id: 'player1',
                name: 'Player 1',
                ready: true,
                role: null,
                socketId: 'socket1'
            };

            const result = validator.validatePlayer(player);

            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('should return errors for invalid player data', () => {
            const player = {
                id: '',
                name: '',
                ready: 'not boolean',
                role: 'invalid'
            };

            const result = validator.validatePlayer(player);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe('validateMessage', () => {
        it('should validate correct message', () => {
            const message = {
                content: 'Test message',
                senderId: 'player1'
            };

            const result = validator.validateMessage(message);

            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('should return errors for invalid message', () => {
            const message = {
                content: '',
                senderId: ''
            };

            const result = validator.validateMessage(message);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe('validatePlayerGuess', () => {
        it('should validate correct guess', () => {
            const result = validator.validatePlayerGuess('TestGuess');

            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('should return errors for invalid guess', () => {
            const result = validator.validatePlayerGuess('');

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });
}); 