/**
 * Tool registry and base tool interface
 */

import { ToolResponse, ErrorResponse } from '../types/index';
import { PerformanceWrapper } from '../utils/performance-wrapper';

export interface ToolHandler {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (params: unknown) => Promise<ToolResponse | ErrorResponse>;
}

export class ToolRegistry {
  private tools: Map<string, ToolHandler> = new Map();
  private performanceEnabled = true;

  public registerTool(tool: ToolHandler): void {
    // Wrap tool with performance monitoring if enabled
    const wrappedTool = this.performanceEnabled
      ? PerformanceWrapper.wrap(
          tool,
          PerformanceWrapper.createConfig(tool.name)
        )
      : tool;

    this.tools.set(tool.name, wrappedTool);
  }

  public setPerformanceEnabled(enabled: boolean): void {
    this.performanceEnabled = enabled;
  }

  public getTool(name: string): ToolHandler | undefined {
    return this.tools.get(name);
  }

  public getAllTools(): ToolHandler[] {
    return Array.from(this.tools.values());
  }

  public getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  public hasTools(): boolean {
    return this.tools.size > 0;
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();

// Import and register conversion tools
import { convertColorTool } from './convert-color';

// Import and register analysis tools
import { analyzeColorTool } from './analyze-color';
import { checkContrastTool } from './check-contrast';

// Import and register accessibility tools
import { simulateColorblindnessTool } from './simulate-colorblindness';
import { optimizeForAccessibilityTool } from './optimize-for-accessibility';

// Import and register palette generation tools
import { generateHarmonyPaletteTool } from './generate-harmony-palette';

// Import and register gradient generation tools
import { generateLinearGradientTool } from './generate-linear-gradient';
import { generateRadialGradientTool } from './generate-radial-gradient';

// Import and register visualization tools
import { createPaletteHtmlTool } from './create-palette-html';
import { createColorWheelHtmlTool } from './create-color-wheel-html';
import { createGradientHtmlTool } from './create-gradient-html';
import { createThemePreviewHtmlTool } from './create-theme-preview-html';

// Import and register PNG generation tools
import { createPalettePngTool } from './create-palette-png';
import { createGradientPngTool } from './create-gradient-png';
import { createColorComparisonPngTool } from './create-color-comparison-png';

// Import and register theme generation tools
import { generateThemeTool } from './generate-theme';
import { generateSemanticColorsTool } from './generate-semantic-colors';

// Import color utility tools
import { mixColorsTool } from './mix-colors';
import { generateColorVariationsTool } from './generate-color-variations';
import { sortColorsTool } from './sort-colors';
import { analyzeColorCollectionTool } from './analyze-color-collection';

// Import export format tools
import { exportCssTool } from './export-css';
import { exportScssTool } from './export-scss';
import { exportTailwindTool } from './export-tailwind';
import { exportJsonTool } from './export-json';

// Register conversion tools
toolRegistry.registerTool(convertColorTool);

// Register analysis tools
toolRegistry.registerTool(analyzeColorTool);
toolRegistry.registerTool(checkContrastTool);

// Register accessibility tools
toolRegistry.registerTool(simulateColorblindnessTool);
toolRegistry.registerTool(optimizeForAccessibilityTool);

// Register palette generation tools
toolRegistry.registerTool(generateHarmonyPaletteTool);

// Register gradient generation tools
toolRegistry.registerTool(generateLinearGradientTool);
toolRegistry.registerTool(generateRadialGradientTool);

// Register visualization tools
toolRegistry.registerTool(createPaletteHtmlTool);
toolRegistry.registerTool(createColorWheelHtmlTool);
toolRegistry.registerTool(createGradientHtmlTool);
toolRegistry.registerTool(createThemePreviewHtmlTool);

// Register PNG generation tools
toolRegistry.registerTool(createPalettePngTool);
toolRegistry.registerTool(createGradientPngTool);
toolRegistry.registerTool(createColorComparisonPngTool);

// Register theme generation tools
toolRegistry.registerTool(generateThemeTool);
toolRegistry.registerTool(generateSemanticColorsTool);

// Register color utility tools
toolRegistry.registerTool(mixColorsTool);
toolRegistry.registerTool(generateColorVariationsTool);
toolRegistry.registerTool(sortColorsTool);
toolRegistry.registerTool(analyzeColorCollectionTool);

// Register export format tools
toolRegistry.registerTool(exportCssTool);
toolRegistry.registerTool(exportScssTool);
toolRegistry.registerTool(exportTailwindTool);
toolRegistry.registerTool(exportJsonTool);
