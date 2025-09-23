/**
 * Jest setup file that runs before all tests
 * This ensures NODE_ENV is set to 'test' for proper environment detection
 */

// Set NODE_ENV to test to prevent intervals from starting
process.env['NODE_ENV'] = 'test';

// Set logger to only show errors during tests to reduce noise
import { logger } from '../src/utils/logger';
logger.setLogLevel('error');

// Suppress console output during tests unless explicitly needed
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug,
};

// Only suppress if not in verbose mode
if (!process.argv.includes('--verbose')) {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.info = jest.fn();
  console.debug = jest.fn();
}

// Restore console for specific tests that need it
(global as any).restoreConsole = () => {
  Object.assign(console, originalConsole);
};

(global as any).suppressConsole = () => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.info = jest.fn();
  console.debug = jest.fn();
};
