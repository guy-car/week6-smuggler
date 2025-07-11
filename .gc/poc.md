# AI Server Specifications - Smuggler Game

## Project Context
- **Timeline**: 6-day bootcamp project, POC needed by tomorrow EOD
- **Team**: 3 developers working in parallel
- **Your Role**: AI integration specialist (isolated AI server)
- **Development Tool**: Cursor IDE

---

## Server Architecture

### Integrated Modular Strategy
- **Single Server** (Port 3001): WebSocket, rooms, game state, validation + AI integration
- **AI Module** (backend/openai/): OpenAI integration, prompt engineering, structured responses 
- **Communication**: Direct function calls (no HTTP overhead)
- **Development Benefits**: Faster responses, simpler deployment, one process to manage

---

## Core Requirements

### 1. Single API Endpoint ✅
```
POST /api/ai/analyze
Content-Type: application/json
Body: { gameId: string, conversationHistory: Turn[] }
Response: { thinking: string[], guess: string }
```

### 2. TypeScript Schemas ✅
```typescript
// Using Zod for runtime schema validation
import { z } from 'zod';

const TurnTypeSchema = z.enum(['encoder_hint', 'ai_analysis', 'decoder_guess']);

// Encoder's hint
const EncoderTurnSchema = z.object({
  type: z.literal('encoder_hint'),
  content: z.string(),
  turnNumber: z.number().int().positive().optional()
    .describe('Optional: Sequential turn number (being phased out)')
});

// AI's analysis
const AITurnSchema = z.object({
  type: z.literal('ai_analysis'),
  thinking: z.array(z.string()).length(4),
  guess: z.string().min(3).max(12),
  turnNumber: z.number().int().positive().optional()
    .describe('Optional: Sequential turn number (being phased out)')
});

// Decoder's guess (only failed guesses appear in history)
const DecoderTurnSchema = z.object({
  type: z.literal('decoder_guess'),
  guess: z.string().min(3).max(12),
  turnNumber: z.number().int().positive().optional()
    .describe('Optional: Sequential turn number (being phased out)')
});

// Request schema with turn validation
const AnalyzeRequestSchema = z.object({
  gameId: z.string(),
  conversationHistory: z.array(z.discriminatedUnion('type', [
    EncoderTurnSchema,
    AITurnSchema,
    DecoderTurnSchema
  ]))
  .refine(
    turns => {
      // Verify turns alternate correctly: encoder -> ai -> decoder -> ai -> encoder
      return turns.every((turn, idx) => {
        if (idx === 0) return turn.type === 'encoder_hint';
        const prevType = turns[idx - 1].type;
        switch (turn.type) {
          case 'encoder_hint':
            return prevType === 'ai_analysis';
          case 'ai_analysis':
            return prevType === 'encoder_hint' || prevType === 'decoder_guess';
          case 'decoder_guess':
            return prevType === 'ai_analysis';
        }
      });
    },
    { message: "Turns must follow pattern: encoder -> ai -> decoder -> ai -> encoder" }
  )
});
```

### 3. OpenAI Integration
- **Model**: gpt-4
- **Method**: Structured outputs (function calling)
- **Context**: All conversation history as single user message
- **Response**: Guaranteed schema compliance via Zod validation

### 4. Game Flow
1. **Encoder Turn**: Sends hint
2. **AI Turn**: Analyzes and guesses
   - If correct → Game Over
   - If incorrect → Continue
3. **Decoder Turn**: Makes guess
   - If correct → Game Over
   - If incorrect → Guess added to history
4. Loop back to Encoder Turn

---

## Implementation Status

### ✅ COMPLETE
- ✅ Server setup and integration
- ✅ OpenAI client configuration
- ✅ TypeScript schemas with Zod validation
- ✅ `/api/ai/analyze` route with error handling
- ✅ Structured output schema enforcement
- ✅ Simplified turn-based structure
- ✅ OpenAI service updated to new turn types
- ✅ Removed suspicion level completely
- ✅ Made turn numbers optional (phasing out)
- ✅ Updated test file with realistic game scenarios
- ✅ Route handler handles new Turn[] format and gameId
- ✅ Removed turn sequence validation (handled by game logic)

### 🔄 IN PROGRESS
- Brooks: Integrating updated OpenAI service into game handlers
- Will: Implementing frontend data collection using new Turn structure
- Brooks: Updating main game types to use Turn[] format

### 📋 NEXT STEPS
1. Frontend team to implement data collection structure (simplified):
   ```typescript
   {
     gameId: string,
     conversationHistory: Turn[]  // Array of turns, sequence managed by game logic
   }
   ```

2. Frontend Responsibilities:
   - Word validation (3-12 chars, lowercase)
   - Track failed guesses in history
   - Follow game handler's turn sequence
   - Handle game end conditions

3. Backend Tasks (for Brooks):
   - Update game handlers to use real OpenAI service
   - Convert game state to use Turn[] format  
   - Implement turn sequence logic in game handlers
   - Update role mapping: encryptor→encoder, decryptor→decoder
   - Remove complex game state persistence

### Example Game Flow
```javascript
// Example conversation history
const mockHistory = [
  { 
    type: 'encoder_hint',
    content: 'It grows in gardens'
  },
  {
    type: 'ai_analysis',
    thinking: [
      "Message mentions garden environment.",
      "Could be a plant or vegetable.",
      "Common garden items are good candidates.",
      "Previous hints suggest edible item."
    ],
    guess: "tomato"
  },
  {
    type: 'decoder_guess',
    guess: "carrot"
  }
];
```

Note: Turn numbers are being phased out in favor of using array indices to track turn order.
A separate refactoring task will remove turn numbers from the game state management system.