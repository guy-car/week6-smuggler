import { z } from 'zod';

/**
 * Turn types in the conversation:
 * - encoder: A hint message from the encoder trying to communicate the secret
 * - ai_analysis: AI's analysis of the conversation and its guess attempt
 * - decoder: Decoder's attempt to guess the secret word (only failed guesses appear in history)
 */
export const TurnTypeSchema = z.enum(['encoder', 'ai_analysis', 'decoder']);

export type TurnType = z.infer<typeof TurnTypeSchema>;

/**
 * Encoder's hint in the conversation
 */
export const EncoderTurnSchema = z.object({
    type: z.literal('encoder'),
    content: z.string()
        .min(1)
        .describe('The hint message from the encoder'),
    turnNumber: z.number()
        .int()
        .positive()
});

export type EncoderTurn = z.infer<typeof EncoderTurnSchema>;

/**
 * AI's analysis and guess attempt
 */
export const AITurnSchema = z.object({
    type: z.literal('ai_analysis'),
    thinking: z.array(z.string())
        .length(4)
        .describe('AI\'s thought process (exactly 4 sentences)'),
    guess: z.string()
        .min(1)
        .describe('AI\'s guess attempt'),
    turnNumber: z.number()
        .int()
        .positive()
});

export type AITurn = z.infer<typeof AITurnSchema>;

/**
 * Decoder's guess attempt
 */
export const DecoderTurnSchema = z.object({
    type: z.literal('decoder'),
    guess: z.string()
        .min(1)
        .describe('Decoder\'s guess attempt'),
    turnNumber: z.number()
        .int()
        .positive()
});

export type DecoderTurn = z.infer<typeof DecoderTurnSchema>;

/**
 * Union of all possible turn types
 */
export const TurnSchema = z.discriminatedUnion('type', [
    EncoderTurnSchema,
    AITurnSchema,
    DecoderTurnSchema
]);

export type Turn = z.infer<typeof TurnSchema>;

/**
 * Request to analyze conversation history
 * @example
 * {
 *     gameId: "room123",
 *     conversationHistory: [
 *     // Encoder sends hint
 *     { type: 'encoder', content: "It's red and sweet" },
 *     // AI analyzes and guesses
 *     { type: 'ai_analysis', thinking: ["...", "...", "...", "..."], guess: "strawberry" },
 *     // Decoder makes wrong guess
 *     { type: 'decoder', guess: "apple" }
 *     ]
 * }
 */
export const AnalyzeRequestSchema = z.object({
    /** Room/session identifier */
    gameId: z.string().optional(),

    /** Chronological sequence of turns */
    conversationHistory: z.array(TurnSchema)

});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

/**
 * AI's response to analyzing conversation
 */
export const AIResponseSchema = z.object({
    thinking: z.array(z.string())
        .length(4)
        .describe('AI\'s thought process (exactly 4 sentences)'),
    guess: z.string()
        .min(1)
        .describe('AI\'s guess attempt')
});

export type AIResponse = z.infer<typeof AIResponseSchema>; 