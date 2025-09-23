/**
 * Structured logging utility for the MCP Color Server
 */

import { LogEntry } from '../types/index';

export class Logger {
  private static instance: Logger;
  private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'warn';

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.logLevel = level;
  }

  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private createLogEntry(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    options?: {
      tool?: string;
      executionTime?: number;
      error?: Error;
    }
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    if (options?.tool !== undefined) {
      entry.tool = options.tool;
    }
    if (options?.executionTime !== undefined) {
      entry.executionTime = options.executionTime;
    }
    if (options?.error !== undefined) {
      entry.error = options.error;
    }

    return entry;
  }

  private formatLogEntry(entry: LogEntry): string {
    const parts = [`[${entry.timestamp}]`, `[${entry.level.toUpperCase()}]`];

    if (entry.tool) {
      parts.push(`[${entry.tool}]`);
    }

    parts.push(entry.message);

    if (entry.executionTime !== undefined) {
      parts.push(`(${entry.executionTime}ms)`);
    }

    if (entry.error) {
      parts.push(`Error: ${entry.error.message}`);
      if (entry.error.stack) {
        parts.push(`Stack: ${entry.error.stack}`);
      }
    }

    return parts.join(' ');
  }

  public debug(
    message: string,
    options?: { tool?: string; executionTime?: number; [key: string]: unknown }
  ): void {
    if (!this.shouldLog('debug')) return;

    const entry = this.createLogEntry('debug', message, options);
    // eslint-disable-next-line no-console
    console.debug(this.formatLogEntry(entry));
  }

  public info(
    message: string,
    options?: { tool?: string; executionTime?: number; [key: string]: unknown }
  ): void {
    if (!this.shouldLog('info')) return;

    const entry = this.createLogEntry('info', message, options);
    // eslint-disable-next-line no-console
    console.info(this.formatLogEntry(entry));
  }

  public warn(
    message: string,
    options?: {
      tool?: string;
      executionTime?: number;
      error?: Error;
      [key: string]: unknown;
    }
  ): void {
    if (!this.shouldLog('warn')) return;

    const entry = this.createLogEntry('warn', message, options);
    // eslint-disable-next-line no-console
    console.warn(this.formatLogEntry(entry));
  }

  public error(
    message: string,
    options?: { tool?: string; executionTime?: number; error?: Error }
  ): void {
    if (!this.shouldLog('error')) return;

    const entry = this.createLogEntry('error', message, options);
    // eslint-disable-next-line no-console
    console.error(this.formatLogEntry(entry));
  }

  public logToolExecution(
    tool: string,
    message: string,
    executionTime: number,
    level: 'debug' | 'info' | 'warn' | 'error' = 'info'
  ): void {
    this[level](message, { tool, executionTime });
  }

  public logError(message: string, error: Error, tool?: string): void {
    const options: { error: Error; tool?: string } = { error };
    if (tool !== undefined) {
      options.tool = tool;
    }
    this.error(message, options);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
