import { useGameStore } from '../store/gameStore';

// Mock socket.io-client
jest.mock('socket.io-client', () => {
    const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
        id: 'test-socket-id',
    };

    return jest.fn(() => mockSocket);
});

// Mock console methods
const originalConsole = { ...console };
beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
});

afterAll(() => {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
});

describe('WebSocket Retry Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useGameStore.setState({
            connected: false,
            error: null,
            socketId: null,
        });
    });

    describe('Connection Error Handling', () => {
        it('provides specific error message for network connection failures', () => {
            const { getSocket } = require('../services/websocket');
            const socket = getSocket();

            // Simulate connection error
            const connectErrorHandler = socket.on.mock.calls.find(
                (call: any) => call[0] === 'connect_error'
            )[1];

            const mockError = {
                message: 'Failed to connect to /192.168.1.100:3000',
                type: 'TransportError',
            };

            connectErrorHandler(mockError);

            const state = useGameStore.getState();
            expect(state.error).toContain('Cannot reach server at');
            expect(state.error).toContain('Check if the server is running');
            expect(state.connected).toBe(false);
        });

        it('provides specific error message for timeout errors', () => {
            const { getSocket } = require('../services/websocket');
            const socket = getSocket();

            const connectErrorHandler = socket.on.mock.calls.find(
                (call: any) => call[0] === 'connect_error'
            )[1];

            const mockError = {
                message: 'Connection timeout after 10000ms',
                type: 'TimeoutError',
            };

            connectErrorHandler(mockError);

            const state = useGameStore.getState();
            expect(state.error).toContain('Connection timed out');
            expect(state.error).toContain('server may be overloaded');
        });

        it('provides specific error message for CORS errors', () => {
            const { getSocket } = require('../services/websocket');
            const socket = getSocket();

            const connectErrorHandler = socket.on.mock.calls.find(
                (call: any) => call[0] === 'connect_error'
            )[1];

            const mockError = {
                message: 'CORS policy violation: No \'Access-Control-Allow-Origin\' header',
                type: 'CORSError',
            };

            connectErrorHandler(mockError);

            const state = useGameStore.getState();
            expect(state.error).toContain('CORS policy error');
            expect(state.error).toContain('security restrictions');
        });

        it('provides specific error message for TransportError', () => {
            const { getSocket } = require('../services/websocket');
            const socket = getSocket();

            const connectErrorHandler = socket.on.mock.calls.find(
                (call: any) => call[0] === 'connect_error'
            )[1];

            const mockError = {
                message: 'Network transport failed',
                type: 'TransportError',
            };

            connectErrorHandler(mockError);

            const state = useGameStore.getState();
            expect(state.error).toContain('Network transport error');
            expect(state.error).toContain('Cannot establish connection');
        });

        it('provides max retries message after multiple failures', () => {
            const { getSocket } = require('../services/websocket');
            const socket = getSocket();

            const connectErrorHandler = socket.on.mock.calls.find(
                (call: any) => call[0] === 'connect_error'
            )[1];

            // Simulate multiple connection errors
            for (let i = 0; i < 4; i++) {
                const mockError = {
                    message: 'Connection failed',
                    type: 'NetworkError',
                };
                connectErrorHandler(mockError);
            }

            const state = useGameStore.getState();
            expect(state.error).toContain('Connection failed after 3 attempts');
        });
    });

    describe('Disconnect Error Handling', () => {
        it('provides specific message for server disconnect', () => {
            const { getSocket } = require('../services/websocket');
            const socket = getSocket();

            const disconnectHandler = socket.on.mock.calls.find(
                (call: any) => call[0] === 'disconnect'
            )[1];

            disconnectHandler('io server disconnect');

            const state = useGameStore.getState();
            expect(state.error).toBe('Server disconnected. Please try reconnecting.');
            expect(state.connected).toBe(false);
        });

        it('provides specific message for client disconnect', () => {
            const { getSocket } = require('../services/websocket');
            const socket = getSocket();

            const disconnectHandler = socket.on.mock.calls.find(
                (call: any) => call[0] === 'disconnect'
            )[1];

            disconnectHandler('io client disconnect');

            const state = useGameStore.getState();
            expect(state.error).toBe('Connection was closed by the client.');
        });

        it('provides specific message for transport close', () => {
            const { getSocket } = require('../services/websocket');
            const socket = getSocket();

            const disconnectHandler = socket.on.mock.calls.find(
                (call: any) => call[0] === 'disconnect'
            )[1];

            disconnectHandler('transport close');

            const state = useGameStore.getState();
            expect(state.error).toBe('Network connection was lost. Check your internet connection.');
        });

        it('provides generic message for unknown disconnect reasons', () => {
            const { getSocket } = require('../services/websocket');
            const socket = getSocket();

            const disconnectHandler = socket.on.mock.calls.find(
                (call: any) => call[0] === 'disconnect'
            )[1];

            disconnectHandler('unknown reason');

            const state = useGameStore.getState();
            expect(state.error).toBe('Connection lost: unknown reason');
        });
    });

    describe('Reconnection Logic', () => {
        it('shows reconnection attempt messages', () => {
            const { getSocket } = require('../services/websocket');
            const socket = getSocket();

            const reconnectAttemptHandler = socket.on.mock.calls.find(
                (call: any) => call[0] === 'reconnect_attempt'
            )[1];

            reconnectAttemptHandler(2);

            const state = useGameStore.getState();
            expect(state.error).toBe('Reconnecting... (attempt 2/3)');
        });

        it('shows reconnection failed message', () => {
            const { getSocket } = require('../services/websocket');
            const socket = getSocket();

            const reconnectFailedHandler = socket.on.mock.calls.find(
                (call: any) => call[0] === 'reconnect_failed'
            )[1];

            reconnectFailedHandler();

            const state = useGameStore.getState();
            expect(state.error).toBe('Failed to reconnect after multiple attempts. Please check your connection and try again.');
        });

        it('resets state on successful reconnection', () => {
            const { getSocket } = require('../services/websocket');
            const socket = getSocket();

            // Set initial error state
            useGameStore.setState({
                error: 'Connection failed',
                connected: false,
            });

            const reconnectHandler = socket.on.mock.calls.find(
                (call: any) => call[0] === 'reconnect'
            )[1];

            reconnectHandler(2);

            const state = useGameStore.getState();
            expect(state.error).toBe(null);
            expect(state.connected).toBe(true);
        });
    });

    describe('Successful Connection', () => {
        it('resets error state and sets connected on successful connection', () => {
            const { getSocket } = require('../services/websocket');
            const socket = getSocket();

            // Set initial error state
            useGameStore.setState({
                error: 'Previous error',
                connected: false,
            });

            const connectHandler = socket.on.mock.calls.find(
                (call: any) => call[0] === 'connect'
            )[1];

            connectHandler();

            const state = useGameStore.getState();
            expect(state.error).toBe(null);
            expect(state.connected).toBe(true);
            expect(state.socketId).toBe('test-socket-id');
        });
    });

    describe('Socket Configuration', () => {
        it('configures socket with retry options', () => {
            const io = require('socket.io-client');
            const { getSocket } = require('../services/websocket');

            getSocket();

            expect(io).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    reconnection: true,
                    reconnectionAttempts: 3,
                    reconnectionDelay: 2000,
                    timeout: 10000,
                })
            );
        });
    });
}); 