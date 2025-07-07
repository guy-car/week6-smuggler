"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomHandlers = void 0;
class RoomHandlers {
    constructor(roomManager) {
        this.handleJoinRoom = (socket, data) => {
            try {
                const { roomId, playerName } = data;
                if (!roomId || !playerName) {
                    socket.emit('error', { message: 'Room ID and player name are required' });
                    return;
                }
                const player = {
                    id: socket.id,
                    name: playerName,
                    ready: false,
                    role: null,
                    socketId: socket.id
                };
                const result = this.roomManager.joinRoom(roomId, player);
                if (!result.success) {
                    socket.emit('join_room_error', {
                        roomId,
                        error: result.error || 'Failed to join room'
                    });
                    return;
                }
                socket.join(roomId);
                socket.emit('join_room_success', {
                    roomId,
                    players: result.players,
                    playerId: player.id
                });
                socket.to(roomId).emit('player_joined', {
                    roomId,
                    player,
                    players: result.players
                });
                console.log(`Player ${playerName} (${socket.id}) joined room ${roomId}`);
            }
            catch (error) {
                console.error('Error in handleJoinRoom:', error);
                socket.emit('error', { message: 'Internal server error' });
            }
        };
        this.handlePlayerReady = (socket, data) => {
            try {
                const { roomId } = data;
                if (!roomId) {
                    socket.emit('error', { message: 'Room ID is required' });
                    return;
                }
                const success = this.roomManager.setPlayerReady(roomId, socket.id);
                if (!success) {
                    socket.emit('player_ready_error', {
                        roomId,
                        error: 'Failed to set player ready'
                    });
                    return;
                }
                const room = this.roomManager.getRoom(roomId);
                if (!room) {
                    socket.emit('error', { message: 'Room not found' });
                    return;
                }
                socket.emit('player_ready_success', {
                    roomId,
                    players: room.players
                });
                socket.to(roomId).emit('player_ready', {
                    roomId,
                    playerId: socket.id,
                    players: room.players
                });
                if (this.roomManager.isRoomReady(roomId)) {
                    socket.to(roomId).emit('room_ready', {
                        roomId,
                        players: room.players
                    });
                    socket.emit('room_ready', {
                        roomId,
                        players: room.players
                    });
                }
                console.log(`Player ${socket.id} is ready in room ${roomId}`);
            }
            catch (error) {
                console.error('Error in handlePlayerReady:', error);
                socket.emit('error', { message: 'Internal server error' });
            }
        };
        this.handleDisconnect = (socket) => {
            try {
                const allRooms = this.roomManager.getAllRooms();
                for (const room of allRooms) {
                    const player = room.players.find(p => p.socketId === socket.id);
                    if (player) {
                        this.roomManager.removePlayer(room.id, player.id);
                        socket.to(room.id).emit('player_disconnected', {
                            roomId: room.id,
                            playerId: player.id,
                            players: room.players.filter(p => p.id !== player.id)
                        });
                        console.log(`Player ${player.name} (${socket.id}) disconnected from room ${room.id}`);
                        break;
                    }
                }
            }
            catch (error) {
                console.error('Error in handleDisconnect:', error);
            }
        };
        this.handleListRooms = (socket) => {
            try {
                const availableRooms = this.roomManager.getAvailableRooms();
                socket.emit('room_list', {
                    rooms: availableRooms.map(room => ({
                        id: room.id,
                        playerCount: room.players.length,
                        maxPlayers: 2,
                        createdAt: room.createdAt
                    }))
                });
            }
            catch (error) {
                console.error('Error in handleListRooms:', error);
                socket.emit('error', { message: 'Internal server error' });
            }
        };
        this.handleCheckRoomAvailability = (socket, data) => {
            try {
                const { roomId } = data;
                if (!roomId) {
                    socket.emit('error', { message: 'Room ID is required' });
                    return;
                }
                const isAvailable = this.roomManager.isRoomAvailable(roomId);
                const playerCount = this.roomManager.getPlayerCount(roomId);
                socket.emit('room_availability', {
                    roomId,
                    available: isAvailable,
                    playerCount,
                    maxPlayers: 2
                });
            }
            catch (error) {
                console.error('Error in handleCheckRoomAvailability:', error);
                socket.emit('error', { message: 'Internal server error' });
            }
        };
        this.roomManager = roomManager;
    }
}
exports.RoomHandlers = RoomHandlers;
//# sourceMappingURL=roomHandlers.js.map