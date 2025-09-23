/**
 * Tests for EnhancedFileOutputManager
 */

import { EnhancedFileOutputManager } from '../../src/utils/enhanced-file-output-manager';
import { fileOutputManager } from '../../src/utils/file-output-manager';

// Mock the file output manager
jest.mock('../../src/utils/file-output-manager', () => ({
  fileOutputManager: {
    initialize: jest.fn(),
    saveFile: jest.fn(),
    getDirectoryStats: jest.fn(),
    cleanup: jest.fn(),
    deleteFile: jest.fn(),
    getFileInfo: jest.fn(),
  },
}));

describe('EnhancedFileOutputManager', () => {
  let manager: EnhancedFileOutputManager;
  const mockFileOutputManager = fileOutputManager as jest.Mocked<
    typeof fileOutputManager
  >;

  beforeEach(() => {
    manager = EnhancedFileOutputManager.getInstance();
    jest.clearAllMocks();
  });

  describe('Singleton pattern', () => {
    test('should return the same instance', () => {
      const instance1 = EnhancedFileOutputManager.getInstance();
      const instance2 = EnhancedFileOutputManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    test('should initialize file output manager', async () => {
      mockFileOutputManager.initialize.mockResolvedValue();

      await manager.initialize();

      expect(mockFileOutputManager.initialize).toHaveBeenCalledTimes(1);
    });
  });

  describe('saveHTMLVisualization', () => {
    test('should save HTML visualization with basic options', async () => {
      const mockMetadata = {
        path: '/test/path/file.html',
        filename: 'file.html',
        size: 1024,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        type: 'html' as const,
        description: 'Test HTML visualization',
      };

      mockFileOutputManager.saveFile.mockResolvedValue(mockMetadata);

      const result = await manager.saveHTMLVisualization('<html></html>', {
        toolName: 'test-tool',
      });

      expect(mockFileOutputManager.saveFile).toHaveBeenCalledWith(
        '<html></html>',
        'html',
        {
          description: 'test-tool HTML visualization',
        }
      );

      expect(result).toEqual({
        html_file: {
          file_path: '/test/path/file.html',
          filename: 'file.html',
          size: 1024,
          created_at: '2024-01-01T00:00:00.000Z',
          type: 'html',
          description: 'Test HTML visualization',
        },
      });
    });

    test('should save HTML visualization with custom options', async () => {
      const mockMetadata = {
        path: '/test/path/custom-file.html',
        filename: 'custom-file.html',
        size: 2048,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        type: 'html' as const,
        description: 'Custom description',
      };

      mockFileOutputManager.saveFile.mockResolvedValue(mockMetadata);

      const result = await manager.saveHTMLVisualization('<html></html>', {
        toolName: 'test-tool',
        description: 'Custom description',
        customName: 'custom-file',
        subdirectory: 'custom-dir',
      });

      expect(mockFileOutputManager.saveFile).toHaveBeenCalledWith(
        '<html></html>',
        'html',
        {
          description: 'Custom description',
          customName: 'custom-file',
          subdirectory: 'custom-dir',
        }
      );

      expect(result.html_file?.description).toBe('Custom description');
    });

    test('should handle save errors', async () => {
      const error = new Error('Save failed');
      mockFileOutputManager.saveFile.mockRejectedValue(error);

      await expect(
        manager.saveHTMLVisualization('<html></html>', {
          toolName: 'test-tool',
        })
      ).rejects.toThrow('Save failed');
    });
  });

  describe('saveDualPNGVisualization', () => {
    test('should return base64 in test environment', async () => {
      const lightBuffer = Buffer.from('light-png-data');
      const darkBuffer = Buffer.from('dark-png-data');

      const result = await manager.saveDualPNGVisualization(
        lightBuffer,
        darkBuffer,
        {
          toolName: 'test-tool',
          dimensions: [800, 600],
          resolution: 150,
        }
      );

      expect(result).toEqual({
        png_base64: lightBuffer.toString('base64'),
      });

      // Should not call file output manager in test environment
      expect(mockFileOutputManager.saveFile).not.toHaveBeenCalled();
    });
  });

  describe('savePNGVisualization', () => {
    test('should return base64 in test environment', async () => {
      const buffer = Buffer.from('png-data');

      const result = await manager.savePNGVisualization(buffer, {
        toolName: 'test-tool',
      });

      expect(result).toEqual({
        png_base64: buffer.toString('base64'),
      });

      // Should not call file output manager in test environment
      expect(mockFileOutputManager.saveFile).not.toHaveBeenCalled();
    });
  });

  describe('saveSVGVisualization', () => {
    test('should save SVG visualization with basic options', async () => {
      const mockMetadata = {
        path: '/test/path/file.svg',
        filename: 'file.svg',
        size: 512,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        type: 'svg' as const,
        description: 'Test SVG visualization',
      };

      mockFileOutputManager.saveFile.mockResolvedValue(mockMetadata);

      const result = await manager.saveSVGVisualization('<svg></svg>', {
        toolName: 'test-tool',
      });

      expect(mockFileOutputManager.saveFile).toHaveBeenCalledWith(
        '<svg></svg>',
        'svg',
        {
          description: 'test-tool SVG visualization',
        }
      );

      expect(result).toEqual({
        svg_file: {
          file_path: '/test/path/file.svg',
          filename: 'file.svg',
          size: 512,
          created_at: '2024-01-01T00:00:00.000Z',
          type: 'svg',
          description: 'Test SVG visualization',
        },
      });
    });

    test('should save SVG visualization with custom options', async () => {
      const mockMetadata = {
        path: '/test/path/custom.svg',
        filename: 'custom.svg',
        size: 1024,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        type: 'svg' as const,
        description: 'Custom SVG',
      };

      mockFileOutputManager.saveFile.mockResolvedValue(mockMetadata);

      const result = await manager.saveSVGVisualization('<svg></svg>', {
        toolName: 'test-tool',
        description: 'Custom SVG',
        customName: 'custom',
        subdirectory: 'svg-dir',
      });

      expect(mockFileOutputManager.saveFile).toHaveBeenCalledWith(
        '<svg></svg>',
        'svg',
        {
          description: 'Custom SVG',
          customName: 'custom',
          subdirectory: 'svg-dir',
        }
      );

      expect(result.svg_file?.description).toBe('Custom SVG');
    });

    test('should handle SVG save errors', async () => {
      const error = new Error('SVG save failed');
      mockFileOutputManager.saveFile.mockRejectedValue(error);

      await expect(
        manager.saveSVGVisualization('<svg></svg>', {
          toolName: 'test-tool',
        })
      ).rejects.toThrow('SVG save failed');
    });
  });

  describe('saveCombinedVisualization', () => {
    test('should save both HTML and PNG', async () => {
      const htmlMetadata = {
        path: '/test/path/file.html',
        filename: 'file.html',
        size: 1024,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        type: 'html' as const,
        description: 'Test HTML',
      };

      mockFileOutputManager.saveFile.mockResolvedValueOnce(htmlMetadata);

      const result = await manager.saveCombinedVisualization(
        '<html></html>',
        Buffer.from('png-data'),
        {
          toolName: 'test-tool',
        }
      );

      expect(result.html_file).toBeDefined();
      expect(result.png_base64).toBeDefined(); // In test environment
    });

    test('should handle combined save errors', async () => {
      const error = new Error('Combined save failed');
      mockFileOutputManager.saveFile.mockRejectedValue(error);

      await expect(
        manager.saveCombinedVisualization(
          '<html></html>',
          Buffer.from('png-data'),
          {
            toolName: 'test-tool',
          }
        )
      ).rejects.toThrow('Combined save failed');
    });
  });

  describe('saveCompleteVisualization', () => {
    test('should save HTML and dual PNG', async () => {
      const htmlMetadata = {
        path: '/test/path/file.html',
        filename: 'file.html',
        size: 1024,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        type: 'html' as const,
        description: 'Test HTML',
      };

      mockFileOutputManager.saveFile.mockResolvedValueOnce(htmlMetadata);

      const result = await manager.saveCompleteVisualization(
        '<html></html>',
        Buffer.from('light-png'),
        Buffer.from('dark-png'),
        {
          toolName: 'test-tool',
          dimensions: [800, 600],
          resolution: 150,
        }
      );

      expect(result.html_file).toBeDefined();
      expect(result.png_base64).toBeDefined(); // In test environment
    });

    test('should handle complete save errors', async () => {
      const error = new Error('Complete save failed');
      mockFileOutputManager.saveFile.mockRejectedValue(error);

      await expect(
        manager.saveCompleteVisualization(
          '<html></html>',
          Buffer.from('light-png'),
          Buffer.from('dark-png'),
          {
            toolName: 'test-tool',
            dimensions: [800, 600],
            resolution: 150,
          }
        )
      ).rejects.toThrow('Complete save failed');
    });
  });

  describe('createPNGVisualizationResult', () => {
    test('should create structured PNG result', () => {
      const lightFile = {
        file_path: '/test/light.png',
        filename: 'light.png',
        size: 1024,
        created_at: '2024-01-01T00:00:00.000Z',
        type: 'png' as const,
        description: 'Light background',
      };

      const darkFile = {
        file_path: '/test/dark.png',
        filename: 'dark.png',
        size: 1536,
        created_at: '2024-01-01T00:00:00.000Z',
        type: 'png' as const,
        description: 'Dark background',
      };

      const options = {
        toolName: 'test-tool',
        dimensions: [800, 600] as [number, number],
        resolution: 150,
        colorSpace: 'sRGB',
      };

      const result = manager.createPNGVisualizationResult(
        lightFile,
        darkFile,
        options
      );

      expect(result).toEqual({
        light_background: lightFile,
        dark_background: darkFile,
        metadata: {
          dimensions: [800, 600],
          resolution: 150,
          color_space: 'sRGB',
          total_size: 2560,
        },
      });
    });

    test('should use default color space', () => {
      const lightFile = {
        file_path: '/test/light.png',
        filename: 'light.png',
        size: 1024,
        created_at: '2024-01-01T00:00:00.000Z',
        type: 'png' as const,
        description: 'Light background',
      };

      const darkFile = {
        file_path: '/test/dark.png',
        filename: 'dark.png',
        size: 1024,
        created_at: '2024-01-01T00:00:00.000Z',
        type: 'png' as const,
        description: 'Dark background',
      };

      const options = {
        toolName: 'test-tool',
        dimensions: [800, 600] as [number, number],
        resolution: 150,
      };

      const result = manager.createPNGVisualizationResult(
        lightFile,
        darkFile,
        options
      );

      expect(result.metadata.color_space).toBe('sRGB');
    });
  });

  describe('getVisualizationStats', () => {
    test('should return directory stats', async () => {
      const mockStats = {
        totalFiles: 10,
        totalSize: 1024000,
        filesByType: { html: 5, png: 3, svg: 2 },
      };

      mockFileOutputManager.getDirectoryStats.mockResolvedValue(mockStats);

      const result = await manager.getVisualizationStats();

      expect(result).toEqual(mockStats);
      expect(mockFileOutputManager.getDirectoryStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanupVisualizations', () => {
    test('should cleanup with default force=false', async () => {
      const mockResult = { filesRemoved: 5, bytesFreed: 512000, errors: [] };
      mockFileOutputManager.cleanup.mockResolvedValue(mockResult);

      const result = await manager.cleanupVisualizations();

      expect(result).toEqual(mockResult);
      expect(mockFileOutputManager.cleanup).toHaveBeenCalledWith(false);
    });

    test('should cleanup with force=true', async () => {
      const mockResult = { filesRemoved: 10, bytesFreed: 1024000, errors: [] };
      mockFileOutputManager.cleanup.mockResolvedValue(mockResult);

      const result = await manager.cleanupVisualizations(true);

      expect(result).toEqual(mockResult);
      expect(mockFileOutputManager.cleanup).toHaveBeenCalledWith(true);
    });
  });

  describe('deleteVisualization', () => {
    test('should delete specific file', async () => {
      mockFileOutputManager.deleteFile.mockResolvedValue();

      await manager.deleteVisualization('/test/file.html');

      expect(mockFileOutputManager.deleteFile).toHaveBeenCalledWith(
        '/test/file.html'
      );
    });
  });

  describe('getVisualizationInfo', () => {
    test('should return file info', async () => {
      const mockInfo = {
        path: '/test/file.html',
        filename: 'file.html',
        size: 1024,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        type: 'html' as const,
        description: 'Test file',
      };

      mockFileOutputManager.getFileInfo.mockResolvedValue(mockInfo);

      const result = await manager.getVisualizationInfo('/test/file.html');

      expect(result).toEqual(mockInfo);
      expect(mockFileOutputManager.getFileInfo).toHaveBeenCalledWith(
        '/test/file.html'
      );
    });

    test('should return null for non-existent file', async () => {
      mockFileOutputManager.getFileInfo.mockResolvedValue(null);

      const result = await manager.getVisualizationInfo('/test/missing.html');

      expect(result).toBeNull();
    });
  });

  describe('validateVisualizationFile', () => {
    test('should validate supported file types', async () => {
      const mockInfo = {
        path: '/test/file.html',
        filename: 'file.html',
        size: 1024,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        type: 'html' as const,
        description: 'Test file',
      };

      mockFileOutputManager.getFileInfo.mockResolvedValue(mockInfo);

      const result = await manager.validateVisualizationFile('/test/file.html');

      expect(result).toBe(true);
    });

    test('should reject unsupported file types', async () => {
      const mockInfo = {
        path: '/test/file.txt',
        filename: 'file.txt',
        size: 1024,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        type: 'txt' as any,
        description: 'Text file',
      };

      mockFileOutputManager.getFileInfo.mockResolvedValue(mockInfo);

      const result = await manager.validateVisualizationFile('/test/file.txt');

      expect(result).toBe(false);
    });

    test('should return false for non-existent files', async () => {
      mockFileOutputManager.getFileInfo.mockResolvedValue(null);

      const result =
        await manager.validateVisualizationFile('/test/missing.html');

      expect(result).toBe(false);
    });

    test('should handle validation errors', async () => {
      mockFileOutputManager.getFileInfo.mockRejectedValue(
        new Error('Access denied')
      );

      const result = await manager.validateVisualizationFile('/test/file.html');

      expect(result).toBe(false);
    });
  });

  describe('generatePreviewURL', () => {
    test('should generate preview URL with base URL', () => {
      const fileResult = {
        file_path: '/test/file.html',
        filename: 'file.html',
        size: 1024,
        created_at: '2024-01-01T00:00:00.000Z',
        type: 'html' as const,
        description: 'Test file',
      };

      const result = manager.generatePreviewURL(
        fileResult,
        'http://localhost:3000'
      );

      expect(result).toBe('http://localhost:3000/visualizations/file.html');
    });

    test('should handle base URL with trailing slash', () => {
      const fileResult = {
        file_path: '/test/file.html',
        filename: 'file.html',
        size: 1024,
        created_at: '2024-01-01T00:00:00.000Z',
        type: 'html' as const,
        description: 'Test file',
      };

      const result = manager.generatePreviewURL(
        fileResult,
        'http://localhost:3000/'
      );

      expect(result).toBe('http://localhost:3000/visualizations/file.html');
    });

    test('should return undefined without base URL', () => {
      const fileResult = {
        file_path: '/test/file.html',
        filename: 'file.html',
        size: 1024,
        created_at: '2024-01-01T00:00:00.000Z',
        type: 'html' as const,
        description: 'Test file',
      };

      const result = manager.generatePreviewURL(fileResult);

      expect(result).toBeUndefined();
    });
  });

  describe('createVisualizationManifest', () => {
    test('should create manifest with all file types', () => {
      const result = {
        html_file: {
          file_path: '/test/file.html',
          filename: 'file.html',
          size: 1024,
          created_at: '2024-01-01T00:00:00.000Z',
          type: 'html' as const,
          description: 'HTML file',
        },
        png_files: [
          {
            file_path: '/test/file.png',
            filename: 'file.png',
            size: 2048,
            created_at: '2024-01-01T00:00:00.000Z',
            type: 'png' as const,
            description: 'PNG file',
          },
        ],
        svg_file: {
          file_path: '/test/file.svg',
          filename: 'file.svg',
          size: 512,
          created_at: '2024-01-01T00:00:00.000Z',
          type: 'svg' as const,
          description: 'SVG file',
        },
      };

      const options = {
        toolName: 'test-tool',
        parameters: { color: '#FF0000' },
        description: 'Test visualization',
      };

      const manifest = manager.createVisualizationManifest(result, options);

      expect(manifest).toMatchObject({
        tool: 'test-tool',
        parameters: { color: '#FF0000' },
        description: 'Test visualization',
        files: {
          html: result.html_file,
          png: result.png_files,
          svg: result.svg_file,
        },
      });

      expect(manifest['created_at']).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      );
    });

    test('should create manifest with minimal data', () => {
      const result = {
        html_file: {
          file_path: '/test/file.html',
          filename: 'file.html',
          size: 1024,
          created_at: '2024-01-01T00:00:00.000Z',
          type: 'html' as const,
          description: 'HTML file',
        },
      };

      const options = {
        toolName: 'test-tool',
      };

      const manifest = manager.createVisualizationManifest(result, options);

      expect(manifest).toMatchObject({
        tool: 'test-tool',
        parameters: {},
        files: {
          html: result.html_file,
        },
      });

      expect(manifest['description']).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    test('should handle HTML save errors gracefully', async () => {
      const error = new Error('Disk full');
      mockFileOutputManager.saveFile.mockRejectedValue(error);

      await expect(
        manager.saveHTMLVisualization('<html></html>', {
          toolName: 'test-tool',
        })
      ).rejects.toThrow('Disk full');
    });
  });
});
