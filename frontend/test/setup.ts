import '@testing-library/jest-native/extend-expect';

// Mock expo-router
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    }),
    useLocalSearchParams: () => ({}),
    useGlobalSearchParams: () => ({}),
}));

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        on: jest.fn(),
        emit: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
        id: 'mock-socket-id',
    })),
}));

// Mock WebSocket service
jest.mock('../services/websocket', () => ({
    getSocket: jest.fn(),
    disconnectSocket: jest.fn(),
    createRoom: jest.fn(),
    joinRoom: jest.fn(),
    leaveRoom: jest.fn(),
    setPlayerReady: jest.fn(),
    getAvailableRooms: jest.fn(),
    sendMessage: jest.fn(),
    submitGuess: jest.fn(),
    submitWord: jest.fn(),
    startGame: jest.fn(),
}));

// Mock React Native Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
    alert: jest.fn(),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Suppress console warnings during tests
const originalWarn = console.warn;
beforeAll(() => {
    console.warn = (...args: any[]) => {
        if (
            typeof args[0] === 'string' &&
            args[0].includes('Warning: ReactDOM.render is no longer supported')
        ) {
            return;
        }
        originalWarn.call(console, ...args);
    };
});

afterAll(() => {
    console.warn = originalWarn;
}); 