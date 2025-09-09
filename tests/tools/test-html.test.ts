/**
 * Tests for test-html tool
 */

import { testHtmlTool } from '../../src/tools/test-html';
import { ToolResponse, ErrorResponse } from '../../src/types/index';

describe('testHtmlTool', () => {
  describe('Basic Functionality', () => {
    test('should generate HTML with default message', async () => {
      const result = await testHtmlTool.handler({});
      expect(result.success).toBe(true);

      const successResult = result as ToolResponse;
      expect((successResult.data as any).message).toBe('Hello World');
      expect(successResult.visualizations?.html).toContain('Hello World');
      expect(successResult.visualizations?.html).toContain('<!DOCTYPE html>');
    });

    test('should generate HTML with custom message', async () => {
      const result = await testHtmlTool.handler({
        message: 'Custom Test Message',
      });
      expect(result.success).toBe(true);

      const successResult = result as ToolResponse;
      expect((successResult.data as any).message).toBe('Custom Test Message');
      expect(successResult.visualizations?.html).toContain(
        'Custom Test Message'
      );
    });

    test('should handle empty message', async () => {
      const result = await testHtmlTool.handler({ message: '' });
      expect(result.success).toBe(true);

      const successResult = result as ToolResponse;
      // Empty string defaults to 'Hello World' due to || operator
      expect((successResult.data as any).message).toBe('Hello World');
    });

    test('should include metadata', async () => {
      const result = await testHtmlTool.handler({});
      expect(result.success).toBe(true);

      const successResult = result as ToolResponse;
      expect(successResult.metadata.tool).toBe('test_html');
      expect(successResult.metadata.execution_time).toBeGreaterThanOrEqual(0);
      expect(successResult.metadata.color_space_used).toBe('sRGB');
    });

    test('should handle error gracefully', async () => {
      // Mock Date.toLocaleString to throw an error
      const originalToLocaleString = Date.prototype.toLocaleString;
      Date.prototype.toLocaleString = jest.fn().mockImplementation(() => {
        throw new Error('Date formatting error');
      });

      const result = await testHtmlTool.handler({});
      expect(result.success).toBe(false);

      const errorResult = result as ErrorResponse;
      expect(errorResult.error.code).toBe('TEST_ERROR');
      expect(errorResult.error.message).toContain('Date formatting error');

      // Restore the original method
      Date.prototype.toLocaleString = originalToLocaleString;
    });

    test('should handle non-Error thrown values', async () => {
      // Mock Date.toLocaleString to throw a non-Error value
      const originalToLocaleString = Date.prototype.toLocaleString;
      Date.prototype.toLocaleString = jest.fn().mockImplementation(() => {
        throw 'String error message';
      });

      const result = await testHtmlTool.handler({});
      expect(result.success).toBe(false);

      const errorResult = result as ErrorResponse;
      expect(errorResult.error.code).toBe('TEST_ERROR');
      expect(errorResult.error.message).toContain('String error message');
      expect((errorResult.error.details as any).errorMessage).toBe(
        'String error message'
      );

      // Restore the original method
      Date.prototype.toLocaleString = originalToLocaleString;
    });
  });

  describe('Tool Definition', () => {
    test('should have correct tool metadata', () => {
      expect(testHtmlTool.name).toBe('test_html');
      expect(testHtmlTool.description).toContain('test tool');
      expect(testHtmlTool.parameters).toBeDefined();
      expect(testHtmlTool.handler).toBeDefined();
    });
  });
});
