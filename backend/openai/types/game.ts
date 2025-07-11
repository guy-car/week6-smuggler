import { z } from 'zod';

/**
 * Type of turn in the conversation:
 * - encoder_hint: A hint message from the encoder trying to communicate the secret
 * - ai_analysis: AI's analysis of the conversation with thinking and guess
 * - decoder_guess: Decoder's attempt to guess the secret word (only failed guesses appear in history)
 */
export const TurnTypeSchema = z.enum(['encoder_hint', 'ai_analysis', 'decoder_guess']);
export type TurnType = z.infer<typeof TurnTypeSchema>;

/**
 * Encoder's hint in the conversation
 */
export const EncoderTurnSchema = z.object({
  type: z.literal('encoder_hint'),
  content: z.string()
    .describe('The hint message from the encoder'),
  turnNumber: z.number().int().positive()
    .describe('Sequential turn number')
    .optional()
});
export type EncoderTurn = z.infer<typeof EncoderTurnSchema>;

/**
 * AI's analysis of the conversation
 * @constraints
 * - thinking: Exactly 4 sentences
 * - guess: Single word, 3-12 characters (AI guesses only)
 */
export const AITurnSchema = z.object({
  type: z.literal('ai_analysis'),
  thinking: z.array(z.string()).length(4)
    .describe('AI\'s thought process as exactly 4 sentences'),
  guess: z.string()
    .min(3).max(12)
    .describe('AI\'s guess at the secret word'),
  turnNumber: z.number().int().positive()
    .describe('Sequential turn number')
    .optional()
});
export type AITurn = z.infer<typeof AITurnSchema>;

/**
 * Decoder's guess attempt
 * Note: Only failed guesses appear in conversation history
 * as correct guesses end the game
 */
export const DecoderTurnSchema = z.object({
  type: z.literal('decoder_guess'),
  guess: z.string()
    .describe('Decoder\'s guess attempt'),
  turnNumber: z.number().int().positive()
    .describe('Sequential turn number')
    .optional()
});
export type DecoderTurn = z.infer<typeof DecoderTurnSchema>;

/**
 * Union type for all possible turns
 */
export const TurnSchema = z.discriminatedUnion('type', [
  EncoderTurnSchema,
  AITurnSchema,
  DecoderTurnSchema
]);
export type Turn = z.infer<typeof TurnSchema>;

/**
 * Request body for /api/ai/analyze endpoint
 * Contains game ID and chronological sequence of turns
 * 
 * @example
 * ```typescript
 * const request = {
 *   gameId: "room123",
 *   conversationHistory: [
 *     // Encoder sends hint
 *     { type: 'encoder_hint', content: "It's red and sweet" },
 *     
 *     // AI analyzes and guesses
 *     { type: 'ai_analysis', thinking: ["...", "...", "...", "..."], guess: "cherry" },
 *     
 *     // Decoder makes wrong guess
 *     { type: 'decoder_guess', guess: "apple" }
 *   ]
 * }
 * ```
 */
export const AnalyzeRequestSchema = z.object({
  /** Room/session identifier */
  gameId: z.string().optional(),

  /** Chronological sequence of turns */
  conversationHistory: z.array(TurnSchema)

});
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

/**
 * AI's response to analyzing the conversation
 */
export const AIResponseSchema = z.object({
  /** AI's thought process as exactly 4 sentences */
  thinking: z.array(z.string()).length(4),

  /** AI's guess at the secret word */
  guess: z.string()
    .min(3).max(12)
});
export type AIResponse = z.infer<typeof AIResponseSchema>;

export interface RoundSummary {
  winner: 'players' | 'ai';
  secretWord: string;
  conversation: Turn[];
  round: number;
}

export interface RoundAnalysis {
  analysis: string;
  comment: string;  // Not optional anymore
}

export const RoundSummarySchema = z.object({
  winner: z.enum(['players', 'ai']),
  secretWord: z.string(),
  conversation: z.array(TurnSchema),
  round: z.number()
});

export const RoundAnalysisSchema = z.object({
  analysis: z.string(),
  comment: z.string()
}); 