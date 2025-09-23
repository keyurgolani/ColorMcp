/**
 * Tests for EnvironmentConfig
 */

import { EnvironmentConfigManager } from '../../src/utils/environment-config';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync, mkdirSync } from 'fs';

describe('EnvironmentConfigManager', () => {
  let originalEnv: typeof process.env;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    // Force reload configuration to pick up restored environment
    EnvironmentConfigManager.getInstance().reloadConfiguration();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = EnvironmentConfigManager.getInstance();
      const instance2 = EnvironmentConfigManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('configuration loading', () => {
    it('should use default configuration when no environment variables are set', () => {
      // Clear relevant environment variables
      delete process.env['COLOR_MCP_VISUALIZATIONS_DIR'];
      delete process.env['COLOR_MCP_MAX_FILE_AGE'];
      delete process.env['COLOR_MCP_MAX_DIR_SIZE'];
      delete process.env['COLOR_MCP_ENABLE_CLEANUP'];
      delete process.env['COLOR_MCP_FILE_PREFIX'];

      const config = EnvironmentConfigManager.getInstance();
      config.reloadConfiguration();
      const settings = config.getConfig();

      expect(settings.maxFileAge).toBe(24 * 60 * 60 * 1000); // 24 hours
      expect(settings.maxDirectorySize).toBe(1024 * 1024 * 1024); // 1GB
      expect(settings.enableCleanup).toBe(true);
      expect(settings.fileNamePrefix).toBe('mcp-color');
      expect(settings.visualizationsDir).toContain('mcp-color-server');
    });

    it('should use environment variables when provided', () => {
      const testDir = join(tmpdir(), 'test-visualizations');
      // Create the directory first so it's valid
      if (!existsSync(testDir)) {
        mkdirSync(testDir, { recursive: true });
      }
      process.env['COLOR_MCP_VISUALIZATIONS_DIR'] = testDir;
      process.env['COLOR_MCP_MAX_FILE_AGE'] = '3600000'; // 1 hour
      process.env['COLOR_MCP_MAX_DIR_SIZE'] = '104857600'; // 100MB
      process.env['COLOR_MCP_ENABLE_CLEANUP'] = 'false';
      process.env['COLOR_MCP_FILE_PREFIX'] = 'test-prefix';

      const config = EnvironmentConfigManager.getInstance();
      config.reloadConfiguration();
      const settings = config.getConfig();

      expect(settings.visualizationsDir).toBe(testDir);
      expect(settings.maxFileAge).toBe(3600000);
      expect(settings.maxDirectorySize).toBe(104857600);
      expect(settings.enableCleanup).toBe(false);
      expect(settings.fileNamePrefix).toBe('test-prefix');
    });

    it('should fall back to defaults for invalid numeric values', () => {
      process.env['COLOR_MCP_MAX_FILE_AGE'] = 'invalid';
      process.env['COLOR_MCP_MAX_DIR_SIZE'] = '-100';

      const config = EnvironmentConfigManager.getInstance();
      config.reloadConfiguration();
      const settings = config.getConfig();

      expect(settings.maxFileAge).toBe(24 * 60 * 60 * 1000);
      expect(settings.maxDirectorySize).toBe(1024 * 1024 * 1024);
    });

    it('should parse boolean values correctly', () => {
      // Test various boolean representations
      const testCases = [
        { value: 'true', expected: true },
        { value: 'TRUE', expected: true },
        { value: '1', expected: true },
        { value: 'yes', expected: true },
        { value: 'false', expected: false },
        { value: 'FALSE', expected: false },
        { value: '0', expected: false },
        { value: 'no', expected: false },
        { value: 'invalid', expected: true }, // default
      ];

      testCases.forEach(({ value, expected }) => {
        process.env['COLOR_MCP_ENABLE_CLEANUP'] = value;
        const config = EnvironmentConfigManager.getInstance();
        config.reloadConfiguration();
        expect(config.getConfig().enableCleanup).toBe(expected);
      });
    });
  });

  describe('configuration validation', () => {
    it('should validate correct configuration', () => {
      const config = EnvironmentConfigManager.getInstance();
      const validation = config.validateConfiguration();

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid file prefix', () => {
      process.env['COLOR_MCP_FILE_PREFIX'] = 'invalid/prefix';

      const config = EnvironmentConfigManager.getInstance();
      config.reloadConfiguration();
      const validation = config.validateConfiguration();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain(
        'File name prefix must contain only alphanumeric characters, hyphens, and underscores'
      );
    });
  });

  describe('getter methods', () => {
    it('should return correct values from getter methods', () => {
      const testDir = join(tmpdir(), 'test-dir');
      // Create the directory first so it's valid
      if (!existsSync(testDir)) {
        mkdirSync(testDir, { recursive: true });
      }
      process.env['COLOR_MCP_VISUALIZATIONS_DIR'] = testDir;
      process.env['COLOR_MCP_MAX_FILE_AGE'] = '7200000';
      process.env['COLOR_MCP_MAX_DIR_SIZE'] = '209715200';
      process.env['COLOR_MCP_ENABLE_CLEANUP'] = 'false';
      process.env['COLOR_MCP_FILE_PREFIX'] = 'custom-prefix';

      const config = EnvironmentConfigManager.getInstance();
      config.reloadConfiguration();

      expect(config.getVisualizationsDir()).toBe(testDir);
      expect(config.getMaxFileAge()).toBe(7200000);
      expect(config.getMaxDirectorySize()).toBe(209715200);
      expect(config.isCleanupEnabled()).toBe(false);
      expect(config.getFileNamePrefix()).toBe('custom-prefix');
    });
  });

  describe('configuration reload', () => {
    it('should reload configuration when environment changes', () => {
      const config = EnvironmentConfigManager.getInstance();
      const initialPrefix = config.getFileNamePrefix();

      // Change environment
      process.env['COLOR_MCP_FILE_PREFIX'] = 'new-prefix';
      config.reloadConfiguration();

      expect(config.getFileNamePrefix()).toBe('new-prefix');
      expect(config.getFileNamePrefix()).not.toBe(initialPrefix);
    });
  });
});
