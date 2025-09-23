import baseConfig from './jest.config.js';

export default {
  ...baseConfig,
  // CI-specific overrides
  testTimeout: 60000, // 1 minute for CI - shorter timeout
  maxWorkers: 1, // Single worker in CI to avoid resource conflicts
  detectOpenHandles: false, // Disable in CI to prevent hanging
  forceExit: true, // Force exit in CI

  // More aggressive cleanup for CI
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  resetModules: true,

  // Reduce memory usage
  workerIdleMemoryLimit: '128MB',

  // Disable cache in CI to prevent issues
  cache: false,

  // Set explicit environment variables
  setupFiles: ['<rootDir>/tests/jest-setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  globalTeardown: '<rootDir>/tests/teardown.ts',

  // Align coverage thresholds with base config
  coverageThreshold: {
    global: {
      branches: 76,
      functions: 92,
      lines: 89,
      statements: 89,
    },
  },

  // Additional CI-specific settings
  verbose: false, // Reduce output in CI
  silent: true, // Suppress console output
  bail: 1, // Stop on first test failure to save time
};
