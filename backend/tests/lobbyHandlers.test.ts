import { createServer } from 'http';
import { RoomManager } from '../src/rooms/manager';
import { LobbyHandlers } from '../src/socket/handlers/lobbyHandlers';
import { Player } from '../src/types';

describe('LobbyHandlers', () => {
    let lobbyHandlers: LobbyHandlers;
    let roomManager: RoomManager;
    let server: any;

    beforeEach(() => {
        server = createServer();
        roomManager = new RoomManager();
        lobbyHandlers = new LobbyHandlers(roomManager);
    });

    afterEach(() => {
        server.close();
    });

    describe('handleEnterLobby', () => {
        it('should add client to lobby tracking', () => {
            const mockSocket = {
                id: 'test-socket-id',
                emit: jest.fn()
            } as any;

            lobbyHandlers.handleEnterLobby(mockSocket);

            expect(lobbyHandlers.getLobbyClientCount()).toBe(1);
            expect(lobbyHandlers.isClientInLobby('test-socket-id')).toBe(true);
        });

        it('should send room list to client when entering lobby', () => {
            const mockSocket = {
                id: 'test-socket-id',
                emit: jest.fn()
            } as any;

            // Create a test room
            const player: Player = {
                id: 'player1',
                name: 'Player 1',
                ready: false,
                role: null,
                socketId: 'socket1'
            };
            roomManager.createRoomWithPlayer('test-room', player);

            lobbyHandlers.handleEnterLobby(mockSocket);

            expect(mockSocket.emit).toHaveBeenCalledWith('room_list', {
                rooms: expect.arrayContaining([
                    expect.objectContaining({
                        id: 'test-room',
                        playerCount: 1,
                        maxPlayers: 2
                    })
                ])
            });
        });
    });

    describe('handleLeaveLobby', () => {
        it('should remove client from lobby tracking', () => {
            const mockSocket = {
                id: 'test-socket-id',
                emit: jest.fn()
            } as any;

            // Add client to lobby first
            lobbyHandlers.handleEnterLobby(mockSocket);
            expect(lobbyHandlers.getLobbyClientCount()).toBe(1);

            // Remove client from lobby
            lobbyHandlers.handleLeaveLobby(mockSocket);
            expect(lobbyHandlers.getLobbyClientCount()).toBe(0);
            expect(lobbyHandlers.isClientInLobby('test-socket-id')).toBe(false);
        });
    });

    describe('handleDisconnect', () => {
        it('should remove client from lobby tracking on disconnect', () => {
            const mockSocket = {
                id: 'test-socket-id',
                emit: jest.fn()
            } as any;

            // Add client to lobby first
            lobbyHandlers.handleEnterLobby(mockSocket);
            expect(lobbyHandlers.getLobbyClientCount()).toBe(1);

            // Simulate disconnect
            lobbyHandlers.handleDisconnect(mockSocket);
            expect(lobbyHandlers.getLobbyClientCount()).toBe(0);
            expect(lobbyHandlers.isClientInLobby('test-socket-id')).toBe(false);
        });
    });

    describe('sendRoomListToClient', () => {
        it('should send current room list to specific client', () => {
            const mockSocket = {
                id: 'test-socket-id',
                emit: jest.fn()
            } as any;

            // Create test rooms
            const player1: Player = {
                id: 'player1',
                name: 'Player 1',
                ready: false,
                role: null,
                socketId: 'socket1'
            };
            const player2: Player = {
                id: 'player2',
                name: 'Player 2',
                ready: false,
                role: null,
                socketId: 'socket2'
            };

            roomManager.createRoomWithPlayer('room1', player1);
            roomManager.createRoomWithPlayer('room2', player2);

            lobbyHandlers.sendRoomListToClient(mockSocket);

            expect(mockSocket.emit).toHaveBeenCalledWith('room_list', {
                rooms: expect.arrayContaining([
                    expect.objectContaining({ id: 'room1', playerCount: 1 }),
                    expect.objectContaining({ id: 'room2', playerCount: 1 })
                ])
            });
        });

        it('should handle errors gracefully', () => {
            const mockSocket = {
                id: 'test-socket-id',
                emit: jest.fn()
            } as any;

            // Mock roomManager to throw error
            jest.spyOn(roomManager, 'getAvailableRooms').mockImplementation(() => {
                throw new Error('Test error');
            });

            lobbyHandlers.sendRoomListToClient(mockSocket);

            expect(mockSocket.emit).toHaveBeenCalledWith('error', {
                message: 'Failed to get room list'
            });
        });
    });

    describe('broadcastRoomList', () => {
        it('should broadcast room list to all lobby clients', () => {
            const mockSocket1 = {
                id: 'socket1',
                emit: jest.fn()
            } as any;
            const mockSocket2 = {
                id: 'socket2',
                emit: jest.fn()
            } as any;

            // Add clients to lobby
            lobbyHandlers.handleEnterLobby(mockSocket1);
            lobbyHandlers.handleEnterLobby(mockSocket2);

            // Create a test room
            const player: Player = {
                id: 'player1',
                name: 'Player 1',
                ready: false,
                role: null,
                socketId: 'socket1'
            };
            roomManager.createRoomWithPlayer('test-room', player);

            // Mock io.sockets.sockets.get to return our mock sockets
            const mockIo = {
                sockets: {
                    sockets: {
                        get: jest.fn((id: string) => {
                            if (id === 'socket1') return mockSocket1;
                            if (id === 'socket2') return mockSocket2;
                            return null;
                        })
                    }
                }
            };

            lobbyHandlers.broadcastRoomList(mockIo as any);

            expect(mockSocket1.emit).toHaveBeenCalledWith('room_list', {
                rooms: expect.arrayContaining([
                    expect.objectContaining({ id: 'test-room', playerCount: 1 })
                ])
            });
            expect(mockSocket2.emit).toHaveBeenCalledWith('room_list', {
                rooms: expect.arrayContaining([
                    expect.objectContaining({ id: 'test-room', playerCount: 1 })
                ])
            });
        });

        it('should handle missing socket gracefully', () => {
            const mockSocket = {
                id: 'socket1',
                emit: jest.fn()
            } as any;

            // Add client to lobby
            lobbyHandlers.handleEnterLobby(mockSocket);

            // Mock io.sockets.sockets.get to return null (socket not found)
            const mockIo = {
                sockets: {
                    sockets: {
                        get: jest.fn(() => null)
                    }
                }
            };

            // Should not throw error
            expect(() => {
                lobbyHandlers.broadcastRoomList(mockIo as any);
            }).not.toThrow();
        });
    });

    describe('lobby client tracking', () => {
        it('should track multiple clients correctly', () => {
            const mockSocket1 = { id: 'socket1', emit: jest.fn() } as any;
            const mockSocket2 = { id: 'socket2', emit: jest.fn() } as any;
            const mockSocket3 = { id: 'socket3', emit: jest.fn() } as any;

            // Add clients to lobby
            lobbyHandlers.handleEnterLobby(mockSocket1);
            lobbyHandlers.handleEnterLobby(mockSocket2);
            lobbyHandlers.handleEnterLobby(mockSocket3);

            expect(lobbyHandlers.getLobbyClientCount()).toBe(3);
            expect(lobbyHandlers.isClientInLobby('socket1')).toBe(true);
            expect(lobbyHandlers.isClientInLobby('socket2')).toBe(true);
            expect(lobbyHandlers.isClientInLobby('socket3')).toBe(true);

            // Remove one client
            lobbyHandlers.handleLeaveLobby(mockSocket2);

            expect(lobbyHandlers.getLobbyClientCount()).toBe(2);
            expect(lobbyHandlers.isClientInLobby('socket1')).toBe(true);
            expect(lobbyHandlers.isClientInLobby('socket2')).toBe(false);
            expect(lobbyHandlers.isClientInLobby('socket3')).toBe(true);
        });
    });
}); 