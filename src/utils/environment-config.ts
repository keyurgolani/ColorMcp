/**
 * Environment configuration management for MCP Color Server
 * Handles environment variables and provides safe defaults
 */

import { join } from 'path';
import { homedir, tmpdir } from 'os';
import { existsSync } from 'fs';
import { logger } from './logger';

export interface EnvironmentConfig {
  visualizationsDir: string;
  maxFileAge: number; // in milliseconds
  maxDirectorySize: number; // in bytes
  enableCleanup: boolean;
  fileNamePrefix: string;
}

export class EnvironmentConfigManager {
  private static instance: EnvironmentConfigManager;
  private config: EnvironmentConfig;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  public static getInstance(): EnvironmentConfigManager {
    if (!EnvironmentConfigManager.instance) {
      EnvironmentConfigManager.instance = new EnvironmentConfigManager();
    }
    return EnvironmentConfigManager.instance;
  }

  private loadConfiguration(): EnvironmentConfig {
    const visualizationsDir = this.getVisualizationsDirectory();

    return {
      visualizationsDir,
      maxFileAge: this.parseNumber(
        process.env['COLOR_MCP_MAX_FILE_AGE'],
        24 * 60 * 60 * 1000
      ), // 24 hours default
      maxDirectorySize: this.parseNumber(
        process.env['COLOR_MCP_MAX_DIR_SIZE'],
        1024 * 1024 * 1024
      ), // 1GB default
      enableCleanup: this.parseBoolean(
        process.env['COLOR_MCP_ENABLE_CLEANUP'],
        true
      ),
      fileNamePrefix: process.env['COLOR_MCP_FILE_PREFIX'] || 'mcp-color',
    };
  }

  private getVisualizationsDirectory(): string {
    // Check if we're in test mode with file output enabled
    const isTestEnvironment =
      process.env['NODE_ENV'] === 'test' ||
      process.env['JEST_WORKER_ID'] !== undefined;

    if (
      isTestEnvironment &&
      process.env['TEST_ENABLE_FILE_OUTPUT'] === 'true'
    ) {
      const testDir = process.env['TEST_OUTPUT_DIR'] || './test-output';
      logger.info(`Using test output directory: ${testDir}`);
      return testDir;
    }

    const envDir = process.env['COLOR_MCP_VISUALIZATIONS_DIR'];

    if (envDir) {
      // Validate the provided directory
      if (this.isValidDirectory(envDir)) {
        logger.info(`Using configured visualizations directory: ${envDir}`);
        return envDir;
      } else {
        logger.warn(
          `Invalid visualizations directory: ${envDir}, falling back to default`
        );
      }
    }

    // Try user's home directory first
    const homeDir = join(homedir(), '.mcp-color-server', 'visualizations');
    if (this.isValidDirectory(homeDir) || this.canCreateDirectory(homeDir)) {
      logger.info(`Using home directory for visualizations: ${homeDir}`);
      return homeDir;
    }

    // Fall back to system temp directory
    const tempDir = join(tmpdir(), 'mcp-color-server', 'visualizations');
    logger.info(`Using temporary directory for visualizations: ${tempDir}`);
    return tempDir;
  }

  private isValidDirectory(path: string): boolean {
    try {
      // Check if path exists and is a directory
      if (existsSync(path)) {
        const stats = require('fs').statSync(path);
        return stats.isDirectory();
      }
      return false;
    } catch (error) {
      logger.debug(`Directory validation failed for ${path}:`, {
        error: error as Error,
      });
      return false;
    }
  }

  private canCreateDirectory(path: string): boolean {
    try {
      // Check if we can create the directory by testing parent directory permissions
      const parentDir = require('path').dirname(path);
      if (existsSync(parentDir)) {
        const stats = require('fs').statSync(parentDir);
        return stats.isDirectory();
      }
      return this.canCreateDirectory(parentDir);
    } catch (error) {
      logger.debug(`Cannot create directory ${path}:`, {
        error: error as Error,
      });
      return false;
    }
  }

  private parseNumber(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;

    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 0) {
      logger.warn(
        `Invalid number value: ${value}, using default: ${defaultValue}`
      );
      return defaultValue;
    }

    return parsed;
  }

  private parseBoolean(
    value: string | undefined,
    defaultValue: boolean
  ): boolean {
    if (!value) return defaultValue;

    const lowerValue = value.toLowerCase();
    if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') {
      return true;
    } else if (
      lowerValue === 'false' ||
      lowerValue === '0' ||
      lowerValue === 'no'
    ) {
      return false;
    }

    logger.warn(
      `Invalid boolean value: ${value}, using default: ${defaultValue}`
    );
    return defaultValue;
  }

  public getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  public getVisualizationsDir(): string {
    return this.config.visualizationsDir;
  }

  public getMaxFileAge(): number {
    return this.config.maxFileAge;
  }

  public getMaxDirectorySize(): number {
    return this.config.maxDirectorySize;
  }

  public isCleanupEnabled(): boolean {
    return this.config.enableCleanup;
  }

  public getFileNamePrefix(): string {
    return this.config.fileNamePrefix;
  }

  public validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate visualizations directory
    if (!this.config.visualizationsDir) {
      errors.push('Visualizations directory is not configured');
    }

    // Validate numeric values
    if (this.config.maxFileAge <= 0) {
      errors.push('Max file age must be positive');
    }

    if (this.config.maxDirectorySize <= 0) {
      errors.push('Max directory size must be positive');
    }

    // Validate file name prefix
    if (
      !this.config.fileNamePrefix ||
      !/^[a-zA-Z0-9-_]+$/.test(this.config.fileNamePrefix)
    ) {
      errors.push(
        'File name prefix must contain only alphanumeric characters, hyphens, and underscores'
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public reloadConfiguration(): void {
    this.config = this.loadConfiguration();
    logger.info('Environment configuration reloaded');
  }
}

// Export singleton instance
export const environmentConfig = EnvironmentConfigManager.getInstance();
