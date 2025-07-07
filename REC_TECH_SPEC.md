# Smuggler Game - React Native Technical Specification

## Overview
This document outlines the technical implementation for the Smuggler game as a React Native mobile application, focusing on real-time communication, AI integration, and smooth user experience.

---

## Architecture Overview

### 1. Frontend (React Native)
- **Framework**: React Native with Expo for rapid development
- **State Management**: Zustand for global state
- **Navigation**: React Navigation for screen management
- **Real-time Communication**: Socket.io-client for WebSocket connections
- **UI Components**: Custom components with React Native Animated API

### 2. Backend (Node.js/Express)
- **WebSocket Server**: Socket.io for real-time bidirectional communication
- **Room Management**: In-memory room state (scalable to Redis)
- **Game State**: Server-side game logic and state management
- **AI Integration**: OpenAI API with structured streaming responses

### 3. Real-time Features
- **WebSocket Events**:
  - `join_room`: Player joins room, updates presence
  - `player_ready`: Both players ready to start
  - `start_game`: Game begins when both players ready
  - `send_message`: Encryptor sends message
  - `ai_response`: AI thinking process and final guess (streaming)
  - `player_guess`: Decryptor attempts guess
  - `guess_result`: Server validates guess against secret word
  - `round_end`: Round results and score update (+1/-1)
  - `game_end`: Final game result

---

## Technical Implementation Details

### 1. React Native App Structure (MVP)
The app follows a standard React Native structure with components, screens, services, store, types, and utilities. Key files include envelope components, AI chat bubble, player chat bubble, score display, lobby and game screens, WebSocket service, AI service, Zustand store, and type definitions.

### 2. Key Components

#### Envelope Component (MVP)
- **Basic Animation**: Simple open/close with React Native Animated
- **Props**: message content, sender
- **States**: closed, open

#### AI Chat Bubble (MVP)
- **Structured Streaming**: Real-time display of AI thinking process followed by final guess
- **Single API Response**: One streaming call returns both thinking and guess
- **Basic Animation**: Simple fade-in for AI responses
- **States**: thinking, guessing, complete
- **Features**: Shows AI reasoning process, then reveals final guess

#### Score Display (MVP)
- **Visual**: Simple number display (0-10)
- **Basic Animation**: Number change animation
- **Indicators**: Win/loss text

### 3. Real-time Communication

#### WebSocket Connection
The WebSocket service manages real-time communication between players and the server. It handles room joining, player ready status, game start, message sending, AI responses, player guesses, guess validation results, and round end events. The service maintains connection state and provides methods for sending player actions.

#### AI Integration with Structured Streaming
The AI service makes a single API call to `/api/ai/response` that streams structured JSON responses. The response includes both the AI's thinking process (multiple thinking steps) and the final guess. The service parses the streaming response to distinguish between thinking steps and the final guess, updating the UI in real-time as the AI thinks.

### 4. State Management (MVP)

#### Game State (Zustand)
The game store manages all game state including score, current round, player role, conversation history, AI guesses, game status, and target word. It provides actions for updating score, adding messages, adding AI guesses, setting player role, and updating game status.

### 4.1 Structured AI Streaming Benefits

**Why Single API Call with Structured Streaming for Smuggler:**

1. **Authentic Eavesdropping**: Players see AI's thinking process first, then the final guess - like real eavesdropping
2. **Suspense Building**: Streaming thinking creates tension before revealing the guess
3. **Better UX**: Clear separation between AI's reasoning and final decision
4. **Strategic Depth**: Players can see AI's confidence build up during thinking phase
5. **Simplified Architecture**: Single API call reduces complexity and latency
6. **Game Flow**: Thinking phase → AI guess → Player response → Repeat

**Example Structured Response:**
The AI response includes thinking steps with reasoning text, confidence levels, alternative guesses, and reasoning arrays. The final guess includes the actual guess and final confidence level. The streaming response sends multiple thinking steps followed by one final guess object.

### 4.2 Guess Validation System

**Server-Side Validation:**
The server validates guesses against the secret word using case-insensitive comparison, whitespace trimming, punctuation removal, and fuzzy matching with Levenshtein distance at a 30% threshold. The validation returns the guess, secret word, correctness, winner, and match type.

**Validation Rules:**
1. **Case Insensitive**: "Apple" matches "apple"
2. **Trim Whitespace**: " apple " matches "apple"
3. **Ignore Punctuation**: "apple!" matches "apple"
4. **Fuzzy Matching**: Levenshtein distance with 30% threshold
   - "appel" matches "apple" (1 character difference)
   - "bananna" matches "banana" (1 character difference)
   - "oragne" matches "orange" (1 character difference)
5. **Match Priority**: Exact match first, then fuzzy match

**Game Flow with Validation:**
1. Both players join room and click "Ready"
2. "Start Game" button appears when both players ready
3. Game begins, Encryptor selects secret word
4. Encryptor sends message
5. AI streams thinking process and makes final guess via single API call
6. Server validates AI guess against secret word
7. Server sends `guess_result` event with validation result
8. If AI correct: AI wins round, score decreases by 1, reveal secret word
9. If AI incorrect: Decryptor can attempt guess (30s time limit)
10. Decryptor guess → Server validates → `guess_result` event
11. If Decryptor correct: Players win round, score increases by 1
12. If Decryptor incorrect: Continue with new message from Encryptor
13. Game ends when score reaches 10 (players win) or 0 (AI wins)

**Security Considerations:**
- Secret word stored only on server
- Validation happens server-side only
- No client-side access to correct answer
- Rate limiting on guess attempts
- Fuzzy matching threshold configurable (30% default)

### 5. Animations (MVP)

#### Basic Envelope Animation
The envelope component uses React Native Animated API to create a simple open/close animation. It takes message content, open state, press handler, and optional styling as props. The animation uses opacity transitions with a 300ms duration and native driver for performance.

### 6. Mobile-Specific Considerations (MVP)

#### Performance
- **FlatList**: For conversation history (essential for MVP)
- **Basic Memory Management**: Cleanup WebSocket connections

#### Offline Handling
- **Basic Reconnection**: Simple reconnection logic
- **Connection Status**: Show when disconnected

#### Platform Differences
- **Cross-platform**: Shared components (no platform-specific code for MVP)

---

## Development Stack

### Frontend (MVP)
- **React Native**: 0.72+
- **Expo**: SDK 49+
- **TypeScript**: 5.0+
- **Navigation**: React Navigation 6
- **State Management**: Zustand
- **WebSockets**: Socket.io-client
- **Animations**: React Native Animated API (basic)
- **UI Components**: React Native core components

### State Management for MVP
**Recommendation: Zustand**
- Minimal boilerplate for faster development
- Simple state updates for game actions
- No providers needed - easier setup
- Sufficient for MVP game state needs

### Backend
- **Node.js**: 18+
- **Express**: 4.18+
- **TypeScript**: 5.0+
- **Socket.io**: 4.7+
- **OpenAI API**: GPT-4 for AI responses
- **CORS**: Configured for mobile app connections

### Development Tools (MVP)
- **Expo CLI**: For development and building
- **Metro**: React Native bundler
- **TypeScript Compiler**: Type checking and IntelliSense
- **Basic Debugging**: React Native debugger

---

## Deployment Strategy

### Frontend (React Native)
- **Expo Build**: Cloud builds for iOS and Android
- **App Store**: iOS App Store and Google Play Store
- **OTA Updates**: Expo's over-the-air updates for quick fixes

### Backend
- **Railway/Render**: Hosting with WebSocket support
- **Environment Variables**: API keys and configuration
- **SSL**: Required for production WebSocket connections

---

## Technical Debt to Accept (MVP)

- In-memory room storage (lost on server restart)
- No user accounts or persistent profiles
- Basic error handling and reconnection logic
- Simple word list management
- No anti-cheating measures
- Basic UI (no complex animations)
- No offline functionality
- No push notifications
- Basic TypeScript types (no strict mode initially)

---

## Resolved Questions & Implementation Details

### 1. Word List & Content ✅
- **Source**: JSON file on server with 1000 generated words
- **Format**: Single words only (hyphens count as one word)
- **Length**: Any word length allowed
- **Filtering**: No content filtering for MVP
- **Storage**: `words.json` file in backend assets

### 2. Game Rules & Flow ✅
- **Time Limits**: 30 seconds per guess
- **Message Counting**: Track message count (no max limit)
- **Exit Conditions**: Players can exit game, round continues
- **Turn Order**: AI always guesses first, no ties possible
- **Score System**: Score changes by +1 (players win) or -1 (AI wins) each round
- **Game End**: First to reach score of 10 wins, or first to reach 0 loses

### 3. AI Integration Details 🔄
- **Model**: GPT-4 for better reasoning capabilities
- **Prompt Engineering**: TBD - need structured prompts for:
  - Thinking phase: "You are eavesdropping on a conversation..."
  - Guessing phase: "Based on the conversation, guess the secret word..."
- **Error Handling**: Fallback to simple response if API fails
- **Rate Limiting**: Implement exponential backoff for API calls

### 4. Room Management ✅
- **Room Lifecycle**: Active while players present
- **Disconnection**: Game continues (no pause for MVP)
- **Reconnection**: Players can rejoin same room via room code
- **Capacity**: Max 2 players per room
- **Room Codes**: 6-character alphanumeric codes
- **Start Game**: "Start Game" button appears when both players click "Ready"

### 5. UI/UX Specifics ✅
- **Message Limits**: No character limit
- **Guess Input**: Text input field
- **AI Thinking**: Cut scene with animated thinking bubble + streaming text
- **Error Handling**: Graceful error messages with retry options

### 6. Backend Infrastructure 🔄
- **Environment**: TBD - recommend Railway for WebSocket support
- **API Keys**: .env file with OpenAI API key
- **Logging**: Basic events (room creation, game start/end, errors)
- **Scaling**: Target 100 concurrent games

### 7. Testing Strategy ✅
- **Unit Tests**: All logic tested, co-located with components
- **Integration Tests**: Recommend Jest + Socket.io testing
- **AI Testing**: Accept API costs for testing
- **Mobile Testing**: Expo development builds for both platforms

### 8. Deployment & DevOps 🔄
- **Frontend**: React Native with Expo (confirmed)
- **Backend**: Recommend Railway (WebSocket support, easy deployment)
- **SSL**: Railway provides automatic SSL certificates
- **Monitoring**: TBD - recommend basic error tracking

### 9. Security & Privacy 🔄
- **Input Sanitization**: TBD - recommend DOMPurify equivalent
- **Rate Limiting**: TBD - recommend 10 guesses per minute per player
- **Data Privacy**: TBD - recommend no persistent storage for MVP

### 10. Analytics & Monitoring 🔄
- **Game Metrics**: TBD - recommend basic win/loss tracking
- **Error Tracking**: TBD - recommend Sentry for error monitoring
- **AI Performance**: TBD - track AI guess accuracy

---

## Recommendations for TBD Items

### Backend Hosting (6A, 8A)
**Recommendation: Railway**
- Built-in WebSocket support
- Automatic SSL certificates
- Easy deployment from GitHub
- Free tier available
- TypeScript support

### SSL Certificates (8C)
**Recommendation: Automatic via Railway**
- Railway provides automatic SSL
- No manual certificate management needed
- HTTPS required for production WebSockets

### Testing Integration (7B)
**Recommendation: Jest + Socket.io Testing**
The testing strategy should include unit tests for game logic validation, WebSocket event handling, room joining, message sending, and guess validation. Tests should be co-located with components and use Jest for unit testing and Socket.io testing for integration tests.

### Security Measures (9A, 9B)
**Recommendation: Basic Implementation**
- Input sanitization: Remove HTML tags from messages
- Rate limiting: 10 guesses per minute per player
- No persistent data storage for MVP

### Monitoring (8D, 10A, 10B, 10C)
**Recommendation: Basic Setup**
- Error tracking: Sentry (free tier)
- Game metrics: Simple logging to console
- AI performance: Track guess accuracy in logs

---

## Updated MVP Features Priority

1. **Core Game Loop**: Message → AI Thinking & Guess (single API) → Player Guess (30s) → Score (+1/-1)
2. **Real-time Communication**: WebSocket connection with room management
3. **AI Integration**: Single API call with structured streaming (thinking + guess)
4. **Basic UI**: Envelope animations + AI thinking cut scene + Start Game button
5. **Word Management**: 1000-word JSON file with fuzzy matching
6. **Testing**: Unit tests for all game logic
7. **Deployment**: Railway backend + Expo frontend

This React Native architecture prioritizes mobile-first design while maintaining the real-time requirements needed for the eavesdropping gameplay mechanic. 