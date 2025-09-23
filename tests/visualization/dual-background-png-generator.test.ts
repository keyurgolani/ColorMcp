/**
 * Tests for DualBackgroundPNGGenerator
 */

import { dualBackgroundPNGGenerator } from '../../src/visualization/dual-background-png-generator';
import sharp from 'sharp';

describe('DualBackgroundPNGGenerator', () => {
  afterAll(() => {
    // Cleanup resources
    dualBackgroundPNGGenerator.destroy();
  });

  describe('generateDualPNG', () => {
    it('should generate both light and dark background variants', async () => {
      const svgContent = `
        <svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="transparent"/>
          <rect x="10" y="10" width="80" height="80" fill="#FF0000"/>
          <text x="100" y="50" fill="#000000" font-family="Arial" font-size="12">Test</text>
        </svg>
      `;

      const result = await dualBackgroundPNGGenerator.generateDualPNG(
        svgContent,
        [200, 100],
        {
          lightBackground: '#ffffff',
          darkBackground: '#1a1a1a',
          intelligentTextColor: true,
          quality: 'standard',
        }
      );

      expect(result.lightBuffer).toBeInstanceOf(Buffer);
      expect(result.darkBuffer).toBeInstanceOf(Buffer);
      expect(result.lightBuffer.length).toBeGreaterThan(0);
      expect(result.darkBuffer.length).toBeGreaterThan(0);
      expect(result.metadata.dimensions).toEqual([200, 100]);
      expect(result.metadata.quality).toBe('standard');
      expect(result.metadata.generationTime).toBeGreaterThan(0);
    });

    it('should validate generated PNG files', async () => {
      const svgContent = `
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="transparent"/>
          <circle cx="50" cy="50" r="40" fill="#00FF00"/>
        </svg>
      `;

      const result = await dualBackgroundPNGGenerator.generateDualPNG(
        svgContent,
        [100, 100]
      );

      // Validate that buffers are valid PNG files
      const lightMeta = await sharp(result.lightBuffer).metadata();
      const darkMeta = await sharp(result.darkBuffer).metadata();

      expect(lightMeta.format).toBe('png');
      expect(darkMeta.format).toBe('png');
      expect(lightMeta.width).toBe(100);
      expect(lightMeta.height).toBe(100);
      expect(darkMeta.width).toBe(100);
      expect(darkMeta.height).toBe(100);
    });

    it('should apply intelligent text colors', async () => {
      const svgContent = `
        <svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="transparent"/>
          <text x="10" y="30" fill="#000000" font-family="Arial" font-size="12">Black Text</text>
          <text x="10" y="60" fill="#ffffff" font-family="Arial" font-size="12">White Text</text>
        </svg>
      `;

      const result = await dualBackgroundPNGGenerator.generateDualPNG(
        svgContent,
        [200, 100],
        {
          lightBackground: '#ffffff',
          darkBackground: '#1a1a1a',
          intelligentTextColor: true,
          quality: 'standard',
        }
      );

      expect(result.lightBuffer).toBeInstanceOf(Buffer);
      expect(result.darkBuffer).toBeInstanceOf(Buffer);

      // Both variants should be generated successfully
      expect(result.lightBuffer.length).toBeGreaterThan(0);
      expect(result.darkBuffer.length).toBeGreaterThan(0);
    });

    it('should handle different quality settings', async () => {
      const svgContent = `
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="transparent"/>
          <rect x="10" y="10" width="80" height="80" fill="#0000FF"/>
        </svg>
      `;

      const qualities = ['draft', 'standard', 'high', 'ultra'] as const;

      for (const quality of qualities) {
        const result = await dualBackgroundPNGGenerator.generateDualPNG(
          svgContent,
          [100, 100],
          { quality }
        );

        expect(result.metadata.quality).toBe(quality);
        expect(result.lightBuffer.length).toBeGreaterThan(0);
        expect(result.darkBuffer.length).toBeGreaterThan(0);
      }
    });

    it('should reject oversized images', async () => {
      const svgContent = `
        <svg width="20000" height="20000" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#FF0000"/>
        </svg>
      `;

      await expect(
        dualBackgroundPNGGenerator.generateDualPNG(svgContent, [20000, 20000])
      ).rejects.toThrow('Image dimensions exceed memory limits');
    });

    it('should handle custom background colors', async () => {
      const svgContent = `
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="transparent"/>
          <rect x="10" y="10" width="80" height="80" fill="#FFFF00"/>
        </svg>
      `;

      const result = await dualBackgroundPNGGenerator.generateDualPNG(
        svgContent,
        [100, 100],
        {
          lightBackground: '#f0f0f0',
          darkBackground: '#2a2a2a',
          intelligentTextColor: true,
          quality: 'standard',
        }
      );

      expect(result.lightBuffer).toBeInstanceOf(Buffer);
      expect(result.darkBuffer).toBeInstanceOf(Buffer);
    });
  });

  describe('validateVisualQuality', () => {
    it('should validate correct PNG files', async () => {
      const svgContent = `
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="transparent"/>
          <rect x="10" y="10" width="80" height="80" fill="#FF0000"/>
        </svg>
      `;

      const result = await dualBackgroundPNGGenerator.generateDualPNG(
        svgContent,
        [100, 100]
      );

      const validation = await dualBackgroundPNGGenerator.validateVisualQuality(
        result.lightBuffer,
        result.darkBuffer,
        [100, 100]
      );

      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should detect invalid PNG files', async () => {
      const invalidBuffer = Buffer.from('not a png file');
      const validSvg = `
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#FF0000"/>
        </svg>
      `;

      const validResult = await dualBackgroundPNGGenerator.generateDualPNG(
        validSvg,
        [100, 100]
      );

      const validation = await dualBackgroundPNGGenerator.validateVisualQuality(
        invalidBuffer,
        validResult.darkBuffer,
        [100, 100]
      );

      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(
        validation.issues.some(issue =>
          issue.includes('not a valid image file')
        )
      ).toBe(true);
    });

    it('should detect dimension mismatches', async () => {
      const svgContent = `
        <svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#FF0000"/>
        </svg>
      `;

      const result = await dualBackgroundPNGGenerator.generateDualPNG(
        svgContent,
        [50, 50]
      );

      // Test with wrong expected dimensions
      const validation = await dualBackgroundPNGGenerator.validateVisualQuality(
        result.lightBuffer,
        result.darkBuffer,
        [100, 100] // Wrong dimensions
      );

      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });
  });

  describe('generateFileName', () => {
    it('should generate descriptive filenames with variants', () => {
      const lightName = dualBackgroundPNGGenerator.generateFileName(
        'test-palette',
        'light'
      );
      const darkName = dualBackgroundPNGGenerator.generateFileName(
        'test-palette',
        'dark'
      );

      expect(lightName).toMatch(
        /test-palette-light-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.png/
      );
      expect(darkName).toMatch(
        /test-palette-dark-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.png/
      );
      expect(lightName).not.toBe(darkName);
    });

    it('should sanitize invalid characters in filenames', () => {
      const filename = dualBackgroundPNGGenerator.generateFileName(
        'test/palette:with*invalid<chars>',
        'light'
      );

      expect(filename).toMatch(
        /test-palette-with-invalid-chars.*-light-.*\.png/
      );
      expect(filename).not.toContain('/');
      expect(filename).not.toContain(':');
      expect(filename).not.toContain('*');
      expect(filename).not.toContain('<');
    });

    it('should support custom extensions', () => {
      const filename = dualBackgroundPNGGenerator.generateFileName(
        'test',
        'light',
        'jpg'
      );

      expect(filename).toMatch(/test-light-.*\.jpg/);
    });
  });

  describe('performance and memory', () => {
    it('should handle multiple concurrent generations', async () => {
      const svgContent = `
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="transparent"/>
          <rect x="10" y="10" width="80" height="80" fill="#FF0000"/>
        </svg>
      `;

      const promises = Array.from({ length: 5 }, () =>
        dualBackgroundPNGGenerator.generateDualPNG(svgContent, [100, 100])
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.lightBuffer).toBeInstanceOf(Buffer);
        expect(result.darkBuffer).toBeInstanceOf(Buffer);
        expect(result.lightBuffer.length).toBeGreaterThan(0);
        expect(result.darkBuffer.length).toBeGreaterThan(0);
      });
    });

    it('should complete generation within reasonable time', async () => {
      const svgContent = `
        <svg width="500" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="transparent"/>
          <rect x="10" y="10" width="480" height="280" fill="#FF0000"/>
          <text x="250" y="150" fill="#000000" font-family="Arial" font-size="24" text-anchor="middle">Test Image</text>
        </svg>
      `;

      const startTime = Date.now();
      const result = await dualBackgroundPNGGenerator.generateDualPNG(
        svgContent,
        [500, 300]
      );
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.metadata.generationTime).toBeLessThan(5000);
    });

    it('should enforce file size limits', async () => {
      // Create a very large SVG that might exceed limits
      const largeElements = Array.from(
        { length: 1000 },
        (_, i) =>
          `<rect x="${(i % 100) * 10}" y="${Math.floor(i / 100) * 10}" width="8" height="8" fill="hsl(${i % 360}, 100%, 50%)"/>`
      ).join('');

      const svgContent = `
        <svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="transparent"/>
          ${largeElements}
        </svg>
      `;

      // This should either complete successfully or throw a size limit error
      try {
        const result = await dualBackgroundPNGGenerator.generateDualPNG(
          svgContent,
          [1000, 1000]
        );

        // If it completes, check file sizes are reasonable
        expect(result.lightBuffer.length).toBeLessThan(10 * 1024 * 1024); // 10MB
        expect(result.darkBuffer.length).toBeLessThan(10 * 1024 * 1024); // 10MB
      } catch (error) {
        expect((error as Error).message).toMatch(/exceeds.*limit/i);
      }
    });
  });

  describe('error handling', () => {
    it('should handle invalid SVG content gracefully', async () => {
      const invalidSvg = 'not valid svg content';

      await expect(
        dualBackgroundPNGGenerator.generateDualPNG(invalidSvg, [100, 100])
      ).rejects.toThrow();
    });

    it('should handle invalid background colors gracefully', async () => {
      const svgContent = `
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#FF0000"/>
        </svg>
      `;

      // Should not throw, but use fallback colors
      const result = await dualBackgroundPNGGenerator.generateDualPNG(
        svgContent,
        [100, 100],
        {
          lightBackground: 'invalid-color',
          darkBackground: 'also-invalid',
          intelligentTextColor: true,
          quality: 'standard',
        }
      );

      expect(result.lightBuffer).toBeInstanceOf(Buffer);
      expect(result.darkBuffer).toBeInstanceOf(Buffer);
    });

    it('should handle zero or negative dimensions', async () => {
      const svgContent = `
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#FF0000"/>
        </svg>
      `;

      await expect(
        dualBackgroundPNGGenerator.generateDualPNG(svgContent, [0, 100])
      ).rejects.toThrow();

      await expect(
        dualBackgroundPNGGenerator.generateDualPNG(svgContent, [100, -50])
      ).rejects.toThrow();
    });
  });
});
