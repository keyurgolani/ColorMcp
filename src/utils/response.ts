/**
 * Utility functions for creating standardized tool responses
 */

import {
  ToolResponse,
  ErrorResponse,
  ResponseMetadata,
  FileBasedToolResponse,
  VisualizationResult,
} from '../types/index';

export function createSuccessResponse(
  tool: string,
  data: unknown,
  executionTime: number,
  options?: {
    colorSpaceUsed?: string;
    detectedInputFormat?: string;
    colorProperties?: {
      brightness?: number;
      temperature?: string;
      wcagAA?: boolean;
      wcagAAA?: boolean;
    };
    accessibilityNotes?: string[];
    recommendations?: string[];
    visualizations?: {
      html?: string;
      png_base64?: string;
      svg?: string;
    };
    exportFormats?: {
      css?: string;
      scss?: string;
      tailwind?: string;
      json?: object;
    };
  }
): ToolResponse {
  const metadata: ResponseMetadata = {
    execution_time: executionTime,
    tool,
    timestamp: new Date().toISOString(),
  };

  if (options?.colorSpaceUsed !== undefined) {
    metadata.color_space_used = options.colorSpaceUsed;
    // Also set camelCase version for backward compatibility
    (metadata as unknown as Record<string, unknown>)['colorSpaceUsed'] =
      options.colorSpaceUsed;
  }
  if (options?.detectedInputFormat !== undefined) {
    (metadata as unknown as Record<string, unknown>)['detectedInputFormat'] =
      options.detectedInputFormat;
  }
  if (options?.colorProperties !== undefined) {
    (metadata as unknown as Record<string, unknown>)['colorProperties'] =
      options.colorProperties;
  }
  if (options?.accessibilityNotes !== undefined) {
    metadata.accessibility_notes = options.accessibilityNotes;
    // Also set camelCase version for backward compatibility
    (metadata as unknown as Record<string, unknown>)['accessibilityNotes'] =
      options.accessibilityNotes;
  }
  if (options?.recommendations !== undefined) {
    metadata.recommendations = options.recommendations;
  }

  const response: ToolResponse = {
    success: true,
    data,
    metadata,
  };

  if (options?.visualizations !== undefined) {
    response.visualizations = options.visualizations;
  }
  if (options?.exportFormats !== undefined) {
    response.export_formats = options.exportFormats;
  }

  return response;
}

export function createErrorResponse(
  tool: string,
  code: string,
  message: string,
  executionTime: number,
  options?: {
    details?: unknown;
    suggestions?: string[];
  }
): ErrorResponse {
  const metadata: ResponseMetadata = {
    execution_time: executionTime,
    tool,
    timestamp: new Date().toISOString(),
  };

  const error: {
    code: string;
    message: string;
    details?: unknown;
    suggestions?: string[];
  } = {
    code,
    message,
  };

  if (options?.details !== undefined) {
    error.details = options.details;
  }
  if (options?.suggestions !== undefined) {
    error.suggestions = options.suggestions;
  }

  return {
    success: false,
    error,
    metadata,
  };
}

export function createValidationErrorResponse(
  tool: string,
  validationError: string,
  executionTime: number,
  suggestions?: string[]
): ErrorResponse {
  return createErrorResponse(
    tool,
    'VALIDATION_ERROR',
    validationError,
    executionTime,
    {
      suggestions: suggestions || [
        'Check the input format and try again',
        'Refer to the tool documentation for valid parameter formats',
      ],
    }
  );
}

export function createInternalErrorResponse(
  tool: string,
  error: Error,
  executionTime: number
): ErrorResponse {
  return createErrorResponse(
    tool,
    'INTERNAL_ERROR',
    'An internal error occurred while processing the request',
    executionTime,
    {
      details:
        process.env['NODE_ENV'] === 'development' ? error.message : undefined,
      suggestions: [
        'Please try again',
        'If the problem persists, check the server logs for more details',
      ],
    }
  );
}

export function createFileBasedSuccessResponse(
  tool: string,
  data: unknown,
  executionTime: number,
  visualizations: VisualizationResult,
  options?: {
    colorSpaceUsed?: string;
    detectedInputFormat?: string;
    colorProperties?: {
      brightness?: number;
      temperature?: string;
      wcagAA?: boolean;
      wcagAAA?: boolean;
    };
    accessibilityNotes?: string[];
    recommendations?: string[];
    exportFormats?: {
      css?: string;
      scss?: string;
      tailwind?: string;
      json?: object;
    };
  }
): FileBasedToolResponse {
  const metadata: ResponseMetadata = {
    execution_time: executionTime,
    tool,
    timestamp: new Date().toISOString(),
  };

  if (options?.colorSpaceUsed !== undefined) {
    metadata.color_space_used = options.colorSpaceUsed;
    // Also set camelCase version for backward compatibility
    (metadata as unknown as Record<string, unknown>)['colorSpaceUsed'] =
      options.colorSpaceUsed;
  }
  if (options?.detectedInputFormat !== undefined) {
    (metadata as unknown as Record<string, unknown>)['detectedInputFormat'] =
      options.detectedInputFormat;
  }
  if (options?.colorProperties !== undefined) {
    (metadata as unknown as Record<string, unknown>)['colorProperties'] =
      options.colorProperties;
  }
  if (options?.accessibilityNotes !== undefined) {
    metadata.accessibility_notes = options.accessibilityNotes;
    // Also set camelCase version for backward compatibility
    (metadata as unknown as Record<string, unknown>)['accessibilityNotes'] =
      options.accessibilityNotes;
  }
  if (options?.recommendations !== undefined) {
    metadata.recommendations = options.recommendations;
  }

  const response: FileBasedToolResponse = {
    success: true,
    data,
    metadata,
    visualizations,
  };

  if (options?.exportFormats !== undefined) {
    response.export_formats = options.exportFormats;
  }

  return response;
}
