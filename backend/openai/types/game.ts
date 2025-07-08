import { z } from 'zod';

/**
 * Type of turn in the conversation:
 * - outsider_hint: A hint message from the outsider trying to communicate the secret
 * - ai_analysis: AI's analysis of the conversation with thinking and guess
 * - insider_guess: Insider's attempt to guess the secret word (only failed guesses appear in history)
 */
export const TurnTypeSchema = z.enum(['outsider_hint', 'ai_analysis', 'insider_guess']);
export type TurnType = z.infer<typeof TurnTypeSchema>;

/**
 * Outsider's hint in the conversation
 */
export const OutsiderTurnSchema = z.object({
  type: z.literal('outsider_hint'),
  content: z.string()
    .describe('The hint message from the outsider'),
  turnNumber: z.number().int().positive()
    .describe('Sequential turn number')
    .optional()
});
export type OutsiderTurn = z.infer<typeof OutsiderTurnSchema>;

/**
 * AI's analysis of the conversation
 * @constraints
 * - thinking: Exactly 4 sentences
 * - guess: Single word, 3-12 characters
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
 * Insider's guess attempt
 * Note: Only failed guesses appear in conversation history
 * as correct guesses end the game
 */
export const InsiderTurnSchema = z.object({
  type: z.literal('insider_guess'),
  guess: z.string()
    .min(3).max(12)
    .describe('Insider\'s guess attempt'),
  turnNumber: z.number().int().positive()
    .describe('Sequential turn number')
    .optional()
});
export type InsiderTurn = z.infer<typeof InsiderTurnSchema>;

/**
 * Union type for all possible turns
 */
export const TurnSchema = z.discriminatedUnion('type', [
  OutsiderTurnSchema,
  AITurnSchema,
  InsiderTurnSchema
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
 *     // Outsider sends hint
 *     { type: 'outsider_hint', content: "It's red and sweet" },
 *     
 *     // AI analyzes and guesses
 *     { type: 'ai_analysis', thinking: ["...", "...", "...", "..."], guess: "cherry" },
 *     
 *     // Insider makes wrong guess
 *     { type: 'insider_guess', guess: "apple" }
 *   ]
 * }
 * ```
 */
export const AnalyzeRequestSchema = z.object({
  /** Room/session identifier */
  gameId: z.string(),
  
  /** Chronological sequence of turns */
  conversationHistory: z.array(TurnSchema)
    .refine(
      (turns) => {
        // Verify turns alternate correctly: outsider -> ai -> insider -> ai -> outsider -> ...
        return turns.every((turn, idx) => {
          if (idx === 0) return turn.type === 'outsider_hint';
          const prevType = turns[idx - 1].type;
          switch (turn.type) {
            case 'outsider_hint':
              return prevType === 'ai_analysis';
            case 'ai_analysis':
              return prevType === 'outsider_hint' || prevType === 'insider_guess';
            case 'insider_guess':
              return prevType === 'ai_analysis';
          }
        });
      },
      { message: "Turns must follow the pattern: outsider -> ai -> insider -> ai -> outsider" }
    )
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