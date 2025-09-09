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

// Import and register analysis tools
import { analyzeColorTool } from './analyze-color';
import { checkContrastTool } from './check-contrast';

// Import and register accessibility tools
import { simulateColorblindnessTool } from './simulate-colorblindness';
import { optimizeForAccessibilityTool } from './optimize-for-accessibility';

// Import and register palette generation tools
import { generateHarmonyPaletteTool } from './generate-harmony-palette';

// Register analysis tools
toolRegistry.registerTool(analyzeColorTool);
toolRegistry.registerTool(checkContrastTool);

// Register accessibility tools
toolRegistry.registerTool(simulateColorblindnessTool);
toolRegistry.registerTool(optimizeForAccessibilityTool);

// Register palette generation tools
toolRegistry.registerTool(generateHarmonyPaletteTool);
