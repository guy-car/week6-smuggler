import { Socket } from 'socket.io';
import { RoomManager } from '../src/rooms/manager';
import { TypingHandlers } from '../src/socket/handlers/typingHandlers';
import { Player } from '../src/types';

// Mock Socket.IO
const mockSocket = {
    id: 'test-socket-id',
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    join: jest.fn(),
    leave: jest.fn()
} as unknown as Socket;

describe('TypingHandlers', () => {
    let roomManager: RoomManager;
    let typingHandlers: TypingHandlers;
    let mockPlayer: Player;

    beforeEach(() => {
        roomManager = new RoomManager();
        typingHandlers = new TypingHandlers(roomManager);
        mockPlayer = {
            id: 'test-player-id',
            name: 'Test Player',
            ready: false,
            role: 'encoder',
            socketId: 'test-socket-id'
        };

        // Clear all mocks
        jest.clearAllMocks();
    });

    afterEach(() => {
        typingHandlers.cleanup();
    });

    describe('handleTypingStart', () => {
        it('should handle valid typing start event', () => {
            // Create a room first
            const roomId = 'test-room';
            roomManager.joinRoom(roomId, mockPlayer);

            const data = { roomId, role: 'encoder' };
            typingHandlers.handleTypingStart(mockSocket, data);

            // Check that typing state was set
            const typingState = roomManager.getTypingState(roomId);
            expect(typingState).toBeTruthy();
            expect(typingState?.role).toBe('encoder');
            expect(typingState?.isTyping).toBe(true);

            // Check that typing indicator was broadcast
            expect(mockSocket.to).toHaveBeenCalledWith(roomId);
            expect(mockSocket.emit).toHaveBeenCalledWith('typing:indicator', {
                role: 'encoder',
                isTyping: true
            });
        });

        it('should handle typing start for decoder role', () => {
            const roomId = 'test-room';
            roomManager.joinRoom(roomId, mockPlayer);

            const data = { roomId, role: 'decoder' };
            typingHandlers.handleTypingStart(mockSocket, data);

            const typingState = roomManager.getTypingState(roomId);
            expect(typingState?.role).toBe('decoder');
            expect(typingState?.isTyping).toBe(true);
        });

        it('should emit error for missing roomId', () => {
            const data = { roomId: '', role: 'encoder' };
            typingHandlers.handleTypingStart(mockSocket, data);

            expect(mockSocket.emit).toHaveBeenCalledWith('error', {
                message: 'Room ID and role are required'
            });
        });

        it('should emit error for missing role', () => {
            const data = { roomId: 'test-room', role: '' };
            typingHandlers.handleTypingStart(mockSocket, data);

            expect(mockSocket.emit).toHaveBeenCalledWith('error', {
                message: 'Room ID and role are required'
            });
        });

        it('should emit error for invalid role', () => {
            const data = { roomId: 'test-room', role: 'invalid' };
            typingHandlers.handleTypingStart(mockSocket, data);

            expect(mockSocket.emit).toHaveBeenCalledWith('error', {
                message: 'Role must be either "encoder" or "decoder"'
            });
        });

        it('should emit error for non-existent room', () => {
            const data = { roomId: 'non-existent-room', role: 'encoder' };
            typingHandlers.handleTypingStart(mockSocket, data);

            expect(mockSocket.emit).toHaveBeenCalledWith('error', {
                message: 'Room not found'
            });
        });
    });

    describe('handleTypingStop', () => {
        it('should handle valid typing stop event', () => {
            const roomId = 'test-room';
            roomManager.joinRoom(roomId, mockPlayer);

            // Set initial typing state
            roomManager.setTypingState(roomId, 'encoder', true);

            const data = { roomId, role: 'encoder' };
            typingHandlers.handleTypingStop(mockSocket, data);

            // Check that typing state was cleared
            const typingState = roomManager.getTypingState(roomId);
            expect(typingState).toBeNull();

            // Check that typing indicator was broadcast
            expect(mockSocket.to).toHaveBeenCalledWith(roomId);
            expect(mockSocket.emit).toHaveBeenCalledWith('typing:indicator', {
                role: 'encoder',
                isTyping: false
            });
        });

        it('should handle typing stop for decoder role', () => {
            const roomId = 'test-room';
            roomManager.joinRoom(roomId, mockPlayer);
            roomManager.setTypingState(roomId, 'decoder', true);

            const data = { roomId, role: 'decoder' };
            typingHandlers.handleTypingStop(mockSocket, data);

            const typingState = roomManager.getTypingState(roomId);
            expect(typingState).toBeNull();
        });

        it('should emit error for missing roomId', () => {
            const data = { roomId: '', role: 'encoder' };
            typingHandlers.handleTypingStop(mockSocket, data);

            expect(mockSocket.emit).toHaveBeenCalledWith('error', {
                message: 'Room ID and role are required'
            });
        });

        it('should emit error for invalid role', () => {
            const data = { roomId: 'test-room', role: 'invalid' };
            typingHandlers.handleTypingStop(mockSocket, data);

            expect(mockSocket.emit).toHaveBeenCalledWith('error', {
                message: 'Role must be either "encoder" or "decoder"'
            });
        });
    });

    describe('setTypingTimeout', () => {
        it('should set typing timeout and clear after 1 second', (done) => {
            const roomId = 'test-room';
            roomManager.joinRoom(roomId, mockPlayer);
            roomManager.setTypingState(roomId, 'encoder', true);

            typingHandlers.setTypingTimeout(roomId, 'encoder');

            // Wait for timeout to expire
            setTimeout(() => {
                const typingState = roomManager.getTypingState(roomId);
                expect(typingState).toBeNull();
                done();
            }, 1100); // Wait slightly longer than 1 second
        });

        it('should clear existing timeout when setting new one', () => {
            const roomId = 'test-room';
            roomManager.joinRoom(roomId, mockPlayer);

            // Set first timeout
            typingHandlers.setTypingTimeout(roomId, 'encoder');

            // Set second timeout immediately (should clear first)
            typingHandlers.setTypingTimeout(roomId, 'decoder');

            // Both should work without conflicts
            expect(roomManager.getTypingState(roomId)).toBeNull();
        });
    });

    describe('handleDisconnect', () => {
        it('should clear typing state when player disconnects', () => {
            const roomId = 'test-room';
            roomManager.joinRoom(roomId, mockPlayer);
            roomManager.setTypingState(roomId, 'encoder', true);

            typingHandlers.handleDisconnect(mockSocket);

            const typingState = roomManager.getTypingState(roomId);
            expect(typingState).toBeNull();
        });

        it('should not clear typing state for different player', () => {
            const roomId = 'test-room';
            const player1 = { ...mockPlayer, socketId: 'socket-1', role: 'encoder' as const };
            const player2 = { ...mockPlayer, socketId: 'socket-2', role: 'decoder' as const };

            roomManager.joinRoom(roomId, player1);
            roomManager.joinRoom(roomId, player2);
            roomManager.setTypingState(roomId, 'decoder', true);

            // Disconnect player1 (encoder)
            const mockSocket1 = { ...mockSocket, id: 'socket-1' } as Socket;
            typingHandlers.handleDisconnect(mockSocket1);

            // Typing state should remain since decoder is still connected
            const typingState = roomManager.getTypingState(roomId);
            expect(typingState).toBeTruthy();
            expect(typingState?.role).toBe('decoder');
        });
    });

    describe('cleanup', () => {
        it('should clear all typing timeouts', () => {
            const roomId1 = 'test-room-1';
            const roomId2 = 'test-room-2';

            roomManager.joinRoom(roomId1, mockPlayer);
            roomManager.joinRoom(roomId2, mockPlayer);

            roomManager.setTypingState(roomId1, 'encoder', true);
            roomManager.setTypingState(roomId2, 'decoder', true);

            typingHandlers.setTypingTimeout(roomId1, 'encoder');
            typingHandlers.setTypingTimeout(roomId2, 'decoder');

            typingHandlers.cleanup();

            // Cleanup only clears timeouts, not typing state
            // Typing states should still exist
            expect(roomManager.getTypingState(roomId1)).toBeTruthy();
            expect(roomManager.getTypingState(roomId2)).toBeTruthy();
        });
    });

    describe('integration with room manager', () => {
        it('should work with room manager typing state methods', () => {
            const roomId = 'test-room';
            roomManager.joinRoom(roomId, mockPlayer);

            // Test isTypingStateExpired
            expect(roomManager.isTypingStateExpired(roomId)).toBe(true);

            // Set typing state
            roomManager.setTypingState(roomId, 'encoder', true);
            expect(roomManager.isTypingStateExpired(roomId)).toBe(false);

            // Wait for expiration
            setTimeout(() => {
                expect(roomManager.isTypingStateExpired(roomId)).toBe(true);
            }, 1100);
        });
    });
}); 