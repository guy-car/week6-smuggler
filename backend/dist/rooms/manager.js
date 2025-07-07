"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.MAX_PLAYERS_PER_ROOM = 2;
        this.ROOM_CLEANUP_INTERVAL = 5 * 60 * 1000;
        this.ROOM_TIMEOUT = 30 * 60 * 1000;
        this.startCleanupInterval();
    }
    joinRoom(roomId, player) {
        try {
            let room = this.rooms.get(roomId);
            if (!room) {
                room = this.createRoom(roomId);
            }
            if (room.players.length >= this.MAX_PLAYERS_PER_ROOM) {
                return {
                    success: false,
                    roomId,
                    players: room.players,
                    error: 'Room is full'
                };
            }
            const existingPlayerIndex = room.players.findIndex(p => p.id === player.id);
            if (existingPlayerIndex !== -1) {
                room.players[existingPlayerIndex] = { ...player };
            }
            else {
                room.players.push(player);
            }
            room.lastActivity = new Date();
            return {
                success: true,
                roomId,
                players: room.players
            };
        }
        catch (error) {
            return {
                success: false,
                roomId,
                players: [],
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    setPlayerReady(roomId, playerId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return false;
        }
        const player = room.players.find(p => p.id === playerId);
        if (player) {
            player.ready = true;
            room.lastActivity = new Date();
            return true;
        }
        return false;
    }
    removePlayer(roomId, playerId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return false;
        }
        const playerIndex = room.players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            room.players.splice(playerIndex, 1);
            room.lastActivity = new Date();
            if (room.players.length === 0) {
                this.rooms.delete(roomId);
            }
            return true;
        }
        return false;
    }
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    getAllRooms() {
        return Array.from(this.rooms.values());
    }
    getAvailableRooms() {
        return Array.from(this.rooms.values()).filter(room => room.players.length < this.MAX_PLAYERS_PER_ROOM);
    }
    isRoomAvailable(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return true;
        }
        return room.players.length < this.MAX_PLAYERS_PER_ROOM;
    }
    isRoomReady(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return false;
        }
        return room.players.length === this.MAX_PLAYERS_PER_ROOM &&
            room.players.every(player => player.ready);
    }
    validateRoom(roomId) {
        const room = this.rooms.get(roomId);
        const errors = [];
        if (!room) {
            errors.push('Room does not exist');
            return { valid: false, errors };
        }
        if (room.players.length > this.MAX_PLAYERS_PER_ROOM) {
            errors.push(`Room has too many players: ${room.players.length}`);
        }
        if (room.players.length === 0) {
            errors.push('Room has no players');
        }
        const playerIds = room.players.map(p => p.id);
        const uniquePlayerIds = new Set(playerIds);
        if (playerIds.length !== uniquePlayerIds.size) {
            errors.push('Room has duplicate player IDs');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    getPlayerCount(roomId) {
        const room = this.rooms.get(roomId);
        return room ? room.players.length : 0;
    }
    getRoomCount() {
        return this.rooms.size;
    }
    createRoom(roomId) {
        const room = {
            id: roomId,
            players: [],
            gameState: null,
            createdAt: new Date(),
            lastActivity: new Date()
        };
        this.rooms.set(roomId, room);
        return room;
    }
    startCleanupInterval() {
        setInterval(() => {
            this.cleanupInactiveRooms();
        }, this.ROOM_CLEANUP_INTERVAL);
    }
    cleanupInactiveRooms() {
        const now = new Date();
        const roomsToDelete = [];
        for (const [roomId, room] of this.rooms.entries()) {
            const timeSinceLastActivity = now.getTime() - room.lastActivity.getTime();
            if (timeSinceLastActivity > this.ROOM_TIMEOUT) {
                roomsToDelete.push(roomId);
            }
        }
        roomsToDelete.forEach(roomId => {
            this.rooms.delete(roomId);
            console.log(`Cleaned up inactive room: ${roomId}`);
        });
    }
    forceCleanupRoom(roomId) {
        return this.rooms.delete(roomId);
    }
}
exports.RoomManager = RoomManager;
//# sourceMappingURL=manager.js.map