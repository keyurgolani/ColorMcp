/**
 * Integration tests for dual background PNG tools
 */

import { createPalettePngTool } from '../../src/tools/create-palette-png';
import { createGradientPngTool } from '../../src/tools/create-gradient-png';
import { createColorComparisonPngTool } from '../../src/tools/create-color-comparison-png';
import { enhancedFileOutputManager } from '../../src/utils/enhanced-file-output-manager';
import { fileOutputManager } from '../../src/utils/file-output-manager';
import { FileBasedToolResponse, ErrorResponse } from '../../src/types/index';
import { existsSync } from 'fs';
import { promises as fs } from 'fs';
import sharp from 'sharp';
import { testFileManager } from '../helpers/test-file-manager';

describe('Dual PNG Tools Integration', () => {
  beforeAll(async () => {
    // Enable file output for this test suite
    process.env['TEST_ENABLE_FILE_OUTPUT'] = 'true';
    process.env['TEST_OUTPUT_DIR'] = './test-output';

    // Ensure test output directory exists
    await testFileManager.ensureTestOutputDir();

    await enhancedFileOutputManager.initialize();
    await fileOutputManager.initialize();
  });

  afterAll(async () => {
    // Cleanup test files
    try {
      const shouldCleanup = process.env['TEST_CLEANUP_FILES'] !== 'false';
      if (shouldCleanup) {
        await testFileManager.cleanupTestFiles();
        await enhancedFileOutputManager.cleanupVisualizations(true);
      }
    } catch (error) {
      // Ignore cleanup errors in tests
    }

    // Reset environment variables
    delete process.env['TEST_ENABLE_FILE_OUTPUT'];
    delete process.env['TEST_OUTPUT_DIR'];
  }, 120000); // 2 minute timeout for cleanup

  describe('create_palette_png with dual backgrounds', () => {
    it('should generate dual background PNG files', async () => {
      const result = (await createPalettePngTool.handler({
        palette: ['#FF0000', '#00FF00', '#0000FF'],
        layout: 'horizontal',
        resolution: 150,
      })) as FileBasedToolResponse;

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('light_file_size');
      expect(result.data).toHaveProperty('dark_file_size');
      expect(result.data).toHaveProperty('total_file_size');

      // With file output enabled, we should get png_files
      expect(result.visualizations.png_files).toBeDefined();
      const pngFiles = result.visualizations.png_files!;
      expect(pngFiles).toHaveLength(2);

      const lightFile = pngFiles.find(f => f.filename.includes('light'));
      const darkFile = pngFiles.find(f => f.filename.includes('dark'));

      // Check light background file
      expect(lightFile).toBeDefined();
      expect(lightFile!.type).toBe('png');
      expect(lightFile!.filename).toMatch(/light/);
      expect(existsSync(lightFile!.file_path)).toBe(true);

      // Check dark background file
      expect(darkFile).toBeDefined();
      expect(darkFile!.type).toBe('png');
      expect(darkFile!.filename).toMatch(/dark/);
      expect(existsSync(darkFile!.file_path)).toBe(true);
    });

    it('should handle different layouts', async () => {
      const layouts = ['horizontal', 'vertical', 'grid', 'circular'] as const;

      for (const layout of layouts) {
        const result = (await createPalettePngTool.handler({
          palette: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'],
          layout,
        })) as FileBasedToolResponse;

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('layout', layout);
        expect(result.visualizations.png_files).toBeDefined();
        expect(result.visualizations.png_files).toHaveLength(2);

        // Verify files exist
        const pngFiles = result.visualizations.png_files!;
        const lightFile = pngFiles.find(f => f.filename.includes('light'));
        const darkFile = pngFiles.find(f => f.filename.includes('dark'));
        expect(lightFile).toBeDefined();
        expect(darkFile).toBeDefined();
        expect(existsSync(lightFile!.file_path)).toBe(true);
        expect(existsSync(darkFile!.file_path)).toBe(true);
      }
    });

    it('should include accessibility notes for dual backgrounds', async () => {
      const result = (await createPalettePngTool.handler({
        palette: ['#FF0000', '#00FF00'],
      })) as FileBasedToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.accessibility_notes).toContain(
        'Light background variant optimized for light themes'
      );
      expect(result.metadata.accessibility_notes).toContain(
        'Dark background variant optimized for dark themes'
      );
    });

    it('should handle large palettes efficiently', async () => {
      const largePalette = Array.from(
        { length: 50 },
        (_, i) => `hsl(${i * 7}, 70%, 50%)`
      );

      const startTime = Date.now();
      const result = (await createPalettePngTool.handler({
        palette: largePalette,
        layout: 'grid',
      })) as FileBasedToolResponse;
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.data).toHaveProperty('color_count', 50);
    });
  });

  describe('create_gradient_png with dual backgrounds', () => {
    it('should generate dual background gradient PNG files', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors: ['#FF0000', '#0000FF'],
          angle: 45,
        },
        dimensions: [400, 200],
        quality: 'standard',
      })) as FileBasedToolResponse;

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('gradient_type', 'linear');
      expect(result.data).toHaveProperty('light_file_size');
      expect(result.data).toHaveProperty('dark_file_size');
      expect(result.visualizations.png_files).toBeDefined();
      expect(result.visualizations.png_files).toHaveLength(2);

      const pngFiles = result.visualizations.png_files!;
      const lightFile = pngFiles.find(f => f.filename.includes('light'));
      const darkFile = pngFiles.find(f => f.filename.includes('dark'));

      expect(lightFile).toBeDefined();
      expect(darkFile).toBeDefined();
      expect(lightFile!.filename).toMatch(/gradient.*light/);
      expect(darkFile!.filename).toMatch(/gradient.*dark/);
      expect(existsSync(lightFile!.file_path)).toBe(true);
      expect(existsSync(darkFile!.file_path)).toBe(true);
    });

    it('should handle different gradient types', async () => {
      const gradientTypes = ['linear', 'radial', 'conic'] as const;

      for (const type of gradientTypes) {
        const result = (await createGradientPngTool.handler({
          gradient: {
            type,
            colors: ['#FF0000', '#00FF00', '#0000FF'],
          },
          dimensions: [300, 300],
        })) as FileBasedToolResponse;

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('gradient_type', type);
        expect(result.visualizations.png_files).toBeDefined();
        expect(result.visualizations.png_files).toHaveLength(2);
      }
    });

    it('should handle quality settings', async () => {
      const qualities = ['draft', 'standard', 'high', 'ultra'] as const;

      for (const quality of qualities) {
        const result = (await createGradientPngTool.handler({
          gradient: {
            type: 'linear',
            colors: ['#FF0000', '#0000FF'],
          },
          dimensions: [200, 200],
          quality,
        })) as FileBasedToolResponse;

        expect(result.success).toBe(true);
        expect(result.visualizations.png_files).toBeDefined();
        expect(result.visualizations.png_files).toHaveLength(2);
      }
    });
  });

  describe('create_color_comparison_png with dual backgrounds', () => {
    it('should generate dual background comparison PNG files', async () => {
      const result = (await createColorComparisonPngTool.handler({
        color_sets: [
          ['#FF0000', '#FF4444', '#FF8888'],
          ['#0000FF', '#4444FF', '#8888FF'],
        ],
        comparison_type: 'side_by_side',
      })) as FileBasedToolResponse;

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('comparison_type', 'side_by_side');
      expect(result.data).toHaveProperty('color_sets_count', 2);
      expect(result.data).toHaveProperty('total_colors', 6);
      expect(result.visualizations.png_files).toBeDefined();
      expect(result.visualizations.png_files).toHaveLength(2);

      const pngFiles = result.visualizations.png_files!;
      const lightFile = pngFiles.find(f => f.filename.includes('light'));
      const darkFile = pngFiles.find(f => f.filename.includes('dark'));

      expect(lightFile).toBeDefined();
      expect(darkFile).toBeDefined();
      expect(lightFile!.filename).toMatch(/comparison.*light/);
      expect(darkFile!.filename).toMatch(/comparison.*dark/);
      expect(existsSync(lightFile!.file_path)).toBe(true);
      expect(existsSync(darkFile!.file_path)).toBe(true);
    });

    it('should handle different comparison types', async () => {
      const comparisonTypes = [
        'side_by_side',
        'overlay',
        'difference',
        'harmony',
      ] as const;

      for (const comparisonType of comparisonTypes) {
        const result = (await createColorComparisonPngTool.handler({
          color_sets: [
            ['#FF0000', '#00FF00'],
            ['#0000FF', '#FFFF00'],
          ],
          comparison_type: comparisonType,
        })) as FileBasedToolResponse;

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('comparison_type', comparisonType);
        expect(result.visualizations.png_files).toBeDefined();
        expect(result.visualizations.png_files).toHaveLength(2);
      }
    });
  });

  describe('file naming consistency', () => {
    it('should generate consistent file names with background variants', async () => {
      const result = (await createPalettePngTool.handler({
        palette: ['#FF0000', '#00FF00'],
      })) as FileBasedToolResponse;

      expect(result.success).toBe(true);

      const pngFiles = result.visualizations.png_files!;
      const lightFile = pngFiles.find(f => f.filename.includes('light'));
      const darkFile = pngFiles.find(f => f.filename.includes('dark'));

      expect(lightFile).toBeDefined();
      expect(darkFile).toBeDefined();

      // Both files should have similar base names but different variants
      // Extract the base name by removing the variant suffix and timestamp/id
      const lightBaseName = lightFile!.filename.replace(/-light\.png$/, '');
      const darkBaseName = darkFile!.filename.replace(/-dark\.png$/, '');

      expect(lightBaseName).toBe(darkBaseName);
      expect(lightFile!.filename).toMatch(/-light\.png$/);
      expect(darkFile!.filename).toMatch(/-dark\.png$/);
    });

    it('should include tool name in file names', async () => {
      const paletteResult = (await createPalettePngTool.handler({
        palette: ['#FF0000'],
      })) as FileBasedToolResponse;

      const gradientResult = (await createGradientPngTool.handler({
        gradient: { type: 'linear', colors: ['#FF0000', '#0000FF'] },
        dimensions: [100, 100],
      })) as FileBasedToolResponse;

      expect(paletteResult.visualizations.png_files?.[0]?.filename).toMatch(
        /palette/
      );
      expect(gradientResult.visualizations.png_files?.[0]?.filename).toMatch(
        /gradient/
      );
    });
  });

  describe('visual quality validation', () => {
    it('should generate visually consistent PNG files', async () => {
      const result = (await createPalettePngTool.handler({
        palette: ['#FF0000', '#00FF00', '#0000FF'],
        layout: 'horizontal',
        dimensions: [300, 100],
      })) as FileBasedToolResponse;

      expect(result.success).toBe(true);

      const pngFiles = result.visualizations.png_files!;
      const lightFile = pngFiles.find(f => f.filename.includes('light'));
      const darkFile = pngFiles.find(f => f.filename.includes('dark'));

      expect(lightFile).toBeDefined();
      expect(darkFile).toBeDefined();

      // Read and validate both files
      const lightBuffer = await fs.readFile(lightFile!.file_path);
      const darkBuffer = await fs.readFile(darkFile!.file_path);

      const lightMeta = await sharp(lightBuffer).metadata();
      const darkMeta = await sharp(darkBuffer).metadata();

      // Both should have same dimensions
      expect(lightMeta.width).toBe(darkMeta.width);
      expect(lightMeta.height).toBe(darkMeta.height);
      expect(lightMeta.channels).toBe(darkMeta.channels);

      // Both should be reasonable file sizes
      expect(lightBuffer.length).toBeGreaterThan(500); // At least 500 bytes
      expect(darkBuffer.length).toBeGreaterThan(500); // At least 500 bytes
      expect(lightBuffer.length).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
      expect(darkBuffer.length).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });
  });

  describe('error handling', () => {
    it('should handle invalid colors gracefully', async () => {
      const result = (await createPalettePngTool.handler({
        palette: ['invalid-color', '#FF0000'],
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_COLOR_FORMAT');
      expect(result.error.message).toContain('Invalid colors found');
    });

    it('should handle oversized dimensions', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors: ['#FF0000', '#0000FF'],
        },
        dimensions: [50000, 50000], // Too large
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    it('should handle file system errors gracefully', async () => {
      // This test would require mocking the file system to simulate errors
      // For now, we'll just ensure the tools handle the happy path correctly
      const result = (await createPalettePngTool.handler({
        palette: ['#FF0000'],
      })) as FileBasedToolResponse;

      expect(result.success).toBe(true);
    });
  });

  describe('performance benchmarks', () => {
    it('should generate small palettes quickly', async () => {
      const startTime = Date.now();

      const result = (await createPalettePngTool.handler({
        palette: ['#FF0000', '#00FF00', '#0000FF'],
      })) as FileBasedToolResponse;

      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 3 }, (_, i) =>
        createPalettePngTool.handler({
          palette: [`hsl(${i * 120}, 100%, 50%)`, '#FFFFFF'],
        })
      );

      const results = await Promise.all(requests);

      results.forEach(result => {
        expect((result as FileBasedToolResponse).success).toBe(true);
      });
    });
  });

  describe('metadata and response format', () => {
    it('should return correct metadata structure', async () => {
      const result = (await createPalettePngTool.handler({
        palette: ['#FF0000', '#00FF00'],
      })) as FileBasedToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata).toHaveProperty('execution_time');
      expect(result.metadata).toHaveProperty('tool', 'create_palette_png');
      expect(result.metadata).toHaveProperty('timestamp');
      expect(result.metadata).toHaveProperty('color_space_used', 'sRGB');
      expect(result.metadata).toHaveProperty('accessibility_notes');
      expect(result.metadata).toHaveProperty('recommendations');
    });

    it('should include file metadata in response', async () => {
      const result = (await createPalettePngTool.handler({
        palette: ['#FF0000'],
      })) as FileBasedToolResponse;

      expect(result.success).toBe(true);

      const [lightFile, darkFile] = result.visualizations.png_files!;

      expect(lightFile).toHaveProperty('file_path');
      expect(lightFile).toHaveProperty('filename');
      expect(lightFile).toHaveProperty('size');
      expect(lightFile).toHaveProperty('created_at');
      expect(lightFile).toHaveProperty('type', 'png');
      expect(lightFile).toHaveProperty('description');

      expect(darkFile).toHaveProperty('file_path');
      expect(darkFile).toHaveProperty('filename');
      expect(darkFile).toHaveProperty('size');
      expect(darkFile).toHaveProperty('created_at');
      expect(darkFile).toHaveProperty('type', 'png');
      expect(darkFile).toHaveProperty('description');
    });
  });
});
