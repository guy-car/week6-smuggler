module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native|@react-native|@react-navigation|expo(nent)?|@expo(nent)?/.*|@testing-library|@react-native-community|react-clone-referenced-element|@react-native-picker|@react-native-async-storage|@react-native-masked-view|@react-native-segmented-control/segmented-control)"
  ],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
}; 