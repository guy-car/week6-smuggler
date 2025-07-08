import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RoomManager } from '../rooms/manager';
import { CreateRoomRequest, CreateRoomResponse } from '../types';

const router = Router();

// Initialize room manager (will be shared with socket handlers)
const roomManager = new RoomManager();

/**
 * POST /api/rooms
 * Create a new room and auto-join the creator
 */
router.post('/', (req: CreateRoomRequest, res) => {
    try {
        // Generate room ID
        const roomId = uuidv4();

        // Generate player ID for creator
        const playerId = `player-${uuidv4().substring(0, 8)}`;

        // Create player object
        const player = {
            id: playerId,
            name: `Player ${playerId.substring(7)}`, // Use last 8 chars for display name
            ready: false,
            role: null,
            socketId: '' // Will be set when player connects via WebSocket
        };

        // Create room with player
        const result = roomManager.createRoomWithPlayer(roomId, player);

        if (result.success) {
            const response: CreateRoomResponse = {
                success: true,
                roomId,
                playerId,
                message: 'Room created successfully'
            };

            res.status(201).json(response);
        } else {
            const response: CreateRoomResponse = {
                success: false,
                roomId: '',
                playerId: '',
                message: result.error || 'Failed to create room'
            };

            res.status(500).json(response);
        }
    } catch (error) {
        console.error('Error creating room:', error);

        const response: CreateRoomResponse = {
            success: false,
            roomId: '',
            playerId: '',
            message: error instanceof Error ? error.message : 'Internal server error'
        };

        res.status(500).json(response);
    }
});

export default router; 