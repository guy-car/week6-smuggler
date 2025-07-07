# AI Server Specifications - Smuggler Game

## Project Context
- **Timeline**: 6-day bootcamp project, POC needed by tomorrow EOD
- **Team**: 3 developers working in parallel
- **Your Role**: AI integration specialist (isolated AI server)
- **Development Tool**: Cursor IDE

---

## Server Architecture

### Separation Strategy
- **Game Server** (Port 3001): WebSocket, rooms, game state, validation
- **AI Server** (Port 3002): OpenAI integration, prompt engineering, structured responses
- **Communication**: Game server makes HTTP calls to AI server

---

## Core Requirements

### 1. Single API Endpoint
```
POST /api/ai/analyze
Content-Type: application/json
Body: { conversationHistory: Message[] }
Response: { thinking: string[], guess: string }
```

### 2. TypeScript Schemas
```typescript
// Input schema
type Message = {
  role: 'encryptor' | 'decryptor' | 'ai';
  type: 'hint' | 'guess' | 'thinking';
  content: string;
  timestamp?: Date;
}

// Output schema  
type AIResponse = {
  thinking: string[]; // Exactly 4 sentences, max 12 words each
  guess: string;      // Single word, max 12 characters
}
```

### 3. OpenAI Integration
- **Model**: gpt-4o
- **Method**: Structured outputs (function calling)
- **Context**: System prompt + conversation history as JSON
- **Response**: Guaranteed schema compliance

---

## Prompt Engineering Requirements

### System Prompt Elements
1. **Character**: "You are an AI eavesdropping on secret communications"
2. **Objective**: Analyze conversation to guess the secret word
3. **Constraints**: 
   - Output exactly 4 thinking sentences
   - Each sentence max 12 words
   - Final guess must be single word, max 12 characters
4. **Context**: Players are trying to communicate a secret word without you detecting it

### Context Management
- **Never include**: The actual secret word
- **Always include**: Full conversation history (human messages + AI previous guesses)
- **Format**: JSON array of Message objects sent as user input

---

## Implementation Goals for POC

### Must Have (Tomorrow EOD)
- [x] Express server setup with TypeScript
- [x] OpenAI client configuration with API key
- [x] `/api/ai/analyze` route with proper error handling
- [x] Structured output schema enforcement
- [x] System prompt that produces consistent results
- [x] Postman-testable endpoint with mock data

### Nice to Have (Post-POC)
- [ ] Request validation middleware
- [ ] Rate limiting for OpenAI calls
- [ ] Logging for debugging
- [ ] Health check endpoint
- [ ] CORS configuration for frontend integration

---

## Testing Strategy

### Mock Data for Development
```javascript
// Test conversation history
const mockConversation = [
  { role: 'encryptor', type: 'hint', content: 'I love this red fruit' },
  { role: 'ai', type: 'guess', content: 'strawberry' },
  { role: 'decryptor', type: 'hint', content: 'Is it round and crunchy?' },
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
├── openAI/
│   ├── index.ts           # Express server setup
│   ├── routes/
│   │   └── ai.ts          # /api/ai/analyze route
│   ├── services/
│   │   └── openai.ts      # OpenAI client and prompt logic
│   ├── types/
│   │   └── game.ts        # Message and AIResponse schemas
│   └── utils/
│       └── validation.ts  # Request validation helpers
├── .env                   # OPENAI_API_KEY
├── package.json
└── tsconfig.json
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

### For Teammate's Game Server
```javascript
// Simple integration - just one HTTP call needed
const getAIResponse = async (conversationHistory) => {
  const response = await fetch('http://localhost:3002/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationHistory })
  });
  return response.json(); // { thinking: string[], guess: string }
};
```

### Environment Setup
- AI server runs on port 3002
- Requires OPENAI_API_KEY in .env
- No other dependencies on game server

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