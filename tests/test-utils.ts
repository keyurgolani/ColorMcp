/**
 * Test utilities for handling different response formats
 */

import { ToolResponse, VisualizationResult } from '../src/types/index';
import { readFile } from 'fs/promises';

/**
 * Extract HTML content from a tool response, handling both file-based and direct content formats
 */
export async function extractHtmlContent(
  result: ToolResponse
): Promise<string | undefined> {
  if (!result.visualizations) {
    return undefined;
  }

  const viz = result.visualizations as
    | VisualizationResult
    | { html?: string; png_base64?: string; svg?: string };

  // Check for direct HTML content first (fallback mode)
  if ('html' in viz && viz.html) {
    return viz.html;
  }

  // Check for file-based HTML content
  if ('html_file' in viz && viz.html_file) {
    try {
      const content = await readFile(viz.html_file.file_path, 'utf-8');
      return content;
    } catch (error) {
      console.warn('Failed to read HTML file:', error);
      return undefined;
    }
  }

  return undefined;
}

/**
 * Extract PNG base64 content from a tool response, handling both file-based and direct content formats
 */
export async function extractPngContent(
  result: ToolResponse
): Promise<string | undefined> {
  if (!result.visualizations) {
    return undefined;
  }

  const viz = result.visualizations as
    | VisualizationResult
    | { html?: string; png_base64?: string; svg?: string };

  // Check for direct PNG content first (fallback mode)
  if ('png_base64' in viz && viz.png_base64) {
    return viz.png_base64;
  }

  // Check for file-based PNG content
  if ('png_files' in viz && viz.png_files && viz.png_files.length > 0) {
    try {
      const pngFile = viz.png_files[0]; // Use first PNG file
      if (pngFile && pngFile.file_path) {
        const buffer = await readFile(pngFile.file_path);
        return buffer.toString('base64');
      }
    } catch (error) {
      console.warn('Failed to read PNG file:', error);
      return undefined;
    }
  }

  return undefined;
}

/**
 * Check if a tool response contains HTML content (either direct or file-based)
 */
export function hasHtmlContent(result: ToolResponse): boolean {
  if (!result.visualizations) {
    return false;
  }

  const viz = result.visualizations as
    | VisualizationResult
    | { html?: string; png_base64?: string; svg?: string };

  return (
    ('html' in viz && !!viz.html) || ('html_file' in viz && !!viz.html_file)
  );
}

/**
 * Check if a tool response contains PNG content (either direct or file-based)
 */
export function hasPngContent(result: ToolResponse): boolean {
  if (!result.visualizations) {
    return false;
  }

  const viz = result.visualizations as
    | VisualizationResult
    | { html?: string; png_base64?: string; svg?: string };

  return (
    ('png_base64' in viz && !!viz.png_base64) ||
    ('png_files' in viz && !!viz.png_files && viz.png_files.length > 0)
  );
}

/**
 * Mock server creation for testing (placeholder implementation)
 */
export function createTestServer(): any {
  return {
    // Mock server implementation
    start: () => Promise.resolve(),
    stop: () => Promise.resolve(),
    isRunning: () => false,
    getConfig: () => ({
      name: 'mcp-color-server',
      version: '0.1.0',
      description:
        'A comprehensive MCP server for color manipulation and visualization',
    }),
    getToolCount: () => 25,
    getPerformanceStats: () => ({
      performance: { averageResponseTime: 100 },
      resources: { memoryUsage: 50 },
    }),
    getSecurityStats: () => ({
      audit: { totalEvents: 0, eventsByType: {} },
    }),
    generateSecurityReport: () => ({
      summary: 'Security Report - All systems operational',
      recommendations: ['Keep dependencies updated'],
      trends: { securityEvents: 0 },
    }),
  };
}

/**
 * Mock server cleanup for testing (placeholder implementation)
 */
export function cleanupServer(_server: any): Promise<void> {
  return Promise.resolve();
}

/**
 * Mock test suite setup (placeholder implementation)
 */
export function setupTestSuite(): void {
  // Mock setup implementation
}
