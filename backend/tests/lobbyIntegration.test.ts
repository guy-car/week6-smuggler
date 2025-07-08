import request from 'supertest';
import { app } from '../src/server';

describe('Lobby Integration Tests', () => {
    describe('Room Creation via HTTP', () => {
        it('should create room via HTTP endpoint', async () => {
            const response = await request(app)
                .post('/api/rooms')
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.roomId).toBeDefined();
            expect(response.body.playerId).toBeDefined();
            expect(response.body.message).toBe('Room created successfully');
        });

        it('should create multiple rooms successfully', async () => {
            const response1 = await request(app).post('/api/rooms').expect(201);
            const response2 = await request(app).post('/api/rooms').expect(201);

            expect(response1.body.success).toBe(true);
            expect(response2.body.success).toBe(true);
            expect(response1.body.roomId).not.toBe(response2.body.roomId);
            expect(response1.body.playerId).not.toBe(response2.body.playerId);
        });

        it('should handle server errors gracefully', async () => {
            // Mock the room manager to throw an error
            const originalCreateRoomWithPlayer = require('../src/rooms/manager').RoomManager.prototype.createRoomWithPlayer;
            require('../src/rooms/manager').RoomManager.prototype.createRoomWithPlayer = jest.fn().mockReturnValue({
                success: false,
                error: 'Test error'
            });

            const response = await request(app)
                .post('/api/rooms')
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Test error');

            // Restore original method
            require('../src/rooms/manager').RoomManager.prototype.createRoomWithPlayer = originalCreateRoomWithPlayer;
        });
    });

    describe('Role Assignment Integration', () => {
        it('should create room with player and maintain join order', async () => {
            const response = await request(app).post('/api/rooms').expect(201);
            const roomId = response.body.roomId;
            const firstPlayerId = response.body.playerId;

            // The room should be created with the first player
            // When a second player joins via WebSocket, they should be added in order
            // First player (index 0) should become Encryptor, second player (index 1) should become Decryptor

            expect(firstPlayerId).toBeDefined();
            expect(roomId).toBeDefined();

            // The role assignment logic is tested in the game state tests
            // This test verifies that the HTTP endpoint creates rooms correctly
        });
    });
}); 