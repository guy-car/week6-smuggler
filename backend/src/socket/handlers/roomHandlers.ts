import { Socket } from 'socket.io';
import { RoomManager } from '../../rooms/manager';
import { Player } from '../../types';
import { LobbyHandlers } from './lobbyHandlers';

export class RoomHandlers {
    private roomManager: RoomManager;
    private lobbyHandlers: LobbyHandlers;

    constructor(roomManager: RoomManager, lobbyHandlers: LobbyHandlers) {
        this.roomManager = roomManager;
        this.lobbyHandlers = lobbyHandlers;
    }

    /**
     * Handle join_room event
     */
    public handleJoinRoom = (socket: Socket, data: { roomId: string; playerName: string }) => {
        try {
            const { roomId, playerName } = data;

            // Validate data types
            if (typeof roomId !== 'string' || typeof playerName !== 'string') {
                socket.emit('error', { message: 'Room ID and player name must be strings' });
                return;
            }

            if (!roomId || !playerName) {
                socket.emit('error', { message: 'Room ID and player name are required' });
                return;
            }

            // Validate roomId format (should be alphanumeric and reasonable length)
            if (!/^[a-zA-Z0-9_-]{1,50}$/.test(roomId)) {
                socket.emit('join_room_error', {
                    roomId,
                    error: 'Invalid room ID format'
                });
                return;
            }

            // Validate player name length (allow reasonable length but not too long)
            if (playerName.length > 100) {
                socket.emit('join_room_error', {
                    roomId,
                    error: 'Player name too long (max 100 characters)'
                });
                return;
            }

            // Create player object
            const player: Player = {
                id: socket.id,
                name: playerName,
                ready: false,
                role: null,
                socketId: socket.id
            };

            // Join room
            const result = this.roomManager.joinRoom(roomId, player);

            if (!result.success) {
                socket.emit('join_room_error', {
                    roomId,
                    error: result.error || 'Failed to join room'
                });
                return;
            }

            // Join socket room
            socket.join(roomId);

            // Emit success to joining player
            socket.emit('join_room_success', {
                roomId,
                players: result.players,
                playerId: player.id
            });

            // Notify other players in the room
            socket.to(roomId).emit('player_joined', {
                roomId,
                player,
                players: result.players
            });

            console.log(`Player ${playerName} (${socket.id}) joined room ${roomId}`);
        } catch (error) {
            console.error('Error in handleJoinRoom:', error);
            socket.emit('error', { message: 'Internal server error' });
        }
    };

    /**
     * Handle player_ready event
     */
    public handlePlayerReady = (socket: Socket, data: { roomId: string; ready?: boolean }) => {
        try {
            const { roomId, ready = true } = data;

            if (!roomId) {
                socket.emit('error', { message: 'Room ID is required' });
                return;
            }

            // Set player ready status
            const success = this.roomManager.setPlayerReadyStatus(roomId, socket.id, ready);

            if (!success) {
                socket.emit('player_ready_error', {
                    roomId,
                    error: 'Failed to set player ready status'
                });
                return;
            }

            // Get updated room state
            const room = this.roomManager.getRoom(roomId);
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }

            // Emit success to the player
            socket.emit('player_ready_success', {
                roomId,
                players: room.players
            });

            // Notify other players in the room
            socket.to(roomId).emit('player_ready', {
                roomId,
                playerId: socket.id,
                players: room.players
            });

            // Check if room is ready to start
            if (this.roomManager.isRoomReady(roomId)) {
                // Emit to all players in the room
                socket.to(roomId).emit('room_ready', {
                    roomId,
                    players: room.players
                });
                socket.emit('room_ready', {
                    roomId,
                    players: room.players
                });
            }

            console.log(`Player ${socket.id} ready status set to ${ready} in room ${roomId}`);
        } catch (error) {
            console.error('Error in handlePlayerReady:', error);
            socket.emit('error', { message: 'Internal server error' });
        }
    };

    /**
     * Handle player disconnection
     */
    public handleDisconnect = (socket: Socket) => {
        try {
            // Find all rooms the player is in
            const allRooms = this.roomManager.getAllRooms();

            for (const room of allRooms) {
                const player = room.players.find(p => p.socketId === socket.id);
                if (player) {
                    // Remove player from room
                    this.roomManager.removePlayer(room.id, player.id);

                    // Notify other players
                    socket.to(room.id).emit('player_disconnected', {
                        roomId: room.id,
                        playerId: player.id,
                        players: room.players.filter(p => p.id !== player.id)
                    });

                    console.log(`Player ${player.name} (${socket.id}) disconnected from room ${room.id}`);
                    break; // Player can only be in one room at a time
                }
            }
        } catch (error) {
            console.error('Error in handleDisconnect:', error);
        }
    };

    /**
     * Handle room:leave event - player leaves room voluntarily
     */
    public handleLeaveRoom = (socket: Socket, data: { roomId: string }) => {
        console.log(`[Backend] handleLeaveRoom called for socket ${socket.id} with data:`, data);
        try {
            const { roomId } = data;

            if (!roomId) {
                socket.emit('error', { message: 'Room ID is required' });
                return;
            }

            const room = this.roomManager.getRoom(roomId);
            if (!room) {
                socket.emit('leave_room_error', {
                    roomId,
                    error: 'Room not found'
                });
                return;
            }

            // Find the player in the room
            const player = room.players.find(p => p.socketId === socket.id);
            if (!player) {
                socket.emit('leave_room_error', {
                    roomId,
                    error: 'Player not found in room'
                });
                return;
            }

            // Remove player from room
            const success = this.roomManager.removePlayer(roomId, player.id);
            if (!success) {
                socket.emit('leave_room_error', {
                    roomId,
                    error: 'Failed to leave room'
                });
                return;
            }

            // Leave socket room
            socket.leave(roomId);

            // Automatically add player back to lobby
            this.lobbyHandlers.handleEnterLobby(socket);

            // Emit success to the leaving player
            socket.emit('leave_room_success', {
                roomId,
                playerId: player.id
            });

            // Notify other players in the room
            socket.to(roomId).emit('player_left', {
                roomId,
                playerId: player.id,
                players: room.players.filter(p => p.id !== player.id)
            });

            console.log(`Player ${player.name} (${socket.id}) left room ${roomId} and returned to lobby`);
        } catch (error) {
            console.error('Error in handleLeaveRoom:', error);
            socket.emit('error', { message: 'Internal server error' });
        }
    };

    /**
     * Handle room listing request
     */
    public handleListRooms = (socket: Socket) => {
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
        } catch (error) {
            console.error('Error in handleListRooms:', error);
            socket.emit('error', { message: 'Internal server error' });
        }
    };

    /**
     * Handle room availability check
     */
    public handleCheckRoomAvailability = (socket: Socket, data: { roomId: string }) => {
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
        } catch (error) {
            console.error('Error in handleCheckRoomAvailability:', error);
            socket.emit('error', { message: 'Internal server error' });
        }
    };
} 