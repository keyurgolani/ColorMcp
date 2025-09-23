/**
 * Tests for version utilities
 */

import {
  VERSION,
  VERSION_INFO,
  getVersionInfo,
  getVersion,
  isCurrentVersion,
  getPackageVersion,
} from '../src/version';

describe('Version utilities', () => {
  describe('Constants', () => {
    test('VERSION should be defined', () => {
      expect(VERSION).toBeDefined();
      expect(typeof VERSION).toBe('string');
      expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });

    test('VERSION_INFO should contain all required fields', () => {
      expect(VERSION_INFO).toBeDefined();
      expect(VERSION_INFO.version).toBe(VERSION);
      expect(VERSION_INFO.name).toBe('mcp-color-server');
      expect(VERSION_INFO.description).toContain('MCP server');
      expect(VERSION_INFO.author).toBeDefined();
      expect(VERSION_INFO.license).toBe('MIT');
    });
  });

  describe('getVersionInfo', () => {
    test('should return version info object', () => {
      const info = getVersionInfo();
      expect(info).toEqual(VERSION_INFO);
      expect(info.version).toBe(VERSION);
    });
  });

  describe('getVersion', () => {
    test('should return version string', () => {
      const version = getVersion();
      expect(version).toBe(VERSION);
      expect(typeof version).toBe('string');
    });
  });

  describe('isCurrentVersion', () => {
    test('should return true for current version', () => {
      expect(isCurrentVersion(VERSION)).toBe(true);
    });

    test('should return false for different version', () => {
      expect(isCurrentVersion('0.0.1')).toBe(false);
      expect(isCurrentVersion('2.0.0')).toBe(false);
      expect(isCurrentVersion('')).toBe(false);
    });
  });

  describe('getPackageVersion', () => {
    test('should return package version object', () => {
      const packageVersion = getPackageVersion();
      expect(packageVersion).toEqual({
        version: VERSION,
        name: VERSION_INFO.name,
        description: VERSION_INFO.description,
        author: VERSION_INFO.author,
        license: VERSION_INFO.license,
      });
    });

    test('should have all required package.json fields', () => {
      const packageVersion = getPackageVersion();
      expect(packageVersion.version).toBeDefined();
      expect(packageVersion.name).toBeDefined();
      expect(packageVersion.description).toBeDefined();
      expect(packageVersion.author).toBeDefined();
      expect(packageVersion.license).toBeDefined();
    });
  });
});
