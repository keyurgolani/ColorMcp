#!/usr/bin/env node

/**
 * MCP Color Server entry point
 */

import { ColorServer } from './server';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  try {
    // Set log level from environment variable
    const logLevel =
      (process.env['LOG_LEVEL'] as 'debug' | 'info' | 'warn' | 'error') ||
      'info';
    logger.setLogLevel(logLevel);

    logger.info('Starting MCP Color Server...');

    // Create and start the server
    const server = new ColorServer();
    await server.start();
  } catch (error) {
    logger.error('Failed to start MCP Color Server', { error: error as Error });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', reason => {
  logger.error('Unhandled promise rejection', {
    error: reason instanceof Error ? reason : new Error(String(reason)),
  });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

// Start the server
main().catch(error => {
  logger.error('Fatal error during startup', { error });
  process.exit(1);
});
