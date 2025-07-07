# AI API Documentation

This document describes the AI API endpoints that need to be implemented to replace the mock AI service.

## Base URL
All AI endpoints are prefixed with `/api/ai`

## Response Structure

The AI service returns responses in this format:

```typescript
type AIResponse = {
  thinking: string[]; // Exactly 4 sentences, max 12 words each
  guess: string;      // Single word, max 12 characters
}
```

## Endpoints

### POST /api/ai/analyze
Analyzes a conversation and generates a complete AI response including thinking process and guess.

**Request Body:**
```json
{
  "conversationHistory": [
    {
      "id": "string",
      "content": "string",
      "senderId": "string",
      "timestamp": "Date"
    }
  ],
  "secretWord": "string",
  "gameContext": {
    "currentRound": "number",
    "score": "number",
    "gameStatus": "waiting" | "active" | "ended",
    "previousGuesses": ["string"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "thinking": ["string", "string", "string", "string"],
    "guess": "string"
  }
}
```

### POST /api/ai/thinking
Generates a thinking process for AI analysis.

**Request Body:**
```json
{
  "conversationHistory": [
    {
      "id": "string",
      "content": "string",
      "senderId": "string",
      "timestamp": "Date"
    }
  ],
  "gameContext": {
    "currentRound": "number",
    "score": "number",
    "gameStatus": "waiting" | "active" | "ended"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "thinking": ["string", "string", "string", "string"]
  }
}
```

### POST /api/ai/guess
Generates an AI guess based on conversation content.

**Request Body:**
```json
{
  "conversationHistory": [
    {
      "id": "string",
      "content": "string",
      "senderId": "string",
      "timestamp": "Date"
    }
  ],
  "availableWords": ["string"],
  "gameContext": {
    "currentRound": "number",
    "score": "number",
    "gameStatus": "waiting" | "active" | "ended"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": "string" // The guessed word (max 12 characters)
}
```

### GET /api/ai/health
Returns the health status of the AI service.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy" | "degraded" | "unhealthy",
    "uptime": "number",
    "version": "string",
    "features": ["string"]
  }
}
```

## Error Responses

All endpoints return error responses in this format:

```json
{
  "success": false,
  "error": "string"
}
```

Common HTTP status codes:
- `400` - Bad Request (missing or invalid parameters)
- `500` - Internal Server Error

## Implementation Requirements

1. **Thinking Process**: Must be exactly 4 sentences, each with maximum 12 words
2. **Guess**: Must be a single word with maximum 12 characters
3. **Available Words**: The guess must be one of the words from the `availableWords` array
4. **Game Context**: Use this to adjust AI behavior based on game state

## Current Mock Implementation

The current mock implementation is in `src/ai/mock.ts` and can be used as a reference for the expected behavior. The mock service:

- Generates exactly 4 thinking sentences (max 12 words each)
- Ensures guesses are max 12 characters
- Implements semantic analysis (basic word associations)
- Provides fallback responses when errors occur
- Includes timing simulation for realistic AI behavior

## Integration Points

The AI service is integrated into the game flow in `src/socket/handlers/gameHandlers.ts`. The main integration point is the `handleAIResponse` method which:

1. Creates game context from current game state
2. Calls the AI service to analyze the conversation
3. Updates the game state with AI response
4. Broadcasts the response to all players in the room
5. Includes fallback handling for AI service failures

## Example Thinking Process

The thinking process should be 4 sentences that show the AI's analysis:

```json
{
  "thinking": [
    "Analyzing conversation patterns for clues.",
    "Looking for word associations and themes.",
    "Evaluating communication strategies used.",
    "Processing semantic connections in context."
  ]
}
``` 