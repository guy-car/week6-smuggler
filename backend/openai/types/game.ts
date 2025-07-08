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
 * Request body for /api/ai/analyze endpoint
 */
export const AnalyzeRequestSchema = z.object({
  /** Complete history of the conversation so far */
  conversationHistory: z.array(MessageSchema),
});
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

/**
 * Response body for /api/ai/analyze endpoint
 */
export const AnalyzeResponseSchema = AIResponseSchema.extend({
  /** Metadata about the analysis (for debugging/monitoring) */
  metadata: z.object({
    /** How many messages were analyzed */
    messageCount: z.number(),
    /** When the analysis was performed */
    timestamp: z.string(),
    /** How long the analysis took (ms) */
    processingTime: z.number(),
  }).optional(),
});
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>; 