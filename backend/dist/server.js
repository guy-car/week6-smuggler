"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.io = exports.app = void 0;
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const manager_1 = require("./rooms/manager");
const ai_1 = __importDefault(require("./routes/ai"));
const gameHandlers_1 = require("./socket/handlers/gameHandlers");
const roomHandlers_1 = require("./socket/handlers/roomHandlers");
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
exports.server = server;
const PORT = process.env['PORT'] || 3000;
const roomManager = new manager_1.RoomManager();
const roomHandlers = new roomHandlers_1.RoomHandlers(roomManager);
const corsOptions = {
    origin: 'http://localhost:8081',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use('/api/ai', ai_1.default);
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env['NODE_ENV'] === 'development' ? err.message : 'Something went wrong'
    });
});
app.get('/', (req, res) => {
    res.json({ message: 'Smuggler Backend API is running!' });
});
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env['NODE_ENV'] || 'development'
    });
});
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:8081",
        methods: ["GET", "POST"],
        credentials: true
    }
});
exports.io = io;
const gameHandlers = new gameHandlers_1.GameHandlers(roomManager, io);
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socket.on('join_room', (data) => roomHandlers.handleJoinRoom(socket, data));
    socket.on('player_ready', (data) => roomHandlers.handlePlayerReady(socket, data));
    socket.on('list_rooms', () => roomHandlers.handleListRooms(socket));
    socket.on('check_room_availability', (data) => roomHandlers.handleCheckRoomAvailability(socket, data));
    socket.on('start_game', (data) => gameHandlers.handleStartGame(socket, data));
    socket.on('send_message', (data) => gameHandlers.handleSendMessage(socket, data));
    socket.on('player_guess', (data) => gameHandlers.handlePlayerGuess(socket, data));
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        roomHandlers.handleDisconnect(socket);
    });
    socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
    });
});
if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`🚀 Backend server running on http://localhost:${PORT}`);
        console.log(`📱 Connect your React Native app to: http://localhost:${PORT}`);
        console.log(`🔌 Socket.IO server ready for WebSocket connections`);
        console.log(`🌍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
    });
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
//# sourceMappingURL=server.js.map