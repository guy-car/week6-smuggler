import { Player, Room, RoomJoinResult } from '../types';

export class RoomManager {
    private rooms: Map<string, Room> = new Map();
    private readonly MAX_PLAYERS_PER_ROOM = 2;
    private readonly ROOM_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
    private readonly ROOM_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    private onRoomChange?: () => void; // Callback for room changes

    constructor() {
        this.startCleanupInterval();
    }

    /**
     * Set callback for room changes (used for lobby broadcasting)
     */
    public setRoomChangeCallback(callback: () => void): void {
        this.onRoomChange = callback;
    }

    /**
     * Trigger room change callback if set
     */
    private triggerRoomChange(): void {
        if (this.onRoomChange) {
            this.onRoomChange();
        }
    }

    /**
     * Create a new room or join existing room
     */
    public joinRoom(roomId: string, player: Player): RoomJoinResult {
        try {
            let room = this.rooms.get(roomId);

            // Create new room if it doesn't exist
            if (!room) {
                room = this.createRoom(roomId);
            }

            // Check if room is full
            if (room.players.length >= this.MAX_PLAYERS_PER_ROOM) {
                return {
                    success: false,
                    roomId,
                    players: room.players,
                    error: 'Room is full'
                };
            }

            // Check if player is already in the room
            const existingPlayerIndex = room.players.findIndex(p => p.id === player.id);
            if (existingPlayerIndex !== -1) {
                // Update existing player
                room.players[existingPlayerIndex] = { ...player };
            } else {
                // Add new player
                room.players.push(player);
            }

            // Update room activity
            room.lastActivity = new Date();

            // Trigger room change callback for lobby broadcasting
            this.triggerRoomChange();

            return {
                success: true,
                roomId,
                players: room.players
            };
        } catch (error) {
            return {
                success: false,
                roomId,
                players: [],
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Mark a player as ready
     */
    public setPlayerReady(roomId: string, playerId: string): boolean {
        return this.setPlayerReadyStatus(roomId, playerId, true);
    }

    /**
     * Set a player's ready status
     */
    public setPlayerReadyStatus(roomId: string, playerId: string, ready: boolean): boolean {
        const room = this.rooms.get(roomId);
        if (!room) {
            return false;
        }

        const player = room.players.find(p => p.id === playerId);
        if (player) {
            player.ready = ready;
            room.lastActivity = new Date();

            // Trigger room change callback for lobby broadcasting
            this.triggerRoomChange();

            return true;
        }

        return false;
    }

    /**
     * Remove a player from a room
     */
    public removePlayer(roomId: string, playerId: string): boolean {
        const room = this.rooms.get(roomId);
        if (!room) {
            return false;
        }

        const playerIndex = room.players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            room.players.splice(playerIndex, 1);
            room.lastActivity = new Date();

            // Clean up empty rooms
            if (room.players.length === 0) {
                this.rooms.delete(roomId);
            }

            // Trigger room change callback for lobby broadcasting
            this.triggerRoomChange();

            return true;
        }

        return false;
    }

    /**
     * Get room by ID
     */
    public getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }

    /**
     * Get all rooms
     */
    public getAllRooms(): Room[] {
        return Array.from(this.rooms.values());
    }

    /**
     * Get available rooms (not full)
     */
    public getAvailableRooms(): Room[] {
        return Array.from(this.rooms.values()).filter(room =>
            room.players.length < this.MAX_PLAYERS_PER_ROOM
        );
    }

    /**
     * Check if room is available for joining
     */
    public isRoomAvailable(roomId: string): boolean {
        const room = this.rooms.get(roomId);
        if (!room) {
            return true; // Room doesn't exist, so it's available
        }
        return room.players.length < this.MAX_PLAYERS_PER_ROOM;
    }

    /**
     * Check if room is ready to start (all players ready)
     */
    public isRoomReady(roomId: string): boolean {
        const room = this.rooms.get(roomId);
        if (!room) {
            return false;
        }

        return room.players.length === this.MAX_PLAYERS_PER_ROOM &&
            room.players.every(player => player.ready);
    }

    /**
     * Validate room state
     */
    public validateRoom(roomId: string): { valid: boolean; errors: string[] } {
        const room = this.rooms.get(roomId);
        const errors: string[] = [];

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

        // Check for duplicate player IDs
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

    /**
     * Get player count in a room
     */
    public getPlayerCount(roomId: string): number {
        const room = this.rooms.get(roomId);
        return room ? room.players.length : 0;
    }

    /**
     * Get total room count
     */
    public getRoomCount(): number {
        return this.rooms.size;
    }

    /**
     * Create a new room
     */
    private createRoom(roomId: string): Room {
        const room: Room = {
            id: roomId,
            players: [],
            gameState: null,
            createdAt: new Date(),
            lastActivity: new Date()
        };

        this.rooms.set(roomId, room);
        return room;
    }

    /**
     * Start cleanup interval for inactive rooms
     */
    private startCleanupInterval(): void {
        setInterval(() => {
            this.cleanupInactiveRooms();
        }, this.ROOM_CLEANUP_INTERVAL);
    }

    /**
     * Clean up rooms that have been inactive for too long
     */
    private cleanupInactiveRooms(): void {
        const now = new Date();
        const roomsToDelete: string[] = [];

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

        // Trigger room change callback if any rooms were deleted
        if (roomsToDelete.length > 0) {
            this.triggerRoomChange();
        }
    }

    /**
     * Force cleanup of a specific room (for testing)
     */
    public forceCleanupRoom(roomId: string): boolean {
        return this.rooms.delete(roomId);
    }

    /**
     * Create a room with a player already added
     */
    public createRoomWithPlayer(roomId: string, player: Player): { success: boolean; roomId: string; player: Player; error?: string } {
        try {
            // Check if room already exists
            if (this.rooms.has(roomId)) {
                return {
                    success: false,
                    roomId,
                    player,
                    error: 'Room already exists'
                };
            }

            // Create the room
            const room = this.createRoom(roomId);

            // Add the player to the room
            room.players.push(player);

            // Update room activity
            room.lastActivity = new Date();

            // Trigger room change callback for lobby broadcasting
            this.triggerRoomChange();

            return {
                success: true,
                roomId,
                player
            };
        } catch (error) {
            return {
                success: false,
                roomId,
                player,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
} 