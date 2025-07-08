import { GameValidator } from '../src/game/validation';
import { AIResponse, AITurn, InsiderTurn, OutsiderTurn, Turn } from '../src/types';
import { fuzzyStringMatch, getMaxLevenshteinDistance, levenshteinDistance } from '../src/utils/helpers';

describe('Levenshtein Distance Validation', () => {
    describe('levenshteinDistance', () => {
        it('should return 0 for identical strings', () => {
            expect(levenshteinDistance('apple', 'apple')).toBe(0);
            expect(levenshteinDistance('', '')).toBe(0);
            expect(levenshteinDistance('test', 'test')).toBe(0);
        });

        it('should return 1 for single character differences', () => {
            expect(levenshteinDistance('apple', 'appel')).toBe(2); // substitution (e->l)
            expect(levenshteinDistance('apple', 'apples')).toBe(1); // insertion
            expect(levenshteinDistance('apple', 'appl')).toBe(1); // deletion
        });

        it('should return 2 for two character differences', () => {
            expect(levenshteinDistance('apple', 'applle')).toBe(1); // single insertion
            expect(levenshteinDistance('apple', 'app')).toBe(2); // double deletion
            expect(levenshteinDistance('apple', 'appee')).toBe(1); // single substitution
        });

        it('should handle case differences', () => {
            expect(levenshteinDistance('Apple', 'apple')).toBe(0); // case-insensitive
            expect(levenshteinDistance('APPLE', 'apple')).toBe(0); // case-insensitive
        });

        it('should handle empty strings', () => {
            expect(levenshteinDistance('', 'apple')).toBe(5);
            expect(levenshteinDistance('apple', '')).toBe(5);
        });

        it('should handle special characters', () => {
            expect(levenshteinDistance('test!', 'test')).toBe(1);
            expect(levenshteinDistance('test', 'test!')).toBe(1);
        });
    });

    describe('fuzzyStringMatch', () => {
        it('should match identical strings', () => {
            expect(fuzzyStringMatch('apple', 'apple')).toBe(true);
            expect(fuzzyStringMatch('test', 'test')).toBe(true);
        });

        it('should match strings within default threshold (2)', () => {
            expect(fuzzyStringMatch('apple', 'appel')).toBe(true); // distance 1
            expect(fuzzyStringMatch('banana', 'bananna')).toBe(true); // distance 1
            expect(fuzzyStringMatch('cherry', 'chery')).toBe(true); // distance 1
            expect(fuzzyStringMatch('dragon', 'dragan')).toBe(true); // distance 1
            expect(fuzzyStringMatch('elephant', 'elepant')).toBe(true); // distance 1
        });

        it('should match strings within custom threshold', () => {
            expect(fuzzyStringMatch('apple', 'applle', 2)).toBe(true); // distance 2
            expect(fuzzyStringMatch('apple', 'app', 2)).toBe(true); // distance 2
        });

        it('should not match strings beyond threshold', () => {
            expect(fuzzyStringMatch('apple', 'orange', 2)).toBe(false); // distance > 2
            expect(fuzzyStringMatch('apple', 'appllle', 1)).toBe(false); // distance 2, threshold 1
        });

        it('should handle case insensitive matching', () => {
            expect(fuzzyStringMatch('Apple', 'apple')).toBe(true);
            expect(fuzzyStringMatch('APPLE', 'apple')).toBe(true);
            expect(fuzzyStringMatch('Apple', 'APPLE')).toBe(true);
        });

        it('should handle whitespace trimming', () => {
            expect(fuzzyStringMatch(' apple ', 'apple')).toBe(true);
            expect(fuzzyStringMatch('apple', ' apple ')).toBe(true);
            expect(fuzzyStringMatch(' apple ', ' apple ')).toBe(true);
        });

        it('should handle edge cases', () => {
            expect(fuzzyStringMatch('', '')).toBe(true);
            expect(fuzzyStringMatch('a', 'a')).toBe(true);
            expect(fuzzyStringMatch('a', 'b', 1)).toBe(true);
            expect(fuzzyStringMatch('a', 'c', 0)).toBe(false);
        });
    });

    describe('getMaxLevenshteinDistance', () => {
        const originalEnv = process.env;

        beforeEach(() => {
            jest.resetModules();
            process.env = { ...originalEnv };
        });

        afterAll(() => {
            process.env = originalEnv;
        });

        it('should return default value (2) when environment variable is not set', () => {
            delete process.env['MAX_LEVENSHTEIN_DISTANCE'];
            expect(getMaxLevenshteinDistance()).toBe(2);
        });

        it('should return parsed integer from environment variable', () => {
            process.env['MAX_LEVENSHTEIN_DISTANCE'] = '3';
            expect(getMaxLevenshteinDistance()).toBe(3);
        });

        it('should return default value when environment variable is invalid', () => {
            process.env['MAX_LEVENSHTEIN_DISTANCE'] = 'invalid';
            expect(getMaxLevenshteinDistance()).toBe(2);
        });

        it('should return default value when environment variable is negative', () => {
            process.env['MAX_LEVENSHTEIN_DISTANCE'] = '-1';
            expect(getMaxLevenshteinDistance()).toBe(2);
        });

        it('should return default value when environment variable is zero', () => {
            process.env['MAX_LEVENSHTEIN_DISTANCE'] = '0';
            expect(getMaxLevenshteinDistance()).toBe(0);
        });
    });
});

describe('GameValidator', () => {
    let validator: GameValidator;

    beforeEach(() => {
        validator = new GameValidator();
    });

    describe('validateTurn', () => {
        it('should validate valid outsider turn', () => {
            const turn: OutsiderTurn = {
                type: 'outsider_hint',
                content: 'It is red and round',
                turnNumber: 1
            };

            const result = validator.validateTurn(turn);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should validate valid AI turn', () => {
            const turn: AITurn = {
                type: 'ai_analysis',
                thinking: [
                    'The outsider mentioned something red and round',
                    'This could be a fruit like an apple',
                    'It could also be a tomato or cherry',
                    'I should consider common red round objects'
                ],
                guess: 'apple',
                turnNumber: 2
            };

            const result = validator.validateTurn(turn);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should validate valid insider turn', () => {
            const turn: InsiderTurn = {
                type: 'insider_guess',
                guess: 'tomato',
                turnNumber: 3
            };

            const result = validator.validateTurn(turn);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject turn without type', () => {
            const turn = {
                content: 'test',
                turnNumber: 1
            };

            const result = validator.validateTurn(turn);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Turn type must be outsider_hint, ai_analysis, or insider_guess');
        });

        it('should reject turn with invalid type', () => {
            const turn = {
                type: 'invalid_type',
                content: 'test',
                turnNumber: 1
            };

            const result = validator.validateTurn(turn);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Turn type must be outsider_hint, ai_analysis, or insider_guess');
        });

        it('should reject turn without turn number', () => {
            const turn = {
                type: 'outsider_hint',
                content: 'test'
            };

            const result = validator.validateTurn(turn);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Turn number must be a positive integer');
        });

        it('should reject turn with invalid turn number', () => {
            const turn = {
                type: 'outsider_hint',
                content: 'test',
                turnNumber: 0
            };

            const result = validator.validateTurn(turn);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Turn number must be a positive integer');
        });
    });

    describe('validateOutsiderTurn', () => {
        it('should validate valid outsider turn', () => {
            const turn: OutsiderTurn = {
                type: 'outsider_hint',
                content: 'It is red and round',
                turnNumber: 1
            };

            const result = validator.validateOutsiderTurn(turn);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject outsider turn without content', () => {
            const turn = {
                type: 'outsider_hint',
                turnNumber: 1
            } as OutsiderTurn;

            const result = validator.validateOutsiderTurn(turn);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Outsider hint content is required and must be a string');
        });

        it('should reject outsider turn with empty content', () => {
            const turn: OutsiderTurn = {
                type: 'outsider_hint',
                content: '',
                turnNumber: 1
            };

            const result = validator.validateOutsiderTurn(turn);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Outsider hint content is required and must be a string');
        });

        it('should reject outsider turn with content too long', () => {
            const turn: OutsiderTurn = {
                type: 'outsider_hint',
                content: 'a'.repeat(501),
                turnNumber: 1
            };

            const result = validator.validateOutsiderTurn(turn);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Outsider hint content must be no more than 500 characters');
        });
    });

    describe('validateAITurn', () => {
        it('should validate valid AI turn', () => {
            const turn: AITurn = {
                type: 'ai_analysis',
                thinking: [
                    'The outsider mentioned something red and round',
                    'This could be a fruit like an apple',
                    'It could also be a tomato or cherry',
                    'I should consider common red round objects'
                ],
                guess: 'apple',
                turnNumber: 2
            };

            const result = validator.validateAITurn(turn);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject AI turn without thinking array', () => {
            const turn = {
                type: 'ai_analysis',
                guess: 'apple',
                turnNumber: 2
            } as AITurn;

            const result = validator.validateAITurn(turn);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('AI thinking process must be an array');
        });

        it('should reject AI turn with wrong number of thinking sentences', () => {
            const turn: AITurn = {
                type: 'ai_analysis',
                thinking: [
                    'The outsider mentioned something red and round',
                    'This could be a fruit like an apple'
                ],
                guess: 'apple',
                turnNumber: 2
            };

            const result = validator.validateAITurn(turn);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('AI thinking process must contain exactly 4 sentences');
        });

        it('should reject AI turn with empty thinking sentence', () => {
            const turn: AITurn = {
                type: 'ai_analysis',
                thinking: [
                    'The outsider mentioned something red and round',
                    '',
                    'It could also be a tomato or cherry',
                    'I should consider common red round objects'
                ],
                guess: 'apple',
                turnNumber: 2
            };

            const result = validator.validateAITurn(turn);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('AI thinking sentence 1 cannot be empty');
        });

        it('should reject AI turn with thinking sentence too long', () => {
            const turn: AITurn = {
                type: 'ai_analysis',
                thinking: [
                    'The outsider mentioned something red and round',
                    'This could be a fruit like an apple',
                    'It could also be a tomato or cherry',
                    'a'.repeat(101)
                ],
                guess: 'apple',
                turnNumber: 2
            };

            const result = validator.validateAITurn(turn);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('AI thinking sentence 3 must be no more than 100 characters');
        });

        it('should reject AI turn without guess', () => {
            const turn = {
                type: 'ai_analysis',
                thinking: [
                    'The outsider mentioned something red and round',
                    'This could be a fruit like an apple',
                    'It could also be a tomato or cherry',
                    'I should consider common red round objects'
                ],
                turnNumber: 2
            } as AITurn;

            const result = validator.validateAITurn(turn);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('AI guess is required and must be a string');
        });

        it('should reject AI turn with guess too short', () => {
            const turn: AITurn = {
                type: 'ai_analysis',
                thinking: [
                    'The outsider mentioned something red and round',
                    'This could be a fruit like an apple',
                    'It could also be a tomato or cherry',
                    'I should consider common red round objects'
                ],
                guess: 'ab',
                turnNumber: 2
            };

            const result = validator.validateAITurn(turn);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('AI guess must be at least 3 characters');
        });

        it('should reject AI turn with guess too long', () => {
            const turn: AITurn = {
                type: 'ai_analysis',
                thinking: [
                    'The outsider mentioned something red and round',
                    'This could be a fruit like an apple',
                    'It could also be a tomato or cherry',
                    'I should consider common red round objects'
                ],
                guess: 'a'.repeat(13),
                turnNumber: 2
            };

            const result = validator.validateAITurn(turn);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('AI guess must be no more than 12 characters');
        });
    });

    describe('validateInsiderTurn', () => {
        it('should validate valid insider turn', () => {
            const turn: InsiderTurn = {
                type: 'insider_guess',
                guess: 'tomato',
                turnNumber: 3
            };

            const result = validator.validateInsiderTurn(turn);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject insider turn without guess', () => {
            const turn = {
                type: 'insider_guess',
                turnNumber: 3
            } as InsiderTurn;

            const result = validator.validateInsiderTurn(turn);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Insider guess is required and must be a string');
        });

        it('should reject insider turn with guess too short', () => {
            const turn: InsiderTurn = {
                type: 'insider_guess',
                guess: 'ab',
                turnNumber: 3
            };

            const result = validator.validateInsiderTurn(turn);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Insider guess must be at least 3 characters');
        });

        it('should reject insider turn with guess too long', () => {
            const turn: InsiderTurn = {
                type: 'insider_guess',
                guess: 'a'.repeat(13),
                turnNumber: 3
            };

            const result = validator.validateInsiderTurn(turn);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Insider guess must be no more than 12 characters');
        });
    });

    describe('validateConversationHistory', () => {
        it('should validate valid conversation history', () => {
            const history: Turn[] = [
                {
                    type: 'outsider_hint',
                    content: 'It is red and round',
                    turnNumber: 1
                },
                {
                    type: 'ai_analysis',
                    thinking: [
                        'The outsider mentioned something red and round',
                        'This could be a fruit like an apple',
                        'It could also be a tomato or cherry',
                        'I should consider common red round objects'
                    ],
                    guess: 'apple',
                    turnNumber: 2
                },
                {
                    type: 'insider_guess',
                    guess: 'tomato',
                    turnNumber: 3
                },
                {
                    type: 'ai_analysis',
                    thinking: [
                        'The insider guessed tomato',
                        'This is also red and round',
                        'The outsider mentioned it is red and round',
                        'I should guess something else red and round'
                    ],
                    guess: 'cherry',
                    turnNumber: 4
                }
            ];

            const result = validator.validateConversationHistory(history);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should validate empty conversation history', () => {
            const history: Turn[] = [];

            const result = validator.validateConversationHistory(history);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject conversation history with invalid turn', () => {
            const history = [
                {
                    type: 'outsider_hint',
                    content: 'It is red and round',
                    turnNumber: 1
                },
                {
                    type: 'ai_analysis',
                    thinking: ['Only one sentence'],
                    guess: 'apple',
                    turnNumber: 2
                }
            ] as Turn[];

            const result = validator.validateConversationHistory(history);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Turn 2: AI thinking process must contain exactly 4 sentences');
        });
    });

    describe('validateTurnOrder', () => {
        it('should validate valid turn order', () => {
            const history: Turn[] = [
                {
                    type: 'outsider_hint',
                    content: 'It is red and round',
                    turnNumber: 1
                },
                {
                    type: 'ai_analysis',
                    thinking: [
                        'The outsider mentioned something red and round',
                        'This could be a fruit like an apple',
                        'It could also be a tomato or cherry',
                        'I should consider common red round objects'
                    ],
                    guess: 'apple',
                    turnNumber: 2
                },
                {
                    type: 'insider_guess',
                    guess: 'tomato',
                    turnNumber: 3
                },
                {
                    type: 'ai_analysis',
                    thinking: [
                        'The insider guessed tomato',
                        'This is also red and round',
                        'The outsider mentioned it is red and round',
                        'I should guess something else red and round'
                    ],
                    guess: 'cherry',
                    turnNumber: 4
                }
            ];

            const result = validator.validateTurnOrder(history);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should validate empty history', () => {
            const history: Turn[] = [];

            const result = validator.validateTurnOrder(history);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject history that does not start with outsider_hint', () => {
            const history: Turn[] = [
                {
                    type: 'ai_analysis',
                    thinking: [
                        'The outsider mentioned something red and round',
                        'This could be a fruit like an apple',
                        'It could also be a tomato or cherry',
                        'I should consider common red round objects'
                    ],
                    guess: 'apple',
                    turnNumber: 1
                }
            ];

            const result = validator.validateTurnOrder(history);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('First turn must be outsider_hint');
        });

        it('should reject outsider_hint following insider_guess', () => {
            const history: Turn[] = [
                {
                    type: 'outsider_hint',
                    content: 'It is red and round',
                    turnNumber: 1
                },
                {
                    type: 'ai_analysis',
                    thinking: [
                        'The outsider mentioned something red and round',
                        'This could be a fruit like an apple',
                        'It could also be a tomato or cherry',
                        'I should consider common red round objects'
                    ],
                    guess: 'apple',
                    turnNumber: 2
                },
                {
                    type: 'insider_guess',
                    guess: 'tomato',
                    turnNumber: 3
                },
                {
                    type: 'outsider_hint',
                    content: 'It is also sweet',
                    turnNumber: 4
                }
            ];

            const result = validator.validateTurnOrder(history);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Turn 4: outsider_hint can only follow ai_analysis, but previous turn was insider_guess');
        });

        it('should reject ai_analysis following outsider_hint twice in a row', () => {
            const history: Turn[] = [
                {
                    type: 'outsider_hint',
                    content: 'It is red and round',
                    turnNumber: 1
                },
                {
                    type: 'ai_analysis',
                    thinking: [
                        'The outsider mentioned something red and round',
                        'This could be a fruit like an apple',
                        'It could also be a tomato or cherry',
                        'I should consider common red round objects'
                    ],
                    guess: 'apple',
                    turnNumber: 2
                },
                {
                    type: 'ai_analysis',
                    thinking: [
                        'I already guessed apple',
                        'Let me think of something else',
                        'It could be a tomato',
                        'I should guess tomato'
                    ],
                    guess: 'tomato',
                    turnNumber: 3
                }
            ];

            const result = validator.validateTurnOrder(history);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Turn 3: ai_analysis can only follow outsider_hint or insider_guess, but previous turn was ai_analysis');
        });

        it('should reject insider_guess following outsider_hint', () => {
            const history: Turn[] = [
                {
                    type: 'outsider_hint',
                    content: 'It is red and round',
                    turnNumber: 1
                },
                {
                    type: 'insider_guess',
                    guess: 'tomato',
                    turnNumber: 2
                }
            ];

            const result = validator.validateTurnOrder(history);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Turn 2: insider_guess can only follow ai_analysis, but previous turn was outsider_hint');
        });
    });

    describe('validateTurnNumbers', () => {
        it('should validate sequential turn numbers', () => {
            const history: Turn[] = [
                {
                    type: 'outsider_hint',
                    content: 'It is red and round',
                    turnNumber: 1
                },
                {
                    type: 'ai_analysis',
                    thinking: [
                        'The outsider mentioned something red and round',
                        'This could be a fruit like an apple',
                        'It could also be a tomato or cherry',
                        'I should consider common red round objects'
                    ],
                    guess: 'apple',
                    turnNumber: 2
                },
                {
                    type: 'insider_guess',
                    guess: 'tomato',
                    turnNumber: 3
                }
            ];

            const result = validator.validateTurnNumbers(history);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should validate empty history', () => {
            const history: Turn[] = [];

            const result = validator.validateTurnNumbers(history);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject non-sequential turn numbers', () => {
            const history: Turn[] = [
                {
                    type: 'outsider_hint',
                    content: 'It is red and round',
                    turnNumber: 1
                },
                {
                    type: 'ai_analysis',
                    thinking: [
                        'The outsider mentioned something red and round',
                        'This could be a fruit like an apple',
                        'It could also be a tomato or cherry',
                        'I should consider common red round objects'
                    ],
                    guess: 'apple',
                    turnNumber: 3
                }
            ];

            const result = validator.validateTurnNumbers(history);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Turn 2 has turnNumber 3, but expected 2');
        });

        it('should reject turn numbers not starting from 1', () => {
            const history: Turn[] = [
                {
                    type: 'outsider_hint',
                    content: 'It is red and round',
                    turnNumber: 2
                }
            ];

            const result = validator.validateTurnNumbers(history);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Turn 1 has turnNumber 2, but expected 1');
        });
    });

    describe('validateAIResponse', () => {
        it('should validate valid AI response', () => {
            const response: AIResponse = {
                thinking: [
                    'The outsider mentioned something red and round',
                    'This could be a fruit like an apple',
                    'It could also be a tomato or cherry',
                    'I should consider common red round objects'
                ],
                guess: 'apple'
            };

            const result = validator.validateAIResponse(response);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject AI response without thinking array', () => {
            const response = {
                guess: 'apple'
            } as AIResponse;

            const result = validator.validateAIResponse(response);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Thinking process must be an array');
        });

        it('should reject AI response with wrong number of thinking sentences', () => {
            const response: AIResponse = {
                thinking: [
                    'The outsider mentioned something red and round',
                    'This could be a fruit like an apple'
                ],
                guess: 'apple'
            };

            const result = validator.validateAIResponse(response);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Thinking process must contain exactly 4 sentences');
        });

        it('should reject AI response with empty thinking sentence', () => {
            const response: AIResponse = {
                thinking: [
                    'The outsider mentioned something red and round',
                    '',
                    'It could also be a tomato or cherry',
                    'I should consider common red round objects'
                ],
                guess: 'apple'
            };

            const result = validator.validateAIResponse(response);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Thinking process item 1 cannot be empty');
        });

        it('should reject AI response with thinking sentence too long', () => {
            const response: AIResponse = {
                thinking: [
                    'The outsider mentioned something red and round',
                    'This could be a fruit like an apple',
                    'It could also be a tomato or cherry',
                    'a'.repeat(101)
                ],
                guess: 'apple'
            };

            const result = validator.validateAIResponse(response);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Thinking process item 3 must be no more than 100 characters');
        });

        it('should reject AI response without guess', () => {
            const response = {
                thinking: [
                    'The outsider mentioned something red and round',
                    'This could be a fruit like an apple',
                    'It could also be a tomato or cherry',
                    'I should consider common red round objects'
                ]
            } as AIResponse;

            const result = validator.validateAIResponse(response);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Guess is required and must be a string');
        });

        it('should reject AI response with guess too short', () => {
            const response: AIResponse = {
                thinking: [
                    'The outsider mentioned something red and round',
                    'This could be a fruit like an apple',
                    'It could also be a tomato or cherry',
                    'I should consider common red round objects'
                ],
                guess: 'ab'
            };

            const result = validator.validateAIResponse(response);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Guess must be at least 3 characters');
        });

        it('should reject AI response with guess too long', () => {
            const response: AIResponse = {
                thinking: [
                    'The outsider mentioned something red and round',
                    'This could be a fruit like an apple',
                    'It could also be a tomato or cherry',
                    'I should consider common red round objects'
                ],
                guess: 'a'.repeat(13)
            };

            const result = validator.validateAIResponse(response);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Guess must be no more than 12 characters');
        });
    });

    describe('validatePlayerGuess', () => {
        it('should validate valid player guess', () => {
            const result = validator.validatePlayerGuess('apple');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject empty guess', () => {
            const result = validator.validatePlayerGuess('');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Guess must be a string');
        });

        it('should reject whitespace-only guess', () => {
            const result = validator.validatePlayerGuess('   ');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Guess cannot be empty');
        });

        it('should reject guess too short', () => {
            const result = validator.validatePlayerGuess('ab');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Guess must be at least 3 characters');
        });

        it('should reject guess too long', () => {
            const result = validator.validatePlayerGuess('a'.repeat(13));
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Guess must be no more than 12 characters');
        });

        it('should reject non-string guess', () => {
            const result = validator.validatePlayerGuess(123);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Guess must be a string');
        });

        it('should reject null guess', () => {
            const result = validator.validatePlayerGuess(null);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Guess must be a string');
        });
    });

    // Keep existing tests for other validation methods
    describe('validatePlayer', () => {
        it('should validate valid player', () => {
            const player = {
                id: 'player1',
                name: 'Player 1',
                ready: true,
                role: 'encryptor' as const,
                socketId: 'socket1'
            };

            const result = validator.validatePlayer(player);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject player without id', () => {
            const player = {
                name: 'Player 1',
                ready: true,
                role: 'encryptor' as const,
                socketId: 'socket1'
            };

            const result = validator.validatePlayer(player);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Player ID is required and must be a string');
        });
    });

    describe('validateGameState', () => {
        it('should validate valid game state', () => {
            const gameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [],
                currentTurn: 'encryptor' as const,
                gameStatus: 'active' as const
            };

            const result = validator.validateGameState(gameState);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should validate game state with conversation history', () => {
            const gameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [
                    {
                        type: 'outsider_hint',
                        content: 'It is red and round',
                        turnNumber: 1
                    }
                ],
                currentTurn: 'ai' as const,
                gameStatus: 'active' as const
            };

            const result = validator.validateGameState(gameState);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject game state with invalid conversation history', () => {
            const gameState = {
                score: 5,
                currentRound: 1,
                secretWord: 'apple',
                conversationHistory: [
                    {
                        type: 'outsider_hint',
                        content: 'It is red and round',
                        turnNumber: 1
                    },
                    {
                        type: 'ai_analysis',
                        thinking: ['Only one sentence'],
                        guess: 'apple',
                        turnNumber: 2
                    }
                ],
                currentTurn: 'decryptor' as const,
                gameStatus: 'active' as const
            };

            const result = validator.validateGameState(gameState);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Turn 2: AI thinking process must contain exactly 4 sentences');
        });
    });
}); 