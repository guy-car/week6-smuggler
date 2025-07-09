import { Socket } from 'socket.io';
import { GameStateManager } from '../../game/state';
import { WordManager } from '../../game/wordManager';
import { RoomManager } from '../../rooms/manager';
import { GameStartData, Player } from '../../types';

export class LobbyHandlers {
    private readonly wordManager: WordManager;
    private readonly gameStateManager: GameStateManager;
    private readonly lobbyClients: Set<string> = new Set(); // Track clients in lobby

    constructor(
        private readonly roomManager: RoomManager
    ) {
        this.wordManager = new WordManager();
        this.gameStateManager = new GameStateManager();
    }

    /**
     * Handle player ready status change
     */
    public handlePlayerReady = (socket: Socket) => {
        try {
            const room = this.roomManager.getRoom(socket.id);
            if (!room) {
                throw new Error('Room not found');
            }

            const player = room.players.find((p: Player) => p.id === socket.id);
            if (!player) {
                throw new Error('Player not found in room');
            }

            // Toggle ready status
            player.ready = !player.ready;

            // Check if all players are ready
            const allReady = room.players.every((p: Player) => p.ready);
            if (allReady && room.players.length === 2) {
                // Assign roles and start game
                const roles = this.gameStateManager.assignRoles(room.players);
                
                // Update player roles
                room.players.forEach((p: Player) => {
                    if (roles.encoder === p.id) {
                        p.role = 'encoder';
                    } else if (roles.decoder === p.id) {
                        p.role = 'decoder';
                    }
                });

                // Generate secret word
                const secretWord = this.wordManager.selectRandomWord();

                // Create initial game state
                room.gameState = this.gameStateManager.createGameState(secretWord, room.players);

                // Prepare game start data
                const gameStartData: GameStartData = {
                    roomId: room.id,
                    players: room.players,
                    roles,
                    secretWord
                };

                // Notify players
                socket.emit('game_started', gameStartData);
                socket.to(room.id).emit('game_started', gameStartData);
            } else {
                // Broadcast updated player list
                socket.emit('players_updated', room.players);
                socket.to(room.id).emit('players_updated', room.players);
            }
        } catch (error) {
            socket.emit('error', { message: error instanceof Error ? error.message : 'Unknown error' });
        }
    };

    /**
     * Handle client joining lobby
     */
    public handleJoinLobby = (socket: Socket) => {
        this.lobbyClients.add(socket.id);
        socket.emit('lobby_joined');
    };

    /**
     * Handle client leaving lobby
     */
    public handleLeaveLobby = (socket: Socket) => {
        this.lobbyClients.delete(socket.id);
        socket.emit('lobby_left');
    };

    /**
     * Get count of clients in lobby
     */
    public getLobbyClientCount = (): number => {
        return this.lobbyClients.size;
    };

    /**
     * Check if client is in lobby
     */
    public isClientInLobby = (clientId: string): boolean => {
        return this.lobbyClients.has(clientId);
    };

    /**
     * Clear all clients from lobby
     */
    public clearLobby = () => {
        this.lobbyClients.clear();
    };

    /**
     * Get all client IDs in lobby
     */
    public getLobbyClients = (): string[] => {
        return Array.from(this.lobbyClients);
    };
} 