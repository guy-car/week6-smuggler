import { Socket } from 'socket.io';
import { RoomManager } from '../../rooms/manager';

export class TypingHandlers {
    private roomManager: RoomManager;
    private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

    constructor(roomManager: RoomManager) {
        this.roomManager = roomManager;
    }

    /**
     * Handle typing:start event
     */
    public handleTypingStart = (socket: Socket, data: { roomId: string; role: string }) => {
        try {
            const { roomId, role } = data;

            // Validate data
            if (!roomId || !role) {
                socket.emit('error', { message: 'Room ID and role are required' });
                return;
            }

            if (role !== 'encoder' && role !== 'decoder') {
                socket.emit('error', { message: 'Role must be either "encoder" or "decoder"' });
                return;
            }

            // Validate room exists
            const room = this.roomManager.getRoom(roomId);
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }

            // Set typing state
            const success = this.roomManager.setTypingState(roomId, role as 'encoder' | 'decoder', true);
            if (!success) {
                socket.emit('error', { message: 'Failed to set typing state' });
                return;
            }

            // Clear any existing timeout for this room
            this.clearTypingTimeout(roomId);

            // Broadcast typing indicator to other players in the room
            socket.to(roomId).emit('typing:indicator', {
                role: role as 'encoder' | 'decoder',
                isTyping: true
            });

            console.log(`[Typing] ${role} started typing in room ${roomId}`);
        } catch (error) {
            console.error('Error in handleTypingStart:', error);
            socket.emit('error', { message: 'Internal server error' });
        }
    };

    /**
     * Handle typing:stop event
     */
    public handleTypingStop = (socket: Socket, data: { roomId: string; role: string }) => {
        try {
            const { roomId, role } = data;

            // Validate data
            if (!roomId || !role) {
                socket.emit('error', { message: 'Room ID and role are required' });
                return;
            }

            if (role !== 'encoder' && role !== 'decoder') {
                socket.emit('error', { message: 'Role must be either "encoder" or "decoder"' });
                return;
            }

            // Clear typing state immediately
            this.clearTypingState(roomId);

            // Broadcast typing indicator to other players in the room
            socket.to(roomId).emit('typing:indicator', {
                role: role as 'encoder' | 'decoder',
                isTyping: false
            });

            console.log(`[Typing] ${role} stopped typing in room ${roomId}`);
        } catch (error) {
            console.error('Error in handleTypingStop:', error);
            socket.emit('error', { message: 'Internal server error' });
        }
    };

    /**
     * Clear typing state for a room
     */
    private clearTypingState(roomId: string): void {
        this.roomManager.clearTypingState(roomId);
        this.clearTypingTimeout(roomId);
    }

    /**
     * Clear typing timeout for a room
     */
    private clearTypingTimeout(roomId: string): void {
        const existingTimeout = this.typingTimeouts.get(roomId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
            this.typingTimeouts.delete(roomId);
        }
    }

    /**
     * Set typing timeout for a room (1 second delay)
     */
    public setTypingTimeout(roomId: string, role: 'encoder' | 'decoder'): void {
        // Clear any existing timeout
        this.clearTypingTimeout(roomId);

        // Set new timeout
        const timeout = setTimeout(() => {
            // Check if typing state has expired
            if (this.roomManager.isTypingStateExpired(roomId)) {
                this.clearTypingState(roomId);
                console.log(`[Typing] Typing state expired for ${role} in room ${roomId}`);
            }
        }, 1000); // 1 second timeout

        this.typingTimeouts.set(roomId, timeout);
    }

    /**
     * Handle player disconnection - cleanup typing state
     */
    public handleDisconnect = (socket: Socket): void => {
        try {
            // Find all rooms the player is in and clear typing state
            const allRooms = this.roomManager.getAllRooms();

            for (const room of allRooms) {
                const player = room.players.find(p => p.socketId === socket.id);
                if (player) {
                    // Clear typing state if this player was typing
                    if (room.typingState && room.typingState.role === player.role) {
                        this.clearTypingState(room.id);
                        console.log(`[Typing] Cleared typing state for disconnected player ${player.name} in room ${room.id}`);
                    }
                    break; // Player can only be in one room at a time
                }
            }
        } catch (error) {
            console.error('Error in typing handleDisconnect:', error);
        }
    };

    /**
     * Cleanup all typing timeouts (for testing)
     */
    public cleanup(): void {
        for (const timeout of this.typingTimeouts.values()) {
            clearTimeout(timeout);
        }
        this.typingTimeouts.clear();
    }
} 