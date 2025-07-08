import { Socket } from 'socket.io';
import { RoomManager } from '../../rooms/manager';

export class LobbyHandlers {
    private roomManager: RoomManager;
    private lobbyClients: Set<string> = new Set(); // Track clients in lobby

    constructor(roomManager: RoomManager) {
        this.roomManager = roomManager;
    }

    /**
     * Handle enter_lobby event - client enters lobby
     */
    public handleEnterLobby = (socket: Socket) => {
        try {
            // Add client to lobby tracking
            this.lobbyClients.add(socket.id);

            // Send current room list to the client
            this.sendRoomListToClient(socket);

            console.log(`Client ${socket.id} entered lobby`);
        } catch (error) {
            console.error('Error in handleEnterLobby:', error);
            socket.emit('error', { message: 'Internal server error' });
        }
    };

    /**
     * Handle leave_lobby event - client leaves lobby
     */
    public handleLeaveLobby = (socket: Socket) => {
        try {
            // Remove client from lobby tracking
            this.lobbyClients.delete(socket.id);

            console.log(`Client ${socket.id} left lobby`);
        } catch (error) {
            console.error('Error in handleLeaveLobby:', error);
            socket.emit('error', { message: 'Internal server error' });
        }
    };

    /**
     * Handle client disconnection from lobby
     */
    public handleDisconnect = (socket: Socket) => {
        // Remove client from lobby tracking
        this.lobbyClients.delete(socket.id);
    };

    /**
     * Send room list to a specific client
     */
    public sendRoomListToClient(socket: Socket): void {
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
            console.error('Error sending room list to client:', error);
            socket.emit('error', { message: 'Failed to get room list' });
        }
    }

    /**
     * Broadcast room list to all lobby clients
     */
    public broadcastRoomList(io: any): void {
        try {
            const availableRooms = this.roomManager.getAvailableRooms();
            const roomListData = {
                rooms: availableRooms.map(room => ({
                    id: room.id,
                    playerCount: room.players.length,
                    maxPlayers: 2,
                    createdAt: room.createdAt
                }))
            };

            // Broadcast to all lobby clients
            this.lobbyClients.forEach(clientId => {
                const clientSocket = io.sockets.sockets.get(clientId);
                if (clientSocket) {
                    clientSocket.emit('room_list', roomListData);
                }
            });
        } catch (error) {
            console.error('Error broadcasting room list:', error);
        }
    }

    /**
     * Get lobby client count
     */
    public getLobbyClientCount(): number {
        return this.lobbyClients.size;
    }

    /**
     * Check if a client is in lobby
     */
    public isClientInLobby(socketId: string): boolean {
        return this.lobbyClients.has(socketId);
    }
} 