# Week 6 Smuggler

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

## Mobile Development Setup

### Prerequisites
- Both devices (development machine and mobile device) on the same WiFi network
- Expo Go app installed on mobile device

### 1. Find Your Local IP Address
```bash
# On Mac/Linux
ifconfig

# On Windows
ipconfig
```

Look for your local IP (usually starts with `192.168.x.x` or `10.0.x.x`)

### 2. Configure Environment Variables
Create a `.env` file in the root directory:

```bash
# Mobile Development Configuration
EXPO_PUBLIC_BACKEND_URL=http://YOUR_IP_ADDRESS:3000
BACKEND_CORS_ORIGIN=http://YOUR_IP_ADDRESS:8081

# Server configuration
PORT=3000
NODE_ENV=development

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here
```

**Replace `YOUR_IP_ADDRESS` with your actual local IP address.**

### 3. Set Up Shared Environment Variables
The frontend needs access to the root `.env` file. Create a symlink:

```bash
cd frontend
ln -sf ../.env .env
```

This allows both frontend and backend to use the same environment variables.

### 4. Start the Servers
```bash
# Terminal 1: Start backend
npm run dev:backend

# Terminal 2: Start frontend
npm run dev:frontend
```

### 5. Connect Mobile Device
- Open Expo Go on your mobile device
- Scan the QR code from the Expo development server
- The app should connect to your backend automatically

### Troubleshooting Mobile Connection

**If connection fails:**
1. Verify both devices are on the same WiFi network
2. Check your IP address is correct in `.env`
3. Ensure backend server is running and accessible
4. Check firewall settings on your development machine
5. Restart Expo development server after changing environment variables

**Common Issues:**
- `localhost` won't work from mobile devices - must use IP address
- CORS errors indicate wrong `BACKEND_CORS_ORIGIN` configuration
- Connection timeouts suggest network/firewall issues

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
- **Room Management**: Automatic cleanup and player tracking
- **Game State Persistence**: Handles disconnections gracefully
- **Comprehensive Testing**: 231 passing tests
- **Mobile Integration**: Full support for mobile devices via IP-based connection

## Frontend

The React Native app uses Expo Router for navigation and connects to the backend via WebSocket for real-time gameplay.

## Development

- **Backend**: Node.js with Express, Socket.IO, TypeScript
- **Frontend**: React Native with Expo Router
- **Communication**: WebSocket for real-time game events, HTTP for API calls
- **Testing**: Jest with comprehensive test suite
- **Mobile**: Expo Go for mobile testing and development

## Environment Variables

### Root `.env` File (Shared)
Create a `.env` file in the root directory with all environment variables:
Create a symbolic link `.env` file in /frontend (Expo Go needs that)

```bash
# Mobile Development Configuration
EXPO_PUBLIC_BACKEND_URL=http://YOUR_IP_ADDRESS:3000
BACKEND_CORS_ORIGIN=http://YOUR_IP_ADDRESS:8081

# Server configuration
PORT=3000
NODE_ENV=development

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here
```

### Environment Variable Details
- `EXPO_PUBLIC_BACKEND_URL` - Backend server URL for mobile app (must start with `EXPO_PUBLIC_`)
- `BACKEND_CORS_ORIGIN` - CORS origin for Expo development server
- `PORT` - Backend server port (default: 3000)
- `NODE_ENV` - Environment mode (default: development)
- `OPENAI_API_KEY` - OpenAI API key for AI features

**Note**: Only variables starting with `EXPO_PUBLIC_` are included in the mobile app bundle. API keys and other sensitive data remain on the server.

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
- **Mobile Testing**: Full mobile integration with WebSocket connection validation
