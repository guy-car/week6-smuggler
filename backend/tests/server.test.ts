import request from 'supertest';
import { app } from '../src/server';

describe('Server', () => {
    describe('HTTP Routes', () => {
        it('should return server status on root route', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Smuggler Backend API is running!');
        });

        it('should return health status', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'OK');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('uptime');
            expect(response.body).toHaveProperty('environment');
        });

        it('should handle 404 routes', async () => {
            await request(app)
                .get('/api/nonexistent')
                .expect(404);
        });
    });

    describe('Error Handling', () => {
        it('should handle CORS properly', async () => {
            const response = await request(app)
                .get('/api/health')
                .set('Origin', 'http://localhost:8081')
                .expect(200);

            expect(response.headers['access-control-allow-origin']).toBe('http://localhost:8081');
        });
    });
}); 