/**
 * Tool registry and base tool interface
 */

import { ToolResponse, ErrorResponse } from '../types/index';

export interface ToolHandler {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (params: unknown) => Promise<ToolResponse | ErrorResponse>;
}

export class ToolRegistry {
  private tools: Map<string, ToolHandler> = new Map();

  public registerTool(tool: ToolHandler): void {
    this.tools.set(tool.name, tool);
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

// Import and register PNG generation tools
import { createPalettePngTool } from './create-palette-png';
import { createGradientPngTool } from './create-gradient-png';
import { createColorComparisonPngTool } from './create-color-comparison-png';

// Import test tool
import { testHtmlTool } from './test-html';

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

// Register PNG generation tools
toolRegistry.registerTool(createPalettePngTool);
toolRegistry.registerTool(createGradientPngTool);
toolRegistry.registerTool(createColorComparisonPngTool);

// Register test tool
toolRegistry.registerTool(testHtmlTool);
