export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  globalTeardown: '<rootDir>/tests/teardown.ts',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/server.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 76,
      functions: 92,
      lines: 89,
      statements: 89,
    },
  },
  // Set a timeout for tests to prevent hanging
  testTimeout: 60000, // Increased for CI environments
  // Detect open handles to help debug hanging tests
  detectOpenHandles: true,
  // Force Jest to exit after tests complete - only use as last resort
  forceExit: true,
  // Clear all timers after each test
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  resetModules: true,
  // Set NODE_ENV to test for proper environment detection
  setupFiles: ['<rootDir>/tests/jest-setup.ts'],
  // Additional options to handle async operations
  maxWorkers: 1, // Run tests serially to avoid resource conflicts
  // Ensure Jest exits cleanly
  openHandlesTimeout: 1000,
  // Workaround for hanging tests
  workerIdleMemoryLimit: '512MB',
};
