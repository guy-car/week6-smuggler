// Mock expo-router
jest.mock('expo-router', () => ({
    router: {
        replace: jest.fn(),
        push: jest.fn(),
        back: jest.fn(),
    },
    useRouter: () => ({
        replace: jest.fn(),
        push: jest.fn(),
        back: jest.fn(),
    }),
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
    expoConfig: {
        extra: {
            backendUrl: 'http://localhost:3000',
        },
    },
}));

// Mock react-native Alert only
jest.mock('react-native', () => {
    const RN = jest.requireActual('react-native');
    return {
        ...RN,
        Alert: {
            alert: jest.fn(),
        },
    };
});

// Global test setup
global.console = {
    ...console,
    error: jest.fn(),
}; 