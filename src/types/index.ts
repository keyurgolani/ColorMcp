/**
 * Core type definitions for the MCP Color Server
 */

export interface Color {
  hex: string;
  rgb: { r: number; g: number; b: number; a?: number };
  hsl: { h: number; s: number; l: number; a?: number };
  hsv: { h: number; s: number; v: number; a?: number };
  lab: { l: number; a: number; b: number };
  metadata?: ColorMetadata;
}

export interface ColorMetadata {
  brightness: number;
  temperature: 'warm' | 'cool' | 'neutral';
  accessibility: AccessibilityInfo;
  name?: string;
}

export interface AccessibilityInfo {
  contrastRatio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  colorBlindSafe: boolean;
}

export interface ToolHandler {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (params: unknown) => Promise<ToolResponse | ErrorResponse>;
}

export interface ToolResponse {
  success: boolean;
  data: unknown;
  metadata: ResponseMetadata;
  visualizations?: {
    html?: string;
    png_base64?: string;
    svg?: string;
  };
  export_formats?: {
    css?: string;
    scss?: string;
    tailwind?: string;
    json?: object;
  };
}

export interface ResponseMetadata {
  execution_time: number;
  tool: string;
  timestamp: string;
  color_space_used?: string;
  accessibility_notes?: string[];
  recommendations?: string[];
  colorSpaceUsed?: string;
  accessibilityNotes?: string[];
  baseColor?: string;
  harmonyType?: string;
  colorCount?: number;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    suggestions?: string[];
  };
  metadata: ResponseMetadata;
}

export interface ServerConfig {
  name: string;
  version: string;
  description: string;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  tool?: string;
  executionTime?: number;
  error?: Error;
}
