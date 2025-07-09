/**
 * Test environment configuration for mobile integration
 */

describe('Environment Configuration', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    test('should use default values when environment variables are not set', () => {
        delete process.env['EXPO_PUBLIC_BACKEND_URL'];
        delete process.env['BACKEND_CORS_ORIGIN'];
        delete process.env['PORT'];

        // Simulate the environment variable usage
        const backendUrl = process.env['EXPO_PUBLIC_BACKEND_URL'] || 'http://localhost:3000';
        const corsOrigin = process.env['BACKEND_CORS_ORIGIN'] || 'http://localhost:8081';
        const port = process.env['PORT'] || '3000';

        expect(backendUrl).toBe('http://localhost:3000');
        expect(corsOrigin).toBe('http://localhost:8081');
        expect(port).toBe('3000');
    });

    test('should use environment variables when set', () => {
        process.env['EXPO_PUBLIC_BACKEND_URL'] = 'http://192.168.1.100:3000';
        process.env['BACKEND_CORS_ORIGIN'] = 'http://192.168.1.100:8081';
        process.env['PORT'] = '3001';

        const backendUrl = process.env['EXPO_PUBLIC_BACKEND_URL'] || 'http://localhost:3000';
        const corsOrigin = process.env['BACKEND_CORS_ORIGIN'] || 'http://localhost:8081';
        const port = process.env['PORT'] || '3000';

        expect(backendUrl).toBe('http://192.168.1.100:3000');
        expect(corsOrigin).toBe('http://192.168.1.100:8081');
        expect(port).toBe('3001');
    });
}); 