# Week 6 Smuggler

test

A full-stack React Native app with Express/Socket.IO backend - a real-time 2-player game where players attempt to pass secret messages while an AI eavesdropper tries to decode them.

## Project Structure

```
week6-smuggler/
├── frontend/          # React Native/Expo app
│   ├── app/          # Expo Router pages
│   ├── components/   # React components
│   ├── assets/       # Images, fonts, etc.
│   └── package.json  # Frontend dependencies
├── backend/          # Express.js + Socket.IO server
│   ├── src/          # TypeScript source code
│   ├── data/         # Game data (words.json)
│   ├── tests/        # Test suite (231 tests)
│   └── package.json  # Backend dependencies
└── package.json      # Root scripts
```

## Quick Start

### Install All Dependencies
```bash
npm run install:all
```

### Run Both Frontend and Backend
```bash
npm run dev
```

This will start:
- Backend Socket.IO server on http://localhost:3000
- Frontend Expo development server

### Run Separately

**Backend only:**
```bash
npm run dev:backend
```

**Frontend only:**
```bash
npm run dev:frontend
```

## Backend API

The Express/Socket.IO server provides:

### HTTP Endpoints
- `GET /` - API status
- `GET /api/health` - Health check with uptime info
- `GET /api/ai/health` - AI service health status
- `POST /api/ai/response` - Generate AI response (mock)

### WebSocket Events
- `join_room` - Join or create a game room
- `player_ready` - Mark player as ready
- `start_game` - Begin game when both players ready
- `send_message` - Encryptor sends message
- `ai_response` - AI thinking process and guess
- `player_guess` - Decryptor attempts to guess
- `guess_result` - Guess validation result
- `round_end` - Round completion and score update
- `game_end` - Game completion

## Game Features

### Core Gameplay
- **2-Player Rooms**: Join with room codes
- **Role Assignment**: Encryptor/Decryptor roles that switch each round
- **Secret Words**: 37 curated words for smuggling
- **AI Eavesdropper**: Mock AI that analyzes conversations and makes guesses
- **Tug-of-War Scoring**: Score starts at 5, +1 for players, -1 for AI
- **Win Conditions**: Score 10 (players win) or 0 (AI wins)

### Technical Features
- **Real-time Communication**: WebSocket-based with Socket.IO
- **Fuzzy Matching**: Levenshtein distance for guess validation
- `player_guess` - Decryptor attempts to guess
- **Room Management**: Automatic cleanup and player tracking
- **Game State Persistence**: Handles disconnections gracefully
- **Comprehensive Testing**: 231 passing tests

## Frontend

The React Native app uses Expo Router for navigation and connects to the backend via WebSocket for real-time gameplay.

## Development

- **Backend**: Node.js with Express, Socket.IO, TypeScript
- **Frontend**: React Native with Expo Router
- **Communication**: WebSocket for real-time game events, HTTP for API calls
- **Testing**: Jest with comprehensive test suite

## Environment Variables

Create `.env` files in both `frontend/` and `backend/` directories as needed.

### Backend Environment Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (default: development)
- `MAX_LEVENSHTEIN_DISTANCE` - Fuzzy matching threshold (default: 2)

## Scripts

- `npm run dev` - Run both frontend and backend in development mode
- `npm run install:all` - Install dependencies for all parts of the project
- `npm run dev:backend` - Run only the backend server
- `npm run dev:frontend` - Run only the frontend app
- `npm run test:backend` - Run backend tests
- `npm run build:backend` - Build backend for production

## Testing Status

- **Backend Tests**: 231 passing tests
- **Coverage**: Comprehensive coverage of all core functionality
- **Test Categories**: Socket.IO events, room management, game logic, AI integration, word management, error handling, integration, performance
