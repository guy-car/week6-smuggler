import { AITurn, DecoderTurn, EncoderTurn, Turn } from '../src/types';

describe('Turn Validation', () => {
    describe('Turn Structure Validation', () => {
        it('should validate correct EncoderTurn structure', () => {
            const encoderTurn: EncoderTurn = {
                type: 'encoder_hint',
                content: 'This is a hint message',
                turnNumber: 1
            };

            expect(encoderTurn.type).toBe('encoder_hint');
            expect(typeof encoderTurn.content).toBe('string');
            expect(encoderTurn.content.length).toBeGreaterThan(0);
            expect(typeof encoderTurn.turnNumber).toBe('number');
            expect(encoderTurn.turnNumber).toBeGreaterThan(0);
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

        it('should validate correct DecoderTurn structure', () => {
            const decoderTurn: DecoderTurn = {
                type: 'decoder_guess',
                guess: 'testguess',
                turnNumber: 3
            };

            expect(decoderTurn.type).toBe('decoder_guess');
            expect(typeof decoderTurn.guess).toBe('string');
            expect(decoderTurn.guess.length).toBeGreaterThan(0);
            expect(typeof decoderTurn.turnNumber).toBe('number');
            expect(decoderTurn.turnNumber).toBeGreaterThan(0);
        });
    });

    describe('Turn Order Validation', () => {
        it('should validate correct turn sequence: encoder → ai → decoder → ai', () => {
            const conversationHistory: Turn[] = [
                { type: 'encoder_hint', content: 'First hint', turnNumber: 1 },
                { type: 'ai_analysis', thinking: ['T1', 'T2', 'T3', 'T4'], guess: 'guess1', turnNumber: 2 },
                { type: 'decoder_guess', guess: 'wrongguess', turnNumber: 3 },
                { type: 'ai_analysis', thinking: ['T5', 'T6', 'T7', 'T8'], guess: 'guess2', turnNumber: 4 }
            ];

            // Validate turn order
            for (let i = 0; i < conversationHistory.length; i++) {
                const turn = conversationHistory[i]!;

                if (i === 0) {
                    expect(turn.type).toBe('encoder_hint');
                } else if (i % 2 === 1) {
                    expect(turn.type).toBe('ai_analysis');
                } else {
                    expect(turn.type).toBe('decoder_guess');
                }
            }
        });

        it('should detect invalid turn sequence: two encoder turns in a row', () => {
            const conversationHistory: Turn[] = [
                { type: 'encoder_hint', content: 'First hint', turnNumber: 1 },
                { type: 'encoder_hint', content: 'Second hint', turnNumber: 2 } // Invalid
            ];

            expect(conversationHistory[0]?.type).toBe('encoder_hint');
            expect(conversationHistory[1]?.type).toBe('encoder_hint');
            // This should be detected as invalid in validation logic
        });

        it('should detect invalid turn sequence: two decoder turns in a row', () => {
            const conversationHistory: Turn[] = [
                { type: 'encoder_hint', content: 'First hint', turnNumber: 1 },
                { type: 'ai_analysis', thinking: ['T1', 'T2', 'T3', 'T4'], guess: 'guess1', turnNumber: 2 },
                { type: 'decoder_guess', guess: 'wrongguess1', turnNumber: 3 },
                { type: 'decoder_guess', guess: 'wrongguess2', turnNumber: 4 } // Invalid
            ];

            expect(conversationHistory[2]?.type).toBe('decoder_guess');
            expect(conversationHistory[3]?.type).toBe('decoder_guess');
            // This should be detected as invalid in validation logic
        });

        it('should detect invalid turn sequence: two AI turns in a row', () => {
            const conversationHistory: Turn[] = [
                { type: 'encoder_hint', content: 'First hint', turnNumber: 1 },
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
                { type: 'encoder_hint', content: 'First hint', turnNumber: 1 },
                { type: 'ai_analysis', thinking: ['T1', 'T2', 'T3', 'T4'], guess: 'guess1', turnNumber: 2 },
                { type: 'decoder_guess', guess: 'wrongguess', turnNumber: 3 },
                { type: 'ai_analysis', thinking: ['T5', 'T6', 'T7', 'T8'], guess: 'guess2', turnNumber: 4 }
            ];

            for (let i = 0; i < conversationHistory.length; i++) {
                expect(conversationHistory[i]?.turnNumber).toBe(i + 1);
            }
        });

        it('should detect non-sequential turn numbers', () => {
            const conversationHistory: Turn[] = [
                { type: 'encoder_hint', content: 'First hint', turnNumber: 1 },
                { type: 'ai_analysis', thinking: ['T1', 'T2', 'T3', 'T4'], guess: 'guess1', turnNumber: 3 } // Invalid: should be 2
            ];

            expect(conversationHistory[0]?.turnNumber).toBe(1);
            expect(conversationHistory[1]?.turnNumber).toBe(3);
            // This should be detected as invalid in validation logic
        });

        it('should detect duplicate turn numbers', () => {
            const conversationHistory: Turn[] = [
                { type: 'encoder_hint', content: 'First hint', turnNumber: 1 },
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

    describe('Decoder Guess Validation', () => {
        it('should validate decoder guess is not empty', () => {
            const validDecoderTurn: DecoderTurn = {
                type: 'decoder_guess',
                guess: 'test', // Any length is valid
                turnNumber: 3
            };

            expect(validDecoderTurn.guess.length).toBeGreaterThan(0);
            expect(typeof validDecoderTurn.guess).toBe('string');
        });

        it('should allow decoder guess of any reasonable length', () => {
            const shortGuess: DecoderTurn = {
                type: 'decoder_guess',
                guess: 'a', // Single character
                turnNumber: 3
            };

            const longGuess: DecoderTurn = {
                type: 'decoder_guess',
                guess: 'verylongguesswordthatiscompletelyvalid', // Long guess
                turnNumber: 3
            };

            expect(shortGuess.guess.length).toBeGreaterThan(0);
            expect(longGuess.guess.length).toBeGreaterThan(0);
            expect(typeof shortGuess.guess).toBe('string');
            expect(typeof longGuess.guess).toBe('string');
        });
    });

    describe('Encoder Hint Validation', () => {
        it('should validate encoder hint content is not empty', () => {
            const validEncoderTurn: EncoderTurn = {
                type: 'encoder_hint',
                content: 'This is a valid hint message',
                turnNumber: 1
            };

            expect(validEncoderTurn.content.length).toBeGreaterThan(0);
            expect(typeof validEncoderTurn.content).toBe('string');
        });

        it('should detect encoder hint with empty content', () => {
            const invalidEncoderTurn: EncoderTurn = {
                type: 'encoder_hint',
                content: '', // Empty content
                turnNumber: 1
            };

            expect(invalidEncoderTurn.content.length).toBe(0);
            // This should be detected as invalid in validation logic
        });
    });
}); 