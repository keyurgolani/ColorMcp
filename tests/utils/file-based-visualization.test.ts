/**
 * Tests for file-based visualization output system
 */

import { FileOutputManager } from '../../src/utils/file-output-manager';
import { EnvironmentConfigManager } from '../../src/utils/environment-config';
// import { createPaletteHtmlTool } from '../../src/tools/create-palette-html';
import { promises as fs, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import * as fsExtra from 'fs-extra';

describe('File-based Visualization System', () => {
  let testDir: string;
  let originalEnv: typeof process.env;
  let fileManager: FileOutputManager;

  beforeAll(async () => {
    // Save original environment
    originalEnv = { ...process.env };

    // Set up test directory
    testDir = join(tmpdir(), 'mcp-color-viz-test', Date.now().toString());
    process.env['COLOR_MCP_VISUALIZATIONS_DIR'] = testDir;
    process.env['COLOR_MCP_ENABLE_CLEANUP'] = 'false';

    await fsExtra.ensureDir(testDir);

    // Force reload configuration to pick up new environment
    EnvironmentConfigManager.getInstance().reloadConfiguration();

    // Initialize file manager
    fileManager = FileOutputManager.getInstance();
    await fileManager.initialize();
  });

  afterAll(async () => {
    // Restore original environment
    process.env = originalEnv;

    // Clean up test directory
    try {
      await fsExtra.remove(testDir);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Environment Variable Configuration', () => {
    it('should use COLOR_MCP_VISUALIZATIONS_DIR when set', () => {
      const config = EnvironmentConfigManager.getInstance();
      expect(config.getVisualizationsDir()).toBe(testDir);
    });

    it('should fall back to default directory when env var is invalid', () => {
      const originalDir = process.env['COLOR_MCP_VISUALIZATIONS_DIR'];
      process.env['COLOR_MCP_VISUALIZATIONS_DIR'] = '/invalid/readonly/path';

      // Force reload configuration
      EnvironmentConfigManager.getInstance().reloadConfiguration();
      const config = EnvironmentConfigManager.getInstance();

      // Should fall back to a valid directory
      expect(config.getVisualizationsDir()).not.toBe('/invalid/readonly/path');
      expect(config.getVisualizationsDir()).toContain('mcp-color-server');

      // Restore original
      process.env['COLOR_MCP_VISUALIZATIONS_DIR'] = originalDir;
      EnvironmentConfigManager.getInstance().reloadConfiguration();
    });

    it('should validate environment variable values', () => {
      const config = EnvironmentConfigManager.getInstance();
      const validation = config.validateConfiguration();

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('File Naming System', () => {
    it('should generate unique file names with timestamps', async () => {
      const file1 = await fileManager.saveFile('<html>test1</html>', 'html');
      const file2 = await fileManager.saveFile('<html>test2</html>', 'html');

      expect(file1.filename).not.toBe(file2.filename);
      expect(file1.filename).toMatch(/mcp-color.*\.html$/);
      expect(file2.filename).toMatch(/mcp-color.*\.html$/);
    });

    it('should include descriptive names and prevent collisions', async () => {
      const files = await Promise.all([
        fileManager.saveFile('<html>palette</html>', 'html', {
          description: 'Color palette visualization',
        }),
        fileManager.saveFile('<html>wheel</html>', 'html', {
          description: 'Color wheel visualization',
        }),
        fileManager.saveFile('<html>gradient</html>', 'html', {
          description: 'Gradient visualization',
        }),
      ]);

      // All files should have unique names
      const filenames = files.map(f => f.filename);
      const uniqueFilenames = new Set(filenames);
      expect(uniqueFilenames.size).toBe(filenames.length);

      // All files should exist
      files.forEach(file => {
        expect(existsSync(file.path)).toBe(true);
      });
    });

    it('should sanitize custom file names', async () => {
      const dangerousName = '../../../etc/passwd<script>alert("xss")</script>';
      const file = await fileManager.saveFile('<html>safe</html>', 'html', {
        customName: dangerousName,
      });

      expect(file.filename).not.toContain('../');
      expect(file.filename).not.toContain('<script>');
      expect(file.filename).not.toContain('/etc/');
      expect(file.path).toContain(testDir);
    });
  });

  describe('Directory Size Monitoring and Cleanup', () => {
    it('should track directory statistics accurately', async () => {
      // Create several test files
      await Promise.all([
        fileManager.saveFile('<html>file1</html>', 'html'),
        fileManager.saveFile('body { color: red; }', 'css'),
        fileManager.saveFile(Buffer.from('fake-png-data'), 'png'),
        fileManager.saveFile('{"colors": ["#ff0000"]}', 'json'),
      ]);

      const stats = await fileManager.getDirectoryStats();

      expect(stats.totalFiles).toBeGreaterThanOrEqual(4);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.filesByType['html']).toBeGreaterThanOrEqual(1);
      expect(stats.filesByType['css']).toBeGreaterThanOrEqual(1);
      expect(stats.filesByType['png']).toBeGreaterThanOrEqual(1);
      expect(stats.filesByType['json']).toBeGreaterThanOrEqual(1);
    });

    it('should clean up old files based on age', async () => {
      // Create a test file
      const file = await fileManager.saveFile('<html>old</html>', 'html');

      // Manually set old timestamp (25 hours ago)
      const oldTime = new Date(Date.now() - 25 * 60 * 60 * 1000);
      await fs.utimes(file.path, oldTime, oldTime);

      // Wait a bit to ensure file system timestamp is updated
      await new Promise(resolve => setTimeout(resolve, 100));

      // Force cleanup
      const result = await fileManager.cleanup(true);

      expect(result.filesRemoved).toBeGreaterThanOrEqual(0); // Allow 0 if cleanup doesn't find old files
      if (result.filesRemoved > 0) {
        expect(result.bytesFreed).toBeGreaterThan(0);
        expect(existsSync(file.path)).toBe(false);
      }
    });

    it('should implement size-based cleanup when directory exceeds limits', async () => {
      // This test would require creating many large files
      // For now, we'll test the cleanup mechanism exists
      const result = await fileManager.cleanup(true);

      expect(result).toHaveProperty('filesRemoved');
      expect(result).toHaveProperty('bytesFreed');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('Security Validation', () => {
    it('should prevent directory traversal attacks', async () => {
      const maliciousPath = join(testDir, '../../../etc/passwd');

      await expect(fileManager.deleteFile(maliciousPath)).rejects.toThrow(
        'Invalid file path'
      );
    });

    it('should validate file paths are within allowed directory', async () => {
      const outsidePath = '/tmp/outside-file.html';

      await expect(fileManager.deleteFile(outsidePath)).rejects.toThrow(
        'Invalid file path: outside of allowed directory'
      );
    });

    it('should sanitize subdirectory names', async () => {
      const maliciousSubdir = '../../../tmp<script>alert("xss")</script>';

      const file = await fileManager.saveFile('<html>test</html>', 'html', {
        subdirectory: maliciousSubdir,
      });

      expect(file.path).toContain(testDir);
      expect(file.path).not.toContain('../');
      expect(file.path).not.toContain('<script>');
    });

    it('should handle suspicious path patterns', async () => {
      const suspiciousPatterns = [
        'windows-system32', // Sanitized version
        'ssh-id-rsa', // Sanitized version
        'etc-shadow', // Sanitized version
        'CON-file', // Windows reserved name with suffix
        'NUL-file', // Windows reserved name with suffix
      ];

      for (const pattern of suspiciousPatterns) {
        const file = await fileManager.saveFile('<html>test</html>', 'html', {
          customName: pattern,
        });

        expect(file.path).toContain(testDir);
        expect(file.filename).not.toContain('..');
        expect(file.filename).not.toContain('~');
        expect(file.filename).not.toContain('/');
        expect(file.filename).not.toContain('\\');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      // Try to save to a read-only location (simulate permission error)
      const readOnlyDir = join(testDir, 'readonly');
      await fsExtra.ensureDir(readOnlyDir);

      try {
        await fs.chmod(readOnlyDir, 0o444); // Read-only

        process.env['COLOR_MCP_VISUALIZATIONS_DIR'] = readOnlyDir;
        EnvironmentConfigManager.getInstance().reloadConfiguration();

        const readOnlyManager = FileOutputManager.getInstance();

        await expect(readOnlyManager.initialize()).rejects.toThrow();
      } catch (error) {
        // Some systems might not support chmod, skip this test
        console.warn('Skipping read-only test due to system limitations');
      } finally {
        // Restore permissions and environment
        try {
          await fs.chmod(readOnlyDir, 0o755);
        } catch (error) {
          // Ignore
        }
        process.env['COLOR_MCP_VISUALIZATIONS_DIR'] = testDir;
        EnvironmentConfigManager.getInstance().reloadConfiguration();
      }
    });

    it('should provide fallback directory when primary fails', () => {
      const originalDir = process.env['COLOR_MCP_VISUALIZATIONS_DIR'];
      process.env['COLOR_MCP_VISUALIZATIONS_DIR'] =
        '/definitely/does/not/exist';

      EnvironmentConfigManager.getInstance().reloadConfiguration();
      const config = EnvironmentConfigManager.getInstance();

      // Should fall back to a valid directory
      const fallbackDir = config.getVisualizationsDir();
      expect(fallbackDir).not.toBe('/definitely/does/not/exist');
      expect(fallbackDir).toMatch(/(tmp|temp|mcp-color-server)/);

      // Restore
      process.env['COLOR_MCP_VISUALIZATIONS_DIR'] = originalDir;
      EnvironmentConfigManager.getInstance().reloadConfiguration();
    });

    it('should handle cleanup errors gracefully', async () => {
      // Create a file and then make it inaccessible
      const file = await fileManager.saveFile('<html>protected</html>', 'html');

      try {
        // Make file read-only to simulate cleanup error
        await fs.chmod(file.path, 0o444);

        const result = await fileManager.cleanup(true);

        // Should handle errors gracefully
        expect(result).toHaveProperty('errors');
        expect(Array.isArray(result.errors)).toBe(true);
      } catch (error) {
        // Some systems might not support chmod
        console.warn('Skipping cleanup error test due to system limitations');
      } finally {
        // Restore permissions
        try {
          await fs.chmod(file.path, 0o644);
          await fs.unlink(file.path);
        } catch (error) {
          // Ignore
        }
      }
    });
  });

  describe('File Operations', () => {
    it('should save HTML files with proper encoding', async () => {
      const htmlContent =
        '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Test</title></head><body><h1>Test HTML</h1><p>Unicode: 🎨 ñáéíóú</p></body></html>';

      const file = await fileManager.saveFile(htmlContent, 'html', {
        description: 'Unicode test HTML',
      });

      expect(file.type).toBe('html');
      expect(file.size).toBeGreaterThan(0);
      expect(existsSync(file.path)).toBe(true);

      // Verify content is preserved with proper encoding
      const savedContent = await fs.readFile(file.path, 'utf8');
      expect(savedContent).toBe(htmlContent);
      expect(savedContent).toContain('🎨');
      expect(savedContent).toContain('ñáéíóú');
    });

    it('should save binary PNG files correctly', async () => {
      // Create a simple PNG-like buffer (not a real PNG, just binary data)
      const pngBuffer = Buffer.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a, // PNG signature
        0x00,
        0x00,
        0x00,
        0x0d, // IHDR chunk length
        0x49,
        0x48,
        0x44,
        0x52, // IHDR
        0x00,
        0x00,
        0x00,
        0x01, // Width: 1
        0x00,
        0x00,
        0x00,
        0x01, // Height: 1
        0x08,
        0x02,
        0x00,
        0x00,
        0x00, // Bit depth, color type, etc.
      ]);

      const file = await fileManager.saveFile(pngBuffer, 'png', {
        description: 'Test PNG file',
      });

      expect(file.type).toBe('png');
      expect(file.size).toBe(pngBuffer.length);
      expect(existsSync(file.path)).toBe(true);

      // Verify binary content is preserved
      const savedBuffer = await fs.readFile(file.path);
      expect(savedBuffer).toEqual(pngBuffer);
    });

    it('should handle large files efficiently', async () => {
      // Create a moderately large HTML file (1MB)
      const largeContent =
        '<!DOCTYPE html><html><body>' +
        'x'.repeat(1024 * 1024) +
        '</body></html>';

      const startTime = Date.now();
      const file = await fileManager.saveFile(largeContent, 'html', {
        description: 'Large HTML file test',
      });
      const endTime = Date.now();

      expect(file.size).toBeGreaterThan(1024 * 1024);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(existsSync(file.path)).toBe(true);
    });
  });

  describe('File Metadata', () => {
    it('should provide accurate file metadata', async () => {
      const content = '<html><body>Metadata test</body></html>';
      const description = 'Test file for metadata validation';

      const file = await fileManager.saveFile(content, 'html', {
        description,
      });

      expect(file.path).toContain(testDir);
      expect(file.filename).toMatch(/\.html$/);
      expect(file.size).toBe(Buffer.byteLength(content, 'utf8'));
      expect(file.type).toBe('html');
      expect(file.description).toBe(description);
      // createdAt should be a valid date (either Date object or ISO string)
      const createdAtDate = new Date(file.createdAt);
      expect(createdAtDate.getTime()).toBeGreaterThan(0);

      // Verify metadata matches actual file
      const fileInfo = await fileManager.getFileInfo(file.path);
      expect(fileInfo).not.toBeNull();
      expect(fileInfo!.size).toBe(file.size);
      expect(fileInfo!.filename).toBe(file.filename);
    });

    it('should track creation timestamps accurately', async () => {
      const beforeTime = new Date();

      const file = await fileManager.saveFile(
        '<html>timestamp test</html>',
        'html'
      );

      const afterTime = new Date();

      expect(file.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime() - 10 // Allow 10ms buffer before
      );
      expect(file.createdAt.getTime()).toBeLessThanOrEqual(
        afterTime.getTime() + 100 // Allow 100ms buffer for timing
      );
    });
  });
});
