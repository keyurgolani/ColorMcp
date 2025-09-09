/**
 * Simple test tool for HTML generation
 */

import { ToolHandler, ToolResponse, ErrorResponse } from '../types/index';
import * as Joi from 'joi';

const testHtmlSchema = Joi.object({
  message: Joi.string().default('Hello World').description('Test message'),
});

interface TestHtmlParams {
  message?: string;
}

async function testHtml(
  params: TestHtmlParams
): Promise<ToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    const message = params.message || 'Hello World';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test HTML</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .message { color: #2563eb; font-size: 24px; }
    </style>
</head>
<body>
    <h1>MCP Color Server Test</h1>
    <div class="message">${message}</div>
    <p>Generated at: ${new Date().toLocaleString()}</p>
</body>
</html>`;

    return {
      success: true,
      data: {
        message,
        html_length: html.length,
      },
      metadata: {
        execution_time: Date.now() - startTime,
        tool: 'test_html',
        timestamp: new Date().toISOString(),
        color_space_used: 'sRGB',
        accessibility_notes: [],
        recommendations: ['This is a test tool'],
      },
      visualizations: {
        html,
      },
      export_formats: {},
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'TEST_ERROR',
        message: `Test HTML error: ${error instanceof Error ? error.message : String(error)}`,
        details: {
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        suggestions: ['This is a test tool error'],
      },
      metadata: {
        execution_time: Date.now() - startTime,
        tool: 'test_html',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const testHtmlTool: ToolHandler = {
  name: 'test_html',
  description: 'Simple test tool for HTML generation',
  parameters: testHtmlSchema.describe(),
  handler: async (params: unknown) => testHtml(params as TestHtmlParams),
};
