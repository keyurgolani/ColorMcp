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
  success: true;
  data: unknown;
  metadata: ResponseMetadata;
  visualizations?:
    | VisualizationResult
    | {
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

// New file-based response interfaces
export interface FileVisualizationResult {
  file_path: string;
  filename: string;
  size: number;
  created_at: string;
  type: 'html' | 'png' | 'svg' | 'css' | 'json';
  description?: string | undefined;
  url?: string | undefined; // Optional URL for web access
}

export interface VisualizationResult {
  html_file?: FileVisualizationResult | undefined;
  png_files?: FileVisualizationResult[] | undefined; // Array for dual background variants
  svg_file?: FileVisualizationResult | undefined;
  // Fallback properties for backward compatibility
  html?: string;
  png_base64?: string;
  svg?: string;
}

export interface PNGVisualizationResult {
  light_background: FileVisualizationResult;
  dark_background: FileVisualizationResult;
  metadata: {
    dimensions: [number, number];
    resolution: number;
    color_space: string;
    total_size: number;
  };
}

export interface FileBasedToolResponse
  extends Omit<ToolResponse, 'visualizations'> {
  visualizations: VisualizationResult;
}

// Specific response types for different tools
export interface ColorWheelResponse extends Omit<ToolResponse, 'data'> {
  data: {
    wheel_type: string;
    size: number;
    interactive: boolean;
    show_harmony: boolean;
    harmony_type?: string;
    highlight_colors?: string[];
    theme: string;
  };
}

export interface GradientHtmlResponse extends Omit<ToolResponse, 'data'> {
  data: {
    gradient_css: string;
    gradient_type: string;
    color_count: number;
    preview_shapes: string[];
    size: [number, number];
    has_interactive_controls: boolean;
  };
}

export interface ThemePreviewResponse extends Omit<ToolResponse, 'data'> {
  data: {
    theme_colors: Record<string, string>;
    preview_type: string;
    color_count: number;
    accessibility_compliant?: boolean;
  };
}

export interface PaletteHtmlResponse extends Omit<ToolResponse, 'data'> {
  data: {
    colors: Array<{
      hex: string;
      rgb: string;
      hsl: string;
      name?: string;
    }>;
    layout: string;
    style: string;
    size: string;
    color_count: number;
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
  security_warnings?: string[];
  [key: string]: unknown;
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
