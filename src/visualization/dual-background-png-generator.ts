/**
 * Dual Background PNG Generator for MCP Color Server
 * Generates PNG visualizations with both light and dark background variants
 */

import sharp from 'sharp';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import { logger } from '../utils/logger';

// Extend colord with names plugin
extend([namesPlugin]);

export interface DualBackgroundOptions {
  lightBackground: string;
  darkBackground: string;
  intelligentTextColor: boolean;
  quality: 'draft' | 'standard' | 'high' | 'ultra';
  compressionLevel?: number;
}

export interface CanvasPool {
  acquire(): Promise<sharp.Sharp>;
  release(canvas: sharp.Sharp): void;
  destroy(): void;
}

export interface PNGGenerationResult {
  lightBuffer: Buffer;
  darkBuffer: Buffer;
  metadata: {
    lightSize: number;
    darkSize: number;
    dimensions: [number, number];
    quality: string;
    generationTime: number;
  };
}

/**
 * Canvas pool for performance optimization
 */
class SharpCanvasPool implements CanvasPool {
  private pool: sharp.Sharp[] = [];
  private maxSize: number;
  private created = 0;

  constructor(maxSize = 4) {
    this.maxSize = maxSize;
  }

  async acquire(): Promise<sharp.Sharp> {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }

    if (this.created < this.maxSize) {
      this.created++;
      return sharp();
    }

    // Wait for a canvas to be released
    return new Promise(resolve => {
      const checkPool = () => {
        if (this.pool.length > 0) {
          resolve(this.pool.pop()!);
        } else {
          setTimeout(checkPool, 10);
        }
      };
      checkPool();
    });
  }

  release(canvas: sharp.Sharp): void {
    if (this.pool.length < this.maxSize) {
      this.pool.push(canvas);
    }
  }

  destroy(): void {
    this.pool = [];
    this.created = 0;
  }
}

/**
 * Dual Background PNG Generator class
 */
export class DualBackgroundPNGGenerator {
  private static instance: DualBackgroundPNGGenerator;
  private canvasPool: CanvasPool;
  private defaultOptions: DualBackgroundOptions = {
    lightBackground: '#ffffff',
    darkBackground: '#1a1a1a',
    intelligentTextColor: true,
    quality: 'standard',
  };

  private constructor() {
    this.canvasPool = new SharpCanvasPool();
  }

  public static getInstance(): DualBackgroundPNGGenerator {
    if (!DualBackgroundPNGGenerator.instance) {
      DualBackgroundPNGGenerator.instance = new DualBackgroundPNGGenerator();
    }
    return DualBackgroundPNGGenerator.instance;
  }

  /**
   * Generate dual background PNG variants from SVG content
   */
  public async generateDualPNG(
    svgContent: string,
    dimensions: [number, number],
    options: Partial<DualBackgroundOptions> = {}
  ): Promise<PNGGenerationResult> {
    const startTime = Date.now();
    const mergedOptions = { ...this.defaultOptions, ...options };

    try {
      // Validate dimensions
      const [width, height] = dimensions;
      if (width <= 0 || height <= 0) {
        throw new Error('Image dimensions must be positive numbers');
      }
      const totalPixels = width * height;
      if (totalPixels > 100000000) {
        throw new Error(
          'Image dimensions exceed memory limits. Maximum 100 megapixels allowed.'
        );
      }

      // Generate both variants in parallel for performance
      const [lightBuffer, darkBuffer] = await Promise.all([
        this.generateSingleVariant(
          svgContent,
          dimensions,
          'light',
          mergedOptions
        ),
        this.generateSingleVariant(
          svgContent,
          dimensions,
          'dark',
          mergedOptions
        ),
      ]);

      // Validate file sizes
      if (lightBuffer.length > 10 * 1024 * 1024) {
        throw new Error('Light background PNG exceeds 10MB size limit');
      }
      if (darkBuffer.length > 10 * 1024 * 1024) {
        throw new Error('Dark background PNG exceeds 10MB size limit');
      }

      const generationTime = Date.now() - startTime;

      logger.info('Dual PNG generation completed', {
        lightSize: lightBuffer.length,
        darkSize: darkBuffer.length,
        generationTime,
        quality: mergedOptions.quality,
      });

      return {
        lightBuffer,
        darkBuffer,
        metadata: {
          lightSize: lightBuffer.length,
          darkSize: darkBuffer.length,
          dimensions,
          quality: mergedOptions.quality,
          generationTime,
        },
      };
    } catch (error) {
      logger.error('Dual PNG generation failed', {
        error: error as Error,
      });
      throw error;
    }
  }

  /**
   * Generate a single PNG variant with specified background
   */
  private async generateSingleVariant(
    svgContent: string,
    _dimensions: [number, number],
    variant: 'light' | 'dark',
    options: DualBackgroundOptions
  ): Promise<Buffer> {
    const backgroundColor =
      variant === 'light' ? options.lightBackground : options.darkBackground;

    // Modify SVG content to include background and intelligent text colors
    const modifiedSvg = this.modifySvgForBackground(
      svgContent,
      backgroundColor,
      variant,
      options
    );

    // Configure Sharp based on quality setting
    const sharpConfig = this.getSharpConfig(options.quality);

    // Generate PNG using Sharp
    const sharpInstance = sharp(Buffer.from(modifiedSvg))
      .png({
        quality: 100,
        compressionLevel: sharpConfig.compressionLevel,
        adaptiveFiltering: sharpConfig.adaptiveFiltering,
      })
      .flatten({
        background: this.parseBackgroundColor(backgroundColor),
      });

    return await sharpInstance.toBuffer();
  }

  /**
   * Modify SVG content to work with the specified background
   */
  private modifySvgForBackground(
    svgContent: string,
    backgroundColor: string,
    variant: 'light' | 'dark',
    options: DualBackgroundOptions
  ): string {
    let modifiedSvg = svgContent;

    // Set background
    if (
      !modifiedSvg.includes('<rect') ||
      !modifiedSvg.includes('width="100%"')
    ) {
      // Add background rectangle if not present
      const insertIndex = modifiedSvg.indexOf('>') + 1;
      const backgroundRect = `<rect width="100%" height="100%" fill="${backgroundColor}"/>`;
      modifiedSvg =
        modifiedSvg.slice(0, insertIndex) +
        backgroundRect +
        modifiedSvg.slice(insertIndex);
    } else {
      // Replace existing background
      modifiedSvg = modifiedSvg.replace(
        /(<rect[^>]*width="100%"[^>]*fill=")[^"]*(")/g,
        `$1${backgroundColor}$2`
      );
    }

    // Apply intelligent text color if enabled
    if (options.intelligentTextColor) {
      modifiedSvg = this.applyIntelligentTextColors(modifiedSvg, variant);
    }

    return modifiedSvg;
  }

  /**
   * Apply intelligent text colors based on background variant
   */
  private applyIntelligentTextColors(
    svgContent: string,
    variant: 'light' | 'dark'
  ): string {
    const secondaryTextColor = variant === 'light' ? '#666666' : '#cccccc';

    let modifiedSvg = svgContent;

    // Replace text colors based on context
    // Primary text (usually black/white)
    modifiedSvg = modifiedSvg.replace(
      /(<text[^>]*fill=")#000000?(")/g,
      variant === 'light' ? '$1#000000$2' : '$1#ffffff$2'
    );
    modifiedSvg = modifiedSvg.replace(
      /(<text[^>]*fill=")#ffffff?(")/g,
      variant === 'light' ? '$1#000000$2' : '$1#ffffff$2'
    );

    // Secondary text (usually gray)
    modifiedSvg = modifiedSvg.replace(
      /(<text[^>]*fill=")#666666?(")/g,
      `$1${secondaryTextColor}$2`
    );
    modifiedSvg = modifiedSvg.replace(
      /(<text[^>]*fill=")#cccccc?(")/g,
      `$1${secondaryTextColor}$2`
    );

    // Handle dynamic text color selection based on background
    const bgLuminance = variant === 'light' ? 1 : 0;
    const dynamicTextColor = bgLuminance > 0.5 ? '#000000' : '#ffffff';

    // Replace any remaining text without explicit colors
    modifiedSvg = modifiedSvg.replace(
      /(<text(?![^>]*fill=)[^>]*>)/g,
      `<text fill="${dynamicTextColor}">`
    );

    return modifiedSvg;
  }

  /**
   * Parse background color string to Sharp-compatible format
   */
  private parseBackgroundColor(backgroundColor: string): {
    r: number;
    g: number;
    b: number;
    alpha: number;
  } {
    try {
      const color = colord(backgroundColor);
      const rgb = color.toRgb();
      return {
        r: rgb.r,
        g: rgb.g,
        b: rgb.b,
        alpha: rgb.a || 1,
      };
    } catch (error) {
      logger.warn(`Invalid background color: ${backgroundColor}, using white`, {
        error: error as Error,
      });
      return { r: 255, g: 255, b: 255, alpha: 1 };
    }
  }

  /**
   * Get Sharp configuration based on quality setting
   */
  private getSharpConfig(quality: string): {
    compressionLevel: number;
    adaptiveFiltering: boolean;
  } {
    switch (quality) {
      case 'draft':
        return { compressionLevel: 9, adaptiveFiltering: false };
      case 'standard':
        return { compressionLevel: 6, adaptiveFiltering: true };
      case 'high':
        return { compressionLevel: 3, adaptiveFiltering: true };
      case 'ultra':
        return { compressionLevel: 0, adaptiveFiltering: true };
      default:
        return { compressionLevel: 6, adaptiveFiltering: true };
    }
  }

  /**
   * Validate visual quality of generated PNGs
   */
  public async validateVisualQuality(
    lightBuffer: Buffer,
    darkBuffer: Buffer,
    dimensions: [number, number]
  ): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check file sizes are reasonable
      const [width, height] = dimensions;
      const expectedMinSize = Math.floor((width * height) / 100); // Very rough estimate

      if (lightBuffer.length < expectedMinSize) {
        issues.push(
          'Light background PNG appears to be too small, possible generation error'
        );
      }
      if (darkBuffer.length < expectedMinSize) {
        issues.push(
          'Dark background PNG appears to be too small, possible generation error'
        );
      }

      // Check that buffers are valid PNG files
      try {
        await sharp(lightBuffer).metadata();
      } catch {
        issues.push('Light background PNG is not a valid image file');
      }

      try {
        await sharp(darkBuffer).metadata();
      } catch {
        issues.push('Dark background PNG is not a valid image file');
      }

      // Check dimensions match expected
      const lightMeta = await sharp(lightBuffer).metadata();
      const darkMeta = await sharp(darkBuffer).metadata();

      if (lightMeta.width !== width || lightMeta.height !== height) {
        issues.push(
          `Light background PNG dimensions (${lightMeta.width}x${lightMeta.height}) don't match expected (${width}x${height})`
        );
      }
      if (darkMeta.width !== width || darkMeta.height !== height) {
        issues.push(
          `Dark background PNG dimensions (${darkMeta.width}x${darkMeta.height}) don't match expected (${width}x${height})`
        );
      }

      return {
        valid: issues.length === 0,
        issues,
      };
    } catch (error) {
      issues.push(`Quality validation failed: ${(error as Error).message}`);
      return {
        valid: false,
        issues,
      };
    }
  }

  /**
   * Generate descriptive filename with background variant suffix
   */
  public generateFileName(
    baseName: string,
    variant: 'light' | 'dark',
    extension = 'png'
  ): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '-');
    return `${sanitizedBaseName}-${variant}-${timestamp}.${extension}`;
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.canvasPool.destroy();
    logger.info('DualBackgroundPNGGenerator destroyed');
  }
}

// Export singleton instance
export const dualBackgroundPNGGenerator =
  DualBackgroundPNGGenerator.getInstance();
