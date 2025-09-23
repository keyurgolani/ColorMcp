/**
 * Tests for the logger utility
 */

import { Logger, logger } from '../../src/utils/logger';

// Mock console methods
const originalConsole = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

describe('Logger', () => {
  let mockConsole: {
    debug: jest.Mock;
    info: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
  };

  beforeEach(() => {
    mockConsole = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    console.debug = mockConsole.debug;
    console.info = mockConsole.info;
    console.warn = mockConsole.warn;
    console.error = mockConsole.error;
  });

  afterEach(() => {
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;

    jest.clearAllMocks();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const logger1 = Logger.getInstance();
      const logger2 = Logger.getInstance();

      expect(logger1).toBe(logger2);
      expect(logger1).toBe(logger);
    });
  });

  describe('log levels', () => {
    it('should respect log level filtering', () => {
      logger.setLogLevel('warn');

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
    });

    it('should log all levels when set to debug', () => {
      logger.setLogLevel('debug');

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(mockConsole.debug).toHaveBeenCalledTimes(1);
      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('log formatting', () => {
    beforeEach(() => {
      logger.setLogLevel('debug');
    });

    it('should format basic log messages', () => {
      logger.info('test message');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(
          /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] test message/
        )
      );
    });

    it('should include tool information', () => {
      logger.info('test message', { tool: 'convert_color' });

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[convert_color\] test message/)
      );
    });

    it('should include execution time', () => {
      logger.info('test message', { executionTime: 150 });

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/test message \(150ms\)/)
      );
    });

    it('should include error information', () => {
      const error = new Error('test error');
      logger.error('test message', { error });

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringMatching(/test message Error: test error/)
      );
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      logger.setLogLevel('debug');
    });

    it('should log tool execution', () => {
      logger.logToolExecution('convert_color', 'Tool completed', 100);

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[convert_color\] Tool completed \(100ms\)/)
      );
    });

    it('should log errors with tool context', () => {
      const error = new Error('test error');
      logger.logError('Operation failed', error, 'convert_color');

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringMatching(
          /\[convert_color\] Operation failed Error: test error/
        )
      );
    });
  });
});
