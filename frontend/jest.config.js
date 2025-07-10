module.exports = {
    preset: 'jest-expo',
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
    ],
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    testMatch: ['**/test/**/*.test.(ts|tsx|js|jsx)'],
    collectCoverageFrom: [
        'app/**/*.{ts,tsx}',
        'store/**/*.{ts,tsx}',
        'services/**/*.{ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**'
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
    }
}; 