/**
 * File Output Manager for MCP Color Server
 * Handles file creation, naming, cleanup, and security validation
 */

import { promises as fs, existsSync, statSync } from 'fs';
import { join, basename, extname, resolve, normalize } from 'path';
import { randomBytes } from 'crypto';
import * as fsExtra from 'fs-extra';
import { environmentConfig } from './environment-config';
import { logger } from './logger';

export interface FileMetadata {
  path: string;
  filename: string;
  size: number;
  createdAt: Date;
  type: 'html' | 'png' | 'svg' | 'css' | 'json';
  description?: string | undefined;
}

export interface DirectoryStats {
  totalFiles: number;
  totalSize: number;
  oldestFile?: Date;
  newestFile?: Date;
  filesByType: Record<string, number>;
}

export interface CleanupResult {
  filesRemoved: number;
  bytesFreed: number;
  errors: string[];
}

export class FileOutputManager {
  private static instance: FileOutputManager;
  private initialized = false;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): FileOutputManager {
    if (!FileOutputManager.instance) {
      FileOutputManager.instance = new FileOutputManager();
    }
    return FileOutputManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const config = environmentConfig.getConfig();

      // Validate configuration
      const validation = environmentConfig.validateConfiguration();
      if (!validation.valid) {
        throw new Error(
          `Invalid configuration: ${validation.errors.join(', ')}`
        );
      }

      // Ensure visualizations directory exists
      await this.ensureDirectoryExists(config.visualizationsDir);

      // Set up automatic cleanup if enabled and not in test environment
      const isTestEnvironment =
        process.env['NODE_ENV'] === 'test' ||
        process.env['JEST_WORKER_ID'] !== undefined ||
        process.env['CI'] === 'true' ||
        typeof jest !== 'undefined' ||
        (typeof global !== 'undefined' && 'jest' in global);

      if (config.enableCleanup && !isTestEnvironment) {
        this.setupAutomaticCleanup();
      }

      this.initialized = true;
      logger.info('FileOutputManager initialized successfully', {
        visualizationsDir: config.visualizationsDir,
        cleanupEnabled: config.enableCleanup,
      });
    } catch (error) {
      logger.error('Failed to initialize FileOutputManager', {
        error: error as Error,
      });
      throw error;
    }
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fsExtra.ensureDir(dirPath);

      // Test write permissions
      const testFile = join(dirPath, '.write-test');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);

      logger.debug(`Directory ensured and writable: ${dirPath}`);
    } catch (error) {
      logger.error(`Failed to ensure directory: ${dirPath}`, {
        error: error as Error,
      });
      throw new Error(`Cannot create or write to directory: ${dirPath}`);
    }
  }

  public async saveFile(
    content: string | Buffer,
    type: 'html' | 'png' | 'svg' | 'css' | 'json',
    options: {
      description?: string;
      customName?: string;
      subdirectory?: string;
    } = {}
  ): Promise<FileMetadata> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const config = environmentConfig.getConfig();
      const filename = this.generateFileName(type, options.customName);

      let targetDir = config.visualizationsDir;
      if (options.subdirectory) {
        // Validate subdirectory for security
        const sanitizedSubdir = this.sanitizePathComponent(
          options.subdirectory
        );
        targetDir = join(targetDir, sanitizedSubdir);
        await this.ensureDirectoryExists(targetDir);
      }

      const filePath = join(targetDir, filename);

      // Security validation
      this.validateFilePath(filePath, config.visualizationsDir);

      // Write file
      if (Buffer.isBuffer(content)) {
        await fs.writeFile(filePath, content);
      } else {
        await fs.writeFile(filePath, content, 'utf8');
      }

      // Get file stats
      const stats = await fs.stat(filePath);

      const metadata: FileMetadata = {
        path: filePath,
        filename,
        size: stats.size,
        createdAt: stats.birthtime,
        type,
        description: options.description,
      };

      logger.info('File saved successfully', {
        path: filePath,
        size: stats.size,
        fileType: type,
      });

      return metadata;
    } catch (error) {
      logger.error(`Failed to save file of type ${type}`, {
        error: error as Error,
      });
      throw error;
    }
  }

  private generateFileName(type: string, customName?: string): string {
    const config = environmentConfig.getConfig();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueId = randomBytes(4).toString('hex');

    let baseName: string;
    if (customName) {
      // Sanitize custom name
      baseName = this.sanitizePathComponent(customName);
    } else {
      baseName = `${config.fileNamePrefix}-${type}-${timestamp}-${uniqueId}`;
    }

    // Ensure proper extension
    const extension = this.getFileExtension(type);
    if (!baseName.endsWith(extension)) {
      baseName += extension;
    }

    return baseName;
  }

  private getFileExtension(type: string): string {
    const extensions: Record<string, string> = {
      html: '.html',
      png: '.png',
      svg: '.svg',
      css: '.css',
      json: '.json',
    };
    return extensions[type] || '.txt';
  }

  private sanitizePathComponent(component: string): string {
    // Remove dangerous characters and normalize
    return (
      component
        .replace(/[<>:"/\\|?*]/g, '')
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001F]/g, '') // Remove control characters
        .replace(/^\.+/, '')
        .replace(/\.+$/, '')
        .substring(0, 100) // Limit length
        .trim()
    );
  }

  private validateFilePath(filePath: string, baseDir: string): void {
    const resolvedPath = resolve(filePath);
    const resolvedBaseDir = resolve(baseDir);

    // Ensure the file is within the base directory (prevent directory traversal)
    if (!resolvedPath.startsWith(resolvedBaseDir)) {
      throw new Error('Invalid file path: outside of allowed directory');
    }

    // Check for suspicious patterns in the relative path only
    // This prevents false positives from legitimate system paths
    const relativePath = filePath.replace(baseDir, '');
    const normalizedRelativePath = normalize(relativePath);

    // Only check for directory traversal patterns in the relative portion
    if (normalizedRelativePath.includes('..')) {
      throw new Error(
        'Invalid file path: contains directory traversal patterns'
      );
    }

    // Check for other suspicious patterns that could indicate path injection
    if (relativePath.includes('\0') || relativePath.includes('\x00')) {
      throw new Error('Invalid file path: contains null bytes');
    }
  }

  public async getDirectoryStats(): Promise<DirectoryStats> {
    if (!this.initialized) {
      await this.initialize();
    }

    const config = environmentConfig.getConfig();
    const stats: DirectoryStats = {
      totalFiles: 0,
      totalSize: 0,
      filesByType: {},
    };

    try {
      const files = await this.getAllFiles(config.visualizationsDir);

      for (const file of files) {
        const fileStat = await fs.stat(file);
        const ext = extname(file).substring(1);

        stats.totalFiles++;
        stats.totalSize += fileStat.size;
        stats.filesByType[ext] = (stats.filesByType[ext] || 0) + 1;

        if (!stats.oldestFile || fileStat.birthtime < stats.oldestFile) {
          stats.oldestFile = fileStat.birthtime;
        }
        if (!stats.newestFile || fileStat.birthtime > stats.newestFile) {
          stats.newestFile = fileStat.birthtime;
        }
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get directory stats', { error: error as Error });
      throw error;
    }
  }

  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.getAllFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory might not exist or be accessible
      logger.debug(`Cannot read directory: ${dir}`, { error: error as Error });
    }

    return files;
  }

  public async cleanup(force = false): Promise<CleanupResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const config = environmentConfig.getConfig();
    const result: CleanupResult = {
      filesRemoved: 0,
      bytesFreed: 0,
      errors: [],
    };

    if (!config.enableCleanup && !force) {
      logger.debug('Cleanup is disabled');
      return result;
    }

    try {
      const files = await this.getAllFiles(config.visualizationsDir);
      const now = Date.now();
      const maxAge = config.maxFileAge;

      for (const file of files) {
        try {
          const stats = await fs.stat(file);
          const age = now - stats.birthtime.getTime();

          if (age > maxAge) {
            await fs.unlink(file);
            result.filesRemoved++;
            result.bytesFreed += stats.size;
            logger.debug(`Cleaned up old file: ${file}`, {
              age,
              size: stats.size,
            });
          }
        } catch (error) {
          const errorMsg = `Failed to cleanup file ${file}: ${(error as Error).message}`;
          result.errors.push(errorMsg);
          logger.warn(errorMsg);
        }
      }

      // Check directory size and remove oldest files if needed
      const dirStats = await this.getDirectoryStats();
      if (dirStats.totalSize > config.maxDirectorySize) {
        await this.cleanupBySize(config.maxDirectorySize, result);
      }

      logger.info('Cleanup completed', {
        filesRemoved: result.filesRemoved,
        bytesFreed: result.bytesFreed,
        errors: result.errors.length,
      });
    } catch (error) {
      const errorMsg = `Cleanup failed: ${(error as Error).message}`;
      result.errors.push(errorMsg);
      logger.error(errorMsg);
    }

    return result;
  }

  private async cleanupBySize(
    maxSize: number,
    result: CleanupResult
  ): Promise<void> {
    const config = environmentConfig.getConfig();
    const files = await this.getAllFiles(config.visualizationsDir);

    // Sort files by creation time (oldest first)
    const fileStats = await Promise.all(
      files.map(async file => ({
        path: file,
        stats: await fs.stat(file),
      }))
    );

    fileStats.sort(
      (a, b) => a.stats.birthtime.getTime() - b.stats.birthtime.getTime()
    );

    let currentSize = fileStats.reduce((sum, file) => sum + file.stats.size, 0);

    for (const file of fileStats) {
      if (currentSize <= maxSize) {
        break;
      }

      try {
        await fs.unlink(file.path);
        currentSize -= file.stats.size;
        result.filesRemoved++;
        result.bytesFreed += file.stats.size;
        logger.debug(`Removed file for size limit: ${file.path}`, {
          size: file.stats.size,
        });
      } catch (error) {
        const errorMsg = `Failed to remove file ${file.path}: ${(error as Error).message}`;
        result.errors.push(errorMsg);
        logger.warn(errorMsg);
      }
    }
  }

  private setupAutomaticCleanup(): void {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(
      async () => {
        try {
          await this.cleanup();
        } catch (error) {
          logger.error('Automatic cleanup failed', { error: error as Error });
        }
      },
      60 * 60 * 1000
    ); // 1 hour

    logger.info('Automatic cleanup scheduled every hour');
  }

  public async deleteFile(filePath: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const config = environmentConfig.getConfig();

    // Security validation
    this.validateFilePath(filePath, config.visualizationsDir);

    try {
      await fs.unlink(filePath);
      logger.info(`File deleted: ${filePath}`);
    } catch (error) {
      logger.error(`Failed to delete file: ${filePath}`, {
        error: error as Error,
      });
      throw error;
    }
  }

  public async getFileInfo(filePath: string): Promise<FileMetadata | null> {
    if (!existsSync(filePath)) {
      return null;
    }

    try {
      const stats = statSync(filePath);
      const ext = extname(filePath).substring(1) as FileMetadata['type'];

      return {
        path: filePath,
        filename: basename(filePath),
        size: stats.size,
        createdAt: stats.birthtime,
        type: ext,
      };
    } catch (error) {
      logger.error(`Failed to get file info: ${filePath}`, {
        error: error as Error,
      });
      return null;
    }
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.initialized = false;
    logger.info('FileOutputManager destroyed');
  }
}

// Export singleton instance
export const fileOutputManager = FileOutputManager.getInstance();
