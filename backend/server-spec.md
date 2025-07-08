# Smuggler Backend Server Specification

## Overview

The Smuggler backend is a Node.js/TypeScript server that provides real-time multiplayer game functionality for the Smuggler word-guessing game. It combines REST API endpoints with WebSocket connections using Socket.IO for real-time communication.

## Architecture

### Technology Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Real-time**: Socket.IO for WebSocket connections
- **Validation**: Zod for schema validation
- **Testing**: Jest with Supertest
- **Development**: Nodemon for hot reloading

### Project Structure
```
backend/
├── src/                    # Main application source
│   ├── server.ts          # Main server entry point
│   ├── routes/            # REST API route handlers
│   │   ├── ai.ts         # AI service endpoints
│   │   └── rooms.ts      # Room management endpoints
│   ├── socket/            # WebSocket handlers
│   │   └── handlers/
│   │       ├── gameHandlers.ts    # Game logic handlers
│   │       ├── lobbyHandlers.ts   # Lobby management
│   │       └── roomHandlers.ts    # Room operations
│   ├── game/              # Core game logic
│   │   ├── index.ts       # Game module exports
│   │   ├── logic.ts       # Game flow logic
│   │   ├── state.ts       # Game state management
│   │   └── wordManager.ts # Word selection and management
│   ├── rooms/             # Room management
│   │   └── manager.ts     # Room lifecycle management
│   ├── ai/                # AI service integration
│   │   └── mock.ts        # Mock AI service (temporary)
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts       # Shared types and interfaces
│   └── utils/             # Utility functions
│       └── helpers.ts     # Common helper functions
├── openai/                # OpenAI integration module
│   ├── index.ts           # OpenAI setup and integration
│   ├── routes/            # OpenAI-specific routes
│   ├── services/          # OpenAI service implementations
│   └── types/             # OpenAI-specific types
├── data/                  # Static data files
│   └── words.json         # Word list for games
├── tests/                 # Test suite
└── dist/                  # Compiled JavaScript output
```

## Server Configuration

### Environment Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)
- `OPENAI_API_KEY`: OpenAI API key for AI functionality

### CORS Configuration
- **Origin**: `http://localhost:8081` (Expo development server)
- **Credentials**: Enabled
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Content-Type, Authorization

## REST API Endpoints

### Base Routes
- `GET /` - Server status
- `GET /api/health` - Health check with uptime and environment info

### Room Management (`/api/rooms`)
- `POST /` - Create a new room and auto-join creator
  - **Request**: Empty body
  - **Response**: `{ success: boolean, roomId: string, playerId: string, message?: string }`

### AI Service (`/api/ai`)
- `POST /analyze` - Analyze conversation and generate AI response
  - **Request**: `{ conversationHistory: Turn[], gameId: string }`
  - **Response**: `{ success: boolean, data: AIResponse }`
- `POST /thinking` - Generate thinking process
  - **Request**: `{ conversationHistory: Turn[], gameContext: object }`
  - **Response**: `{ success: boolean, data: { thinking: string[] } }`
- `POST /guess` - Generate AI guess
  - **Request**: `{ conversationHistory: Turn[], availableWords: string[], gameContext: object }`
  - **Response**: `{ success: boolean, data: string }`
- `GET /health` - AI service health check

## WebSocket Events

### Connection Management
- `connection` - Client connects
- `disconnect` - Client disconnects
- `ping`/`pong` - Connection testing

### Lobby Events
- `enter_lobby` - Join the global lobby
- `leave_lobby` - Leave the global lobby

### Room Management
- `join_room` - Join a specific room
  - **Data**: `{ roomId: string, playerId: string }`
- `player_ready` - Mark player as ready
  - **Data**: `{ roomId: string, playerId: string, ready: boolean }`
- `list_rooms` - Get available rooms list
- `check_room_availability` - Check if room exists and has space
  - **Data**: `{ roomId: string }`

### Game Events
- `start_game` - Start a new game in a room
  - **Data**: `{ roomId: string }`
- `send_message` - Send a message in the game
  - **Data**: `{ roomId: string, content: string, senderId: string }`
- `player_guess` - Submit a word guess
  - **Data**: `{ roomId: string, guess: string, playerId: string }`

## Data Models

### Player
```typescript
interface Player {
  id: string;           // Unique player identifier
  name: string;         // Display name
  ready: boolean;       // Ready status
  role: 'encryptor' | 'decryptor' | null;  // Game role
  socketId: string;     // Socket.IO connection ID
}
```

### Room
```typescript
interface Room {
  id: string;           // Unique room identifier
  players: Player[];    // Players in the room
  gameState: GameState | null;  // Current game state
  createdAt: Date;      // Room creation timestamp
  lastActivity: Date;   // Last activity timestamp
}
```

### Game State
```typescript
interface GameState {
  score: number;        // Current game score
  currentRound: number; // Current round number
  secretWord: string;   // Word to be guessed
  conversationHistory: Turn[];  // Game conversation
  currentTurn: 'encryptor' | 'ai' | 'decryptor';  // Whose turn
  gameStatus: 'waiting' | 'active' | 'ended';     // Game status
}
```

### Turn Types (from OpenAI module)
```typescript
type Turn = OutsiderTurn | AITurn | InsiderTurn;

interface OutsiderTurn {
  type: 'outsider_hint';
  content: string;
  turnNumber?: number;
}

interface AITurn {
  type: 'ai_analysis';
  thinking: string[];  // Exactly 4 sentences
  guess: string;       // 3-12 characters (enforced for AI responses)
  turnNumber?: number;
}

interface InsiderTurn {
  type: 'insider_guess';
  guess: string;       // No length limit (players can guess any length)
  turnNumber?: number;
}
```

## Core Components

### Room Manager (`src/rooms/manager.ts`)
- **Purpose**: Manages room lifecycle and player management
- **Key Methods**:
  - `createRoomWithPlayer()` - Create room with initial player
  - `joinRoom()` - Add player to existing room
  - `removePlayer()` - Remove player from room
  - `getRooms()` - Get list of available rooms
  - `cleanupInactiveRooms()` - Remove inactive rooms

### Game Logic (`src/game/`)
- **logic.ts**: Core game flow and turn management
- **state.ts**: Game state persistence and updates
- **wordManager.ts**: Word selection and management

### Socket Handlers
- **gameHandlers.ts**: Game-specific WebSocket events
- **lobbyHandlers.ts**: Lobby management and broadcasting
- **roomHandlers.ts**: Room joining/leaving operations

### AI Integration
- **Mock Service**: Temporary mock implementation in `src/ai/mock.ts`
- **OpenAI Module**: Integration with OpenAI API (separate module)
- **Turn-based Analysis**: Structured conversation analysis using Turn types

## Game Flow

1. **Room Creation**: Player creates room via REST API
2. **Room Joining**: Players join via WebSocket
3. **Player Ready**: Players mark themselves ready
4. **Game Start**: When all players ready, game begins
5. **Role Assignment**: Players assigned encryptor/decryptor roles
6. **Word Selection**: Secret word chosen from word list
7. **Turn-based Play**: Alternating turns between encryptor, AI, decryptor
8. **Game End**: When decryptor guesses correctly or round limit reached

## Error Handling

### HTTP Error Responses
- **400**: Bad Request (validation errors)
- **404**: Not Found (invalid endpoints)
- **500**: Internal Server Error (server errors)

### WebSocket Error Handling
- Validation errors sent to client
- Graceful disconnection handling
- Room cleanup on player disconnect

## Testing

### Test Structure
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **Socket Tests**: WebSocket event testing
- **Game Logic Tests**: Game flow validation

### Test Commands
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode

## Development

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server

### Development Features
- Hot reloading with Nodemon
- TypeScript compilation
- Source maps for debugging
- Comprehensive logging

## Production Considerations

### Security
- CORS configuration for specific origins
- Input validation with Zod schemas
- Error message sanitization in production

### Performance
- Room cleanup for inactive sessions
- Efficient WebSocket broadcasting
- Memory management for game state

### Monitoring
- Health check endpoints
- Uptime tracking
- Error logging and monitoring

## Integration Points

### Frontend Integration
- REST API for room creation
- WebSocket for real-time game updates
- CORS configured for Expo development server

### AI Service Integration
- Modular OpenAI integration
- Mock service for development
- Structured conversation analysis
- Health monitoring

### External Dependencies
- Socket.IO for real-time communication
- Express.js for REST API
- Zod for validation
- UUID for unique identifiers
