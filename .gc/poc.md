# AI Server Specifications - Smuggler Game

## Project Context
- **Timeline**: 6-day bootcamp project, POC needed by tomorrow EOD
- **Team**: 3 developers working in parallel
- **Your Role**: AI integration specialist (isolated AI server)
- **Development Tool**: Cursor IDE
- **Story Theme**: Agents passing exploit codes through domestic conversation while AI eavesdrops

---

## Server Architecture

### Integrated Modular Strategy
- **Single Server** (Port 3001): WebSocket, rooms, game state, validation + AI integration
- **AI Module** (backend/openai/): OpenAI integration, prompt engineering, structured responses 
- **Communication**: Direct function calls (no HTTP overhead)
- **Merge Conflict Avoidance**: AI module exports setupOpenAiRoute() function for main server integration
- **Development Benefits**: Faster responses, simpler deployment, one process to manage
- **Standalone Option**: AI module can still run independently via `npm run dev` for testing

---

## Core Requirements

### 1. Single API Endpoint ✅
```
POST /api/ai/analyze
Content-Type: application/json
Body: { conversationHistory: Message[] }
Response: { thinking: string[], guess: string }
```

### 2. TypeScript Schemas ✅
```typescript
// Using Zod for runtime schema validation
import { z } from 'zod';

// Input schema
const MessageSchema = z.object({
  role: z.enum(['outsider', 'insider', 'ai']),
  type: z.enum(['hint', 'guess', 'thinking']),
  content: z.string(),
  timestamp: z.date().optional()
});

// Output schema  
const AIResponseSchema = z.object({
  thinking: z.array(z.string()).length(4),    // Exactly 4 sentences
  guess: z.string().max(12),                  // Max 12 chars
  suspicionLevel: z.number().min(0).max(100)  // 0-100 scale
});
```

### 3. OpenAI Integration
- **Model**: gpt-4
- **Method**: Structured outputs (function calling)
- **Context**: System prompt + conversation history as JSON
- **Response**: Guaranteed schema compliance via Zod validation

---

## Prompt Engineering Requirements

### System Prompt Elements
1. **Character**: "You are an AI system monitoring communications on a futuristic oil rig, trying to detect if agents are passing secret exploit codes"
2. **Objective**: 
   - Analyze conversation to detect the secret word/code being transmitted
   - Monitor conversation authenticity (genuine domestic chat vs coded messages)
3. **Constraints**: 
   - Output exactly 4 thinking sentences
   - Each sentence max 12 words
   - Final guess must be single word, max 12 characters
   - Suspicion level (0-100) based on conversation authenticity
4. **Context**: Two agents posing as a married couple are trying to communicate exploit codes through domestic conversation
5. **Word Domain**: Everyday, reasonable words that people could guess - not overly technical terms

### Context Management
- **Never include**: The actual secret word
- **Always include**: Full conversation history (human messages + AI previous guesses)
- **Format**: JSON array of Message objects sent as user input
- **Suspicion Tracking**: Monitor how natural vs suspicious the conversation feels

---

## Implementation Goals for POC

### Must Have (Tomorrow EOD)
- [x] Express server setup with TypeScript ✅ COMPLETE
- [x] OpenAI client configuration with API key ✅ COMPLETE
- [x] TypeScript schemas (Message, AIResponse types) ✅ COMPLETE
  - Added Zod validation
  - Implemented suspicion level tracking
  - Updated role terminology (insider/outsider)
- [x] `/api/ai/analyze` route with proper error handling ✅ COMPLETE
- [x] Structured output schema enforcement ✅ COMPLETE
- [x] System prompt that produces consistent results ✅ COMPLETE
  - AI monitoring oil rig communications
  - Tracking conversation authenticity
  - Word domain defined
- [ ] Postman-testable endpoint with mock data
- [ ] Turn-based context structure implementation (planned but not yet executed)

### Nice to Have (Post-POC)
- [x] Request validation middleware ✅ COMPLETE (via Zod schemas)
- [ ] Rate limiting for OpenAI calls
- [ ] Logging for debugging
- [x] Health check endpoint ✅ COMPLETE
- [x] CORS configuration for frontend integration ✅ COMPLETE

---

## Current Status & Next Steps

### ✅ COMPLETE - POC is 90% Ready
- **Server Integration**: AI module successfully integrated into main server
- **OpenAI Service**: Full implementation with GPT-4, function calling, error handling
- **API Endpoint**: `/api/ai/analyze` accepts requests and returns structured responses
- **Schema Validation**: Zod schemas enforce input/output compliance
- **Immersive Prompt**: Detailed 2070 AI monitoring scenario with suspicion levels
- **Dependencies**: Both backend environments properly configured

### 🔄 REMAINING FOR MVP
1. **Testing**: Validate endpoint with Postman using mock conversation data
2. **Turn-based Context**: Implement `ContextAddition` schema for better conversation tracking (optional for POC)

### 📋 Immediate Action Items
- [ ] Test `/api/ai/analyze` endpoint with mock data
- [ ] Validate response format matches expectations
- [ ] Document any issues or prompt refinements needed

---

## Testing Strategy

### Mock Data for Development
```javascript
// Test conversation history
const mockConversation = [
  { role: 'outsider', type: 'hint', content: 'I love this red fruit' },
  { role: 'ai', type: 'guess', content: 'strawberry' },
  { role: 'insider', type: 'hint', content: 'Is it round and crunchy?' },
  { role: 'ai', type: 'guess', content: 'apple' }
];
```

### Validation Tests
- Response always contains exactly 4 thinking sentences
- Guess is always a single word under 12 characters
- API handles malformed conversation history gracefully
- Error responses for OpenAI API failures

---

## Constraints & Limitations

### Technical Constraints
- **Latency**: Single API call only (no chaining)
- **Reliability**: Must handle OpenAI rate limits and errors
- **Format**: Structured outputs mandatory (no prompt engineering fallbacks)

### Development Constraints
- **Timeline**: 1 day for working POC
- **Integration**: Must work with teammate's game server via simple HTTP calls
- **Testing**: Postman testing sufficient for POC
- **Dependencies**: Minimal external libraries

### Game Constraints
- **Secret Security**: AI never sees the actual secret word
- **Context Accumulation**: Include all previous AI thinking in future calls
- **Response Format**: Must support fake streaming on frontend (array of sentences)

---

## File Structure
```
backend/
├── openai/                # AI module integrated into main server
│   ├── index.ts           # setupOpenAiRoute() export + standalone server option
│   ├── routes/
│   │   └── ai.ts          # /api/ai/analyze route
│   ├── services/
│   │   └── openai.ts      # OpenAI client and prompt logic
│   ├── types/
│   │   └── game.ts        # Message and AIResponse schemas
│   ├── package.json
│   └── tsconfig.json
├── src/
│   └── server.ts          # Main game server (Port 3001) + AI integration
```

---

## Success Criteria for POC

1. **API Responds**: POST to `/api/ai/analyze` returns valid structured response
2. **Schema Compliance**: Response always matches AIResponse type
3. **Context Handling**: Handles conversation history of varying lengths
4. **Error Resilience**: Graceful error responses for API failures
5. **Integration Ready**: Game server can make simple HTTP calls to get AI responses

---

## Integration Handoff

### For Teammate's Game Server Integration
```javascript
// AI integration is now handled automatically via setupOpenAiRoute()
// Game logic can make direct calls to AI endpoints:
const getAIResponse = async (conversationHistory) => {
  const response = await fetch('http://localhost:3001/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationHistory })
  });
  return response.json(); // { thinking: string[], guess: string, suspicionLevel: number }
};
```

### Environment Setup
- Single integrated server runs on port 3001 
- Requires OPENAI_API_KEY in root .env (already configured)
- AI module integrated via setupOpenAiRoute() function
- AI development remains isolated in backend/openai/ folder

---

## Notes for Cursor Development

### Suggested Development Order
1. Basic Express server with TypeScript setup
2. OpenAI client configuration and test connection
3. Draft system prompt and test with static data
4. Implement structured output schema
5. Build /api/ai/analyze route with error handling
6. Test with Postman using mock conversation histories
7. Refine prompt based on test results

### Key Files to Focus On
- `/services/openai.ts` - Core AI logic
- `/routes/ai.ts` - API endpoint
- `/types/game.ts` - Type safety
- `.env` - API key configuration