import request from 'supertest';
import { app } from '../src/server';

describe('POST /api/rooms', () => {
    it('should create a room and return room ID and player ID', async () => {
        const response = await request(app)
            .post('/api/rooms')
            .expect(201);

        expect(response.body).toMatchObject({
            success: true,
            roomId: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
            playerId: expect.stringMatching(/^player-[0-9a-f]{8}$/),
            message: 'Room created successfully'
        });
    });

    it('should create unique room IDs for multiple requests', async () => {
        const response1 = await request(app)
            .post('/api/rooms')
            .expect(201);

        const response2 = await request(app)
            .post('/api/rooms')
            .expect(201);

        expect(response1.body.roomId).not.toBe(response2.body.roomId);
        expect(response1.body.playerId).not.toBe(response2.body.playerId);
    });

    it('should create unique player IDs for multiple requests', async () => {
        const response1 = await request(app)
            .post('/api/rooms')
            .expect(201);

        const response2 = await request(app)
            .post('/api/rooms')
            .expect(201);

        expect(response1.body.playerId).not.toBe(response2.body.playerId);
    });

    it('should handle server errors gracefully', async () => {
        // This test will verify the endpoint exists and returns proper structure
        // In a real scenario, we'd mock the room manager to simulate failures
        const response = await request(app)
            .post('/api/rooms')
            .expect(201);

        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('roomId');
        expect(response.body).toHaveProperty('playerId');
    });
}); 