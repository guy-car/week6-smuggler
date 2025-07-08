import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupOpenAiRoute } from '../openai';
import { RoomManager } from './rooms/manager';
import aiRoutes from './routes/ai';
import roomsRoutes from './routes/rooms';
import { GameHandlers } from './socket/handlers/gameHandlers';
import { LobbyHandlers } from './socket/handlers/lobbyHandlers';
import { RoomHandlers } from './socket/handlers/roomHandlers';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env['PORT'] || 3000;

// Initialize room management
const roomManager = new RoomManager();
const roomHandlers = new RoomHandlers(roomManager);
const lobbyHandlers = new LobbyHandlers(roomManager);

// Set up room change callback for lobby broadcasting
roomManager.setRoomChangeCallback(() => {
    lobbyHandlers.broadcastRoomList(io);
});

// CORS configuration for Expo client
const corsOptions = {
    origin: 'http://localhost:8081',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Setup OpenAI routes (integrated from openai module)
setupOpenAiRoute(app);

// Mount rooms routes
app.use('/api/rooms', roomsRoutes);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Error:', err.message);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env['NODE_ENV'] === 'development' ? err.message : 'Something went wrong'
    });
});

// Basic route
app.get('/', (_req: express.Request, res: express.Response) => {
    res.json({ message: 'Smuggler Backend API is running!' });
});

// Health check route
app.get('/api/health', (_req: express.Request, res: express.Response) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env['NODE_ENV'] || 'development'
    });
});

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: "http://localhost:8081",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Initialize game handlers with Socket.IO instance
const gameHandlers = new GameHandlers(roomManager, io);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Lobby events
    socket.on('enter_lobby', () => lobbyHandlers.handleEnterLobby(socket));
    socket.on('leave_lobby', () => lobbyHandlers.handleLeaveLobby(socket));

    // Room management events
    socket.on('join_room', (data) => roomHandlers.handleJoinRoom(socket, data));
    socket.on('player_ready', (data) => roomHandlers.handlePlayerReady(socket, data));
    socket.on('list_rooms', () => roomHandlers.handleListRooms(socket));
    socket.on('check_room_availability', (data) => roomHandlers.handleCheckRoomAvailability(socket, data));

    // Game events
    socket.on('start_game', (data) => gameHandlers.handleStartGame(socket, data));
    socket.on('send_message', (data) => gameHandlers.handleSendMessage(socket, data));
    socket.on('player_guess', (data) => gameHandlers.handlePlayerGuess(socket, data));

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        roomHandlers.handleDisconnect(socket);
        lobbyHandlers.handleDisconnect(socket);
    });

    // Basic ping/pong for connection testing
    socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
    });
});

// Only start server if this is the main module (not when imported for testing)
if (require.main === module) {
    // Start server
    server.listen(PORT, () => {
        console.log(`🚀 Backend server running on http://localhost:${PORT}`);
        console.log(`📱 Connect your React Native app to: http://localhost:${PORT}`);
        console.log(`🔌 Socket.IO server ready for WebSocket connections`);
        console.log(`🌍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully');
        server.close(() => {
            console.log('Process terminated');
        });
    });

    process.on('SIGINT', () => {
        console.log('SIGINT received, shutting down gracefully');
        server.close(() => {
            console.log('Process terminated');
        });
    });
}

export { app, io, server };
