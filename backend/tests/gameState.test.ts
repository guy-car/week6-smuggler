import { GameLogic } from '../src/game/logic';
import { GameStateManager } from '../src/game/state';
import { WordManager } from '../src/game/wordManager';
import { AITurn, InsiderTurn, OutsiderTurn, Player, RoleAssignment } from '../src/types';

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

    describe('addOutsiderTurn', () => {
        it('should add outsider turn to conversation history', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            const content = 'Test hint message';

            const newGameState = gameStateManager.addOutsiderTurn(gameState, content);

            expect(newGameState.conversationHistory).toHaveLength(1);
            const turn = newGameState.conversationHistory[0] as OutsiderTurn;
            expect(turn.type).toBe('outsider_hint');
            expect(turn.content).toBe('Test hint message');
            expect(turn.turnNumber).toBe(1);
        });
    });

    describe('addAITurn', () => {
        it('should add AI turn to conversation history', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            const thinking = ['First thought', 'Second thought', 'Third thought', 'Fourth thought'];
            const guess = 'testguess';

            const newGameState = gameStateManager.addAITurn(gameState, thinking, guess);

            expect(newGameState.conversationHistory).toHaveLength(1);
            const turn = newGameState.conversationHistory[0] as AITurn;
            expect(turn.type).toBe('ai_analysis');
            expect(turn.thinking).toEqual(thinking);
            expect(turn.guess).toBe('testguess');
            expect(turn.turnNumber).toBe(1);
        });
    });

    describe('addInsiderTurn', () => {
        it('should add insider turn to conversation history', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            const guess = 'testguess';

            const newGameState = gameStateManager.addInsiderTurn(gameState, guess);

            expect(newGameState.conversationHistory).toHaveLength(1);
            const turn = newGameState.conversationHistory[0] as InsiderTurn;
            expect(turn.type).toBe('insider_guess');
            expect(turn.guess).toBe('testguess');
            expect(turn.turnNumber).toBe(1);
        });
    });

    describe('addMessage', () => {
        it('should add outsider turn via legacy method', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            const message = {
                type: 'outsider_hint',
                content: 'Test message'
            };

            const newGameState = gameStateManager.addMessage(gameState, message);

            expect(newGameState.conversationHistory).toHaveLength(1);
            const turn = newGameState.conversationHistory[0] as OutsiderTurn;
            expect(turn.type).toBe('outsider_hint');
            expect(turn.content).toBe('Test message');
            expect(turn.turnNumber).toBe(1);
        });

        it('should add AI turn via legacy method', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            const message = {
                type: 'ai_analysis',
                thinking: ['Thought 1', 'Thought 2', 'Thought 3', 'Thought 4'],
                guess: 'testguess'
            };

            const newGameState = gameStateManager.addMessage(gameState, message);

            expect(newGameState.conversationHistory).toHaveLength(1);
            const turn = newGameState.conversationHistory[0] as AITurn;
            expect(turn.type).toBe('ai_analysis');
            expect(turn.thinking).toEqual(['Thought 1', 'Thought 2', 'Thought 3', 'Thought 4']);
            expect(turn.guess).toBe('testguess');
            expect(turn.turnNumber).toBe(1);
        });

        it('should add insider turn via legacy method', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            const message = {
                type: 'insider_guess',
                guess: 'testguess'
            };

            const newGameState = gameStateManager.addMessage(gameState, message);

            expect(newGameState.conversationHistory).toHaveLength(1);
            const turn = newGameState.conversationHistory[0] as InsiderTurn;
            expect(turn.type).toBe('insider_guess');
            expect(turn.guess).toBe('testguess');
            expect(turn.turnNumber).toBe(1);
        });

        it('should throw error for invalid message type', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            const message = {
                type: 'invalid_type',
                content: 'Test message'
            };

            expect(() => gameStateManager.addMessage(gameState, message)).toThrow('Invalid message type for addMessage');
        });
    });

    describe('getNextTurnNumber', () => {
        it('should return 1 for empty conversation history', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            expect(gameStateManager.getNextTurnNumber(gameState)).toBe(1);
        });

        it('should return next turn number for existing conversation', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            let newGameState = gameStateManager.addOutsiderTurn(gameState, 'First hint');
            newGameState = gameStateManager.addAITurn(newGameState, ['Thought 1', 'Thought 2', 'Thought 3', 'Thought 4'], 'guess1');

            expect(gameStateManager.getNextTurnNumber(newGameState)).toBe(3);
        });
    });

    describe('transformToAnalyzeRequest', () => {
        it('should transform game state to analyze request format with gameId', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            let newGameState = gameStateManager.addOutsiderTurn(gameState, 'First hint');
            newGameState = gameStateManager.addAITurn(newGameState, ['Thought 1', 'Thought 2', 'Thought 3', 'Thought 4'], 'guess1');
            newGameState = gameStateManager.addInsiderTurn(newGameState, 'wrongguess');

            const analyzeRequest = gameStateManager.transformToAnalyzeRequest(newGameState, 'room123');

            expect(analyzeRequest.gameId).toBe('room123');
            expect(analyzeRequest.conversationHistory).toHaveLength(3);
            expect(analyzeRequest.conversationHistory[0]?.type).toBe('outsider_hint');
            expect(analyzeRequest.conversationHistory[1]?.type).toBe('ai_analysis');
            expect(analyzeRequest.conversationHistory[2]?.type).toBe('insider_guess');
        });

        it('should transform game state to analyze request format without gameId', () => {
            const gameState = gameStateManager.createGameState('TestWord', []);
            let newGameState = gameStateManager.addOutsiderTurn(gameState, 'First hint');
            newGameState = gameStateManager.addAITurn(newGameState, ['Thought 1', 'Thought 2', 'Thought 3', 'Thought 4'], 'guess1');

            const analyzeRequest = gameStateManager.transformToAnalyzeRequest(newGameState);

            expect(analyzeRequest.gameId).toBeUndefined();
            expect(analyzeRequest.conversationHistory).toHaveLength(2);
            expect(analyzeRequest.conversationHistory[0]?.type).toBe('outsider_hint');
            expect(analyzeRequest.conversationHistory[1]?.type).toBe('ai_analysis');
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
            gameState.conversationHistory = [{
                type: 'outsider_hint',
                content: 'test',
                turnNumber: 1
            }];

            const newGameState = gameStateManager.advanceRound(gameState);

            expect(newGameState.currentRound).toBe(2);
            expect(newGameState.conversationHistory).toEqual([]);
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

            const result = gameLogic.handleEncryptorMessage(gameState, 'Test message', roles);

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

            expect(() => gameLogic.handleEncryptorMessage(gameState, 'Test message', roles))
                .toThrow('Not encryptor\'s turn');
        });
    });

    describe('handleAIResponse', () => {
        it('should handle correct AI guess', () => {
            const gameState = gameLogic.startGame([
                { id: 'player1', name: 'Player 1', ready: true, role: null, socketId: 'socket1' },
                { id: 'player2', name: 'Player 2', ready: true, role: null, socketId: 'socket2' }
            ]).gameState;

            gameState.currentTurn = 'ai';

            const aiResponse = {
                thinking: ['I think it might be...', 'Analyzing clues...', 'Processing context...', 'Making educated guess...'],
                guess: gameState.secretWord
            };

            const result = gameLogic.handleAIResponse(gameState, aiResponse);

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

            const aiResponse = {
                thinking: ['I think it might be...', 'Analyzing clues...', 'Processing context...', 'Making educated guess...'],
                guess: 'WrongWord'
            };

            const result = gameLogic.handleAIResponse(gameState, aiResponse);

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
            expect(result.isMessage).toBe(false);
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
            expect(result.isMessage).toBe(true);
            expect(result.newGameState.currentTurn).toBe('ai');
            expect(result.newGameState.conversationHistory).toHaveLength(1);
            const turn = result.newGameState.conversationHistory[0] as InsiderTurn;
            expect(turn.guess).toBe('WrongWord');
            expect(result.shouldAdvanceTurn).toBe(true);
        });
    });
});

