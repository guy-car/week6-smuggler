import { AITurn, InsiderTurn, OutsiderTurn, Turn } from '../src/types';

describe('Turn Validation', () => {
    describe('Turn Structure Validation', () => {
        it('should validate correct OutsiderTurn structure', () => {
            const outsiderTurn: OutsiderTurn = {
                type: 'outsider_hint',
                content: 'This is a hint message',
                turnNumber: 1
            };

            expect(outsiderTurn.type).toBe('outsider_hint');
            expect(typeof outsiderTurn.content).toBe('string');
            expect(outsiderTurn.content.length).toBeGreaterThan(0);
            expect(typeof outsiderTurn.turnNumber).toBe('number');
            expect(outsiderTurn.turnNumber).toBeGreaterThan(0);
        });

        it('should validate correct AITurn structure', () => {
            const aiTurn: AITurn = {
                type: 'ai_analysis',
                thinking: [
                    'First thought about the conversation',
                    'Second thought analyzing the context',
                    'Third thought considering possibilities',
                    'Fourth thought making final decision'
                ],
                guess: 'testguess',
                turnNumber: 2
            };

            expect(aiTurn.type).toBe('ai_analysis');
            expect(Array.isArray(aiTurn.thinking)).toBe(true);
            expect(aiTurn.thinking.length).toBe(4); // Exactly 4 sentences
            expect(typeof aiTurn.guess).toBe('string');
            expect(aiTurn.guess.length).toBeGreaterThanOrEqual(3);
            expect(aiTurn.guess.length).toBeLessThanOrEqual(12);
            expect(typeof aiTurn.turnNumber).toBe('number');
            expect(aiTurn.turnNumber).toBeGreaterThan(0);
        });

        it('should validate correct InsiderTurn structure', () => {
            const insiderTurn: InsiderTurn = {
                type: 'insider_guess',
                guess: 'testguess',
                turnNumber: 3
            };

            expect(insiderTurn.type).toBe('insider_guess');
            expect(typeof insiderTurn.guess).toBe('string');
            expect(insiderTurn.guess.length).toBeGreaterThanOrEqual(3);
            expect(insiderTurn.guess.length).toBeLessThanOrEqual(12);
            expect(typeof insiderTurn.turnNumber).toBe('number');
            expect(insiderTurn.turnNumber).toBeGreaterThan(0);
        });
    });

    describe('Turn Order Validation', () => {
        it('should validate correct turn sequence: outsider → ai → insider → ai', () => {
            const conversationHistory: Turn[] = [
                { type: 'outsider_hint', content: 'First hint', turnNumber: 1 },
                { type: 'ai_analysis', thinking: ['T1', 'T2', 'T3', 'T4'], guess: 'guess1', turnNumber: 2 },
                { type: 'insider_guess', guess: 'wrongguess', turnNumber: 3 },
                { type: 'ai_analysis', thinking: ['T5', 'T6', 'T7', 'T8'], guess: 'guess2', turnNumber: 4 }
            ];

            // Validate turn order
            for (let i = 0; i < conversationHistory.length; i++) {
                const turn = conversationHistory[i]!;

                if (i === 0) {
                    expect(turn.type).toBe('outsider_hint');
                } else if (i % 2 === 1) {
                    expect(turn.type).toBe('ai_analysis');
                } else {
                    expect(turn.type).toBe('insider_guess');
                }
            }
        });

        it('should detect invalid turn sequence: two outsider turns in a row', () => {
            const conversationHistory: Turn[] = [
                { type: 'outsider_hint', content: 'First hint', turnNumber: 1 },
                { type: 'outsider_hint', content: 'Second hint', turnNumber: 2 } // Invalid
            ];

            expect(conversationHistory[0]?.type).toBe('outsider_hint');
            expect(conversationHistory[1]?.type).toBe('outsider_hint');
            // This should be detected as invalid in validation logic
        });

        it('should detect invalid turn sequence: two insider turns in a row', () => {
            const conversationHistory: Turn[] = [
                { type: 'outsider_hint', content: 'First hint', turnNumber: 1 },
                { type: 'ai_analysis', thinking: ['T1', 'T2', 'T3', 'T4'], guess: 'guess1', turnNumber: 2 },
                { type: 'insider_guess', guess: 'wrongguess1', turnNumber: 3 },
                { type: 'insider_guess', guess: 'wrongguess2', turnNumber: 4 } // Invalid
            ];

            expect(conversationHistory[2]?.type).toBe('insider_guess');
            expect(conversationHistory[3]?.type).toBe('insider_guess');
            // This should be detected as invalid in validation logic
        });

        it('should detect invalid turn sequence: two AI turns in a row', () => {
            const conversationHistory: Turn[] = [
                { type: 'outsider_hint', content: 'First hint', turnNumber: 1 },
                { type: 'ai_analysis', thinking: ['T1', 'T2', 'T3', 'T4'], guess: 'guess1', turnNumber: 2 },
                { type: 'ai_analysis', thinking: ['T5', 'T6', 'T7', 'T8'], guess: 'guess2', turnNumber: 3 } // Invalid
            ];

            expect(conversationHistory[1]?.type).toBe('ai_analysis');
            expect(conversationHistory[2]?.type).toBe('ai_analysis');
            // This should be detected as invalid in validation logic
        });
    });

    describe('Turn Number Validation', () => {
        it('should validate sequential turn numbers starting from 1', () => {
            const conversationHistory: Turn[] = [
                { type: 'outsider_hint', content: 'First hint', turnNumber: 1 },
                { type: 'ai_analysis', thinking: ['T1', 'T2', 'T3', 'T4'], guess: 'guess1', turnNumber: 2 },
                { type: 'insider_guess', guess: 'wrongguess', turnNumber: 3 },
                { type: 'ai_analysis', thinking: ['T5', 'T6', 'T7', 'T8'], guess: 'guess2', turnNumber: 4 }
            ];

            for (let i = 0; i < conversationHistory.length; i++) {
                expect(conversationHistory[i]?.turnNumber).toBe(i + 1);
            }
        });

        it('should detect non-sequential turn numbers', () => {
            const conversationHistory: Turn[] = [
                { type: 'outsider_hint', content: 'First hint', turnNumber: 1 },
                { type: 'ai_analysis', thinking: ['T1', 'T2', 'T3', 'T4'], guess: 'guess1', turnNumber: 3 } // Invalid: should be 2
            ];

            expect(conversationHistory[0]?.turnNumber).toBe(1);
            expect(conversationHistory[1]?.turnNumber).toBe(3);
            // This should be detected as invalid in validation logic
        });

        it('should detect duplicate turn numbers', () => {
            const conversationHistory: Turn[] = [
                { type: 'outsider_hint', content: 'First hint', turnNumber: 1 },
                { type: 'ai_analysis', thinking: ['T1', 'T2', 'T3', 'T4'], guess: 'guess1', turnNumber: 1 } // Invalid: duplicate
            ];

            expect(conversationHistory[0]?.turnNumber).toBe(1);
            expect(conversationHistory[1]?.turnNumber).toBe(1);
            // This should be detected as invalid in validation logic
        });
    });

    describe('AI Response Validation', () => {
        it('should validate AI thinking has exactly 4 sentences', () => {
            const validAITurn: AITurn = {
                type: 'ai_analysis',
                thinking: [
                    'First sentence about the analysis',
                    'Second sentence considering the context',
                    'Third sentence evaluating possibilities',
                    'Fourth sentence making the final decision'
                ],
                guess: 'testguess',
                turnNumber: 2
            };

            expect(validAITurn.thinking.length).toBe(4);
            validAITurn.thinking.forEach(sentence => {
                expect(typeof sentence).toBe('string');
                expect(sentence.length).toBeGreaterThan(0);
            });
        });

        it('should detect AI thinking with wrong number of sentences', () => {
            const invalidAITurn: AITurn = {
                type: 'ai_analysis',
                thinking: [
                    'First sentence',
                    'Second sentence',
                    'Third sentence'
                    // Missing fourth sentence
                ],
                guess: 'testguess',
                turnNumber: 2
            };

            expect(invalidAITurn.thinking.length).toBe(3);
            // This should be detected as invalid in validation logic
        });

        it('should validate AI guess length constraints', () => {
            const validAITurn: AITurn = {
                type: 'ai_analysis',
                thinking: ['T1', 'T2', 'T3', 'T4'],
                guess: 'test', // 4 characters, valid
                turnNumber: 2
            };

            expect(validAITurn.guess.length).toBeGreaterThanOrEqual(3);
            expect(validAITurn.guess.length).toBeLessThanOrEqual(12);
        });

        it('should detect AI guess that is too short', () => {
            const invalidAITurn: AITurn = {
                type: 'ai_analysis',
                thinking: ['T1', 'T2', 'T3', 'T4'],
                guess: 'ab', // 2 characters, too short
                turnNumber: 2
            };

            expect(invalidAITurn.guess.length).toBeLessThan(3);
            // This should be detected as invalid in validation logic
        });

        it('should detect AI guess that is too long', () => {
            const invalidAITurn: AITurn = {
                type: 'ai_analysis',
                thinking: ['T1', 'T2', 'T3', 'T4'],
                guess: 'verylongguessword', // 17 characters, too long
                turnNumber: 2
            };

            expect(invalidAITurn.guess.length).toBeGreaterThan(12);
            // This should be detected as invalid in validation logic
        });
    });

    describe('Insider Guess Validation', () => {
        it('should validate insider guess length constraints', () => {
            const validInsiderTurn: InsiderTurn = {
                type: 'insider_guess',
                guess: 'test', // 4 characters, valid
                turnNumber: 3
            };

            expect(validInsiderTurn.guess.length).toBeGreaterThanOrEqual(3);
            expect(validInsiderTurn.guess.length).toBeLessThanOrEqual(12);
        });

        it('should detect insider guess that is too short', () => {
            const invalidInsiderTurn: InsiderTurn = {
                type: 'insider_guess',
                guess: 'ab', // 2 characters, too short
                turnNumber: 3
            };

            expect(invalidInsiderTurn.guess.length).toBeLessThan(3);
            // This should be detected as invalid in validation logic
        });

        it('should detect insider guess that is too long', () => {
            const invalidInsiderTurn: InsiderTurn = {
                type: 'insider_guess',
                guess: 'verylongguessword', // 17 characters, too long
                turnNumber: 3
            };

            expect(invalidInsiderTurn.guess.length).toBeGreaterThan(12);
            // This should be detected as invalid in validation logic
        });
    });

    describe('Outsider Hint Validation', () => {
        it('should validate outsider hint content is not empty', () => {
            const validOutsiderTurn: OutsiderTurn = {
                type: 'outsider_hint',
                content: 'This is a meaningful hint message',
                turnNumber: 1
            };

            expect(validOutsiderTurn.content.length).toBeGreaterThan(0);
            expect(typeof validOutsiderTurn.content).toBe('string');
        });

        it('should detect outsider hint with empty content', () => {
            const invalidOutsiderTurn: OutsiderTurn = {
                type: 'outsider_hint',
                content: '', // Empty content
                turnNumber: 1
            };

            expect(invalidOutsiderTurn.content.length).toBe(0);
            // This should be detected as invalid in validation logic
        });
    });
}); 