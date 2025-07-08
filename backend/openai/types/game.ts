import { z } from 'zod';

/**
 * Role in the conversation
 * - outsider: Player sending the secret word from outside
 * - insider: Player inside trying to receive the word
 * - ai: The AI system monitoring communications
 */
export const RoleSchema = z.enum(['outsider', 'insider', 'ai']);
export type Role = z.infer<typeof RoleSchema>;

/**
 * Type of message in the conversation
 * - hint: A message trying to communicate the secret
 * - guess: An attempt to guess the secret word
 * - thinking: AI's thought process before making a guess
 */
export const MessageTypeSchema = z.enum(['hint', 'guess', 'thinking']);
export type MessageType = z.infer<typeof MessageTypeSchema>;

/**
 * A single message in the conversation history
 * @deprecated Use ContextAddition types instead for new code
 */
export const MessageSchema = z.object({
  /** Who sent the message */
  role: RoleSchema,
  
  /** What kind of message it is */
  type: MessageTypeSchema,
  
  /** The actual message content */
  content: z.string(),
  
  /** When the message was sent (optional) */
  timestamp: z.date().optional(),
});
export type Message = z.infer<typeof MessageSchema>;

/**
 * New turn-based context structure for conversation history
 * This provides cleaner separation between different participant types
 * and eliminates the need for regex parsing of AI responses
 */

// Outsider's message in the conversation
export const OutsiderContextSchema = z.object({
  type: z.literal('outsider'),
  message: z.string()
    .describe('The message from the oil rig worker (appears as Marcus_Chen_ID7429 to AI)')
});
export type OutsiderContext = z.infer<typeof OutsiderContextSchema>;

// Insider's message in the conversation
export const InsiderContextSchema = z.object({
  type: z.literal('insider'),
  message: z.string()
    .describe('The message from the worker\'s wife (appears as Sarah_Chen_Personal_Contact to AI)')
});
export type InsiderContext = z.infer<typeof InsiderContextSchema>;

// AI's analysis of the conversation
export const AIContextSchema = z.object({
  type: z.literal('ai'),
  thinking: z.array(z.string()).length(4)
    .describe('AI\'s thought process as exactly 4 short sentences'),
  guess: z.string().max(12)
    .describe('AI\'s guess at the potential exploit code'),
  suspicionLevel: z.number().min(0).max(100)
    .describe('How suspicious the AI is about the conversation being coded communication')
});
export type AIContext = z.infer<typeof AIContextSchema>;

// Union type for all possible context additions
export const ContextAdditionSchema = z.discriminatedUnion('type', [
  OutsiderContextSchema,
  InsiderContextSchema,
  AIContextSchema
]);
export type ContextAddition = z.infer<typeof ContextAdditionSchema>;

/**
 * AI's assessment of the conversation
 * @constraints
 * - thinking: Exactly 4 sentences, max 12 words each
 * - guess: Single word, max 12 characters
 * - suspicionLevel: How suspicious the AI is about the conversation (0-100)
 *   High suspicion means the AI thinks:
 *   - Messages seem like coded communication rather than normal chat
 *   - The couple's behavior doesn't feel like genuine husband/wife interaction
 */
export const AIResponseSchema = z.object({
  /** AI's thought process as exactly 4 short sentences */
  thinking: z.array(z.string()).length(4),
  
  /** AI's guess at the secret word */
  guess: z.string().max(12),
  
  /** How suspicious AI is that this isn't genuine domestic chat (0-100) */
  suspicionLevel: z.number().min(0).max(100)
    .describe('How suspicious the AI is that the conversation is coded communication rather than genuine domestic chat'),
});
export type AIResponse = z.infer<typeof AIResponseSchema>;

/**
 * A single turn in the conversation.
 * Each turn represents a complete action by one participant.
 * 
 * Turn Completion Rules:
 * - Outsider turn: Complete when they send their message
 * - AI turn: Complete when we have thinking, guess, AND suspicion level
 * - Insider turn: Complete when:
 *   1. They make a guess
 *   2. If wrong, they must also send a message
 *   3. If correct, game ends (no message needed)
 */
export const TurnSchema = z.object({
  /** Sequential turn number starting from 1 */
  turnNumber: z.number().min(1),
  
  /** When this turn was completed (all required actions done) */
  timestamp: z.date(),
  
  /** The context added during this turn */
  context: ContextAdditionSchema
});
export type Turn = z.infer<typeof TurnSchema>;

/**
 * Request body for /api/ai/analyze endpoint.
 * Contains a chronological sequence of completed turns.
 * 
 * @example
 * ```typescript
 * const request = {
 *   turns: [
 *     // Outsider sends a message
 *     { turnNumber: 1, context: { type: 'outsider', message: "Hey honey!" } },
 *     
 *     // AI analyzes with all required fields
 *     { turnNumber: 2, context: { 
 *         type: 'ai', 
 *         thinking: ["thought1", "thought2", "thought3", "thought4"],
 *         guess: "garden",
 *         suspicionLevel: 30
 *       }
 *     },
 *     
 *     // Insider guesses wrong, then sends message
 *     { turnNumber: 3, context: { type: 'insider', message: "How's work?" } }
 *   ],
 *   currentTurn: 3
 * }
 * ```
 */
export const AnalyzeRequestSchema = z.object({
  /** Chronological sequence of turns, each containing one context addition */
  turns: z.array(TurnSchema)
    .refine(
      (turns) => {
        // Verify turn numbers are sequential and no duplicates
        const turnNumbers = turns.map(t => t.turnNumber);
        return turnNumbers.every((num, idx) => num === idx + 1);
      },
      { message: "Turn numbers must be sequential starting from 1" }
    )
    .refine(
      (turns) => {
        // Verify no duplicate participant types in consecutive turns
        return turns.every((turn, idx) => 
          idx === 0 || turn.context.type !== turns[idx - 1]!.context.type
        );
      },
      { message: "Same participant cannot have consecutive turns" }
    ),

  /** Current turn number (should match the length of turns array) */
  currentTurn: z.number().min(1)
});

// Add a top-level refinement to check turn count
export const AnalyzeRequestSchemaWithValidation = AnalyzeRequestSchema.refine(
  (data) => data.currentTurn === data.turns.length,
  { message: "currentTurn must match the number of turns" }
);

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchemaWithValidation>;

/**
 * Response body for /api/ai/analyze endpoint
 */
export const AnalyzeResponseSchema = AIResponseSchema.extend({
  /** Metadata about the analysis (for debugging/monitoring) */
  metadata: z.object({
    /** How many context additions were analyzed */
    messageCount: z.number(),
    /** When the analysis was performed */
    timestamp: z.string(),
    /** How long the analysis took (ms) */
    processingTime: z.number(),
  }).optional(),
});
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>; 