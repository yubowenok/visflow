module.exports = {
  verbose: true,
  testEnvironment: 'node',
  watchman: false,
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  moduleNameMapper: {
    // Jest tests must use @src alias, while src code may use @/* as src/*.
    '^@src(.*)$': '<rootDir>/src$1',
  },
};
