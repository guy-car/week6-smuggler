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