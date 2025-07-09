import { Socket } from 'socket.io';
import { RoomManager } from '../../rooms/manager';
import { Player } from '../../types';

export class RoomHandlers {
    constructor(
        private readonly roomManager: RoomManager
    ) {}

    /**
     * Handle create_room event
     */
    public handleCreateRoom = (socket: Socket, data: { playerName: string }) => {
        try {
            // Create new player
            const player: Player = {
                id: socket.id,
                name: data.playerName,
                ready: false,
                role: null,
                socketId: socket.id
            };

            // Create room with player
            const result = this.roomManager.createRoomWithPlayer(socket.id, player);
            if (!result.success) {
                throw new Error(result.error || 'Failed to create room');
            }

            // Join socket.io room
            socket.join(result.roomId);

            // Send success response
            socket.emit('room_created', {
                roomId: result.roomId,
                player: result.player
            });

            // Broadcast room update
            socket.broadcast.emit('room_list_updated');
        } catch (error) {
            socket.emit('error', { message: error instanceof Error ? error.message : 'Unknown error' });
        }
    };

    /**
     * Handle join_room event
     */
    public handleJoinRoom = (socket: Socket, data: { roomId: string; playerName: string }) => {
        try {
            const { roomId, playerName } = data;

            // Create new player
            const player: Player = {
                id: socket.id,
                name: playerName,
                ready: false,
                role: null,
                socketId: socket.id
            };

            // Add player to room
            const result = this.roomManager.joinRoom(roomId, player);
            if (!result.success) {
                throw new Error(result.error || 'Failed to join room');
            }

            // Join socket.io room
            socket.join(roomId);

            // Send success response to joining player
            socket.emit('room_joined', {
                roomId,
                players: result.players
            });

            // Notify other players in room
            socket.to(roomId).emit('player_joined', {
                player
            });

            // Broadcast room update
            socket.broadcast.emit('room_list_updated');
        } catch (error) {
            socket.emit('error', { message: error instanceof Error ? error.message : 'Unknown error' });
        }
    };

    /**
     * Handle leave_room event
     */
    public handleLeaveRoom = (socket: Socket) => {
        try {
            const room = this.roomManager.getRoom(socket.id);
            if (!room) {
                throw new Error('Room not found');
            }

            // Remove player from room
            const success = this.roomManager.removePlayer(room.id, socket.id);
            if (!success) {
                throw new Error('Failed to leave room');
            }

            // Leave socket.io room
            socket.leave(room.id);

            // Send success response
            socket.emit('room_left', {
                roomId: room.id
            });

            // Notify other players in room
            socket.to(room.id).emit('player_left', {
                playerId: socket.id
            });

            // Broadcast room update
            socket.broadcast.emit('room_list_updated');
        } catch (error) {
            socket.emit('error', { message: error instanceof Error ? error.message : 'Unknown error' });
        }
    };

    /**
     * Handle disconnect event
     */
    public handleDisconnect = (socket: Socket) => {
        try {
            const room = this.roomManager.getRoom(socket.id);
            if (!room) {
                return; // Player wasn't in a room
            }

            // Remove player from room
            const success = this.roomManager.removePlayer(room.id, socket.id);
            if (!success) {
                throw new Error('Failed to handle disconnect');
            }

            // Notify other players in room
            socket.to(room.id).emit('player_disconnected', {
                playerId: socket.id
            });

            // Broadcast room update
            socket.broadcast.emit('room_list_updated');
        } catch (error) {
            console.error('Error handling disconnect:', error);
        }
    };
} 