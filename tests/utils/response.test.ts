/**
 * Tests for response utility functions
 */

import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createInternalErrorResponse,
} from '../../src/utils/response';

describe('Response Utilities', () => {
  describe('createSuccessResponse', () => {
    it('should create basic success response', () => {
      const response = createSuccessResponse(
        'test_tool',
        { result: 'success' },
        100
      );

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ result: 'success' });
      expect(response.metadata.tool).toBe('test_tool');
      expect(response.metadata.execution_time).toBe(100);
      expect(response.metadata.timestamp).toBeDefined();
    });

    it('should include optional metadata', () => {
      const response = createSuccessResponse(
        'test_tool',
        { result: 'success' },
        100,
        {
          colorSpaceUsed: 'sRGB',
          accessibilityNotes: ['Note 1', 'Note 2'],
          recommendations: ['Rec 1', 'Rec 2'],
        }
      );

      expect(response.metadata.color_space_used).toBe('sRGB');
      expect(response.metadata.accessibility_notes).toEqual([
        'Note 1',
        'Note 2',
      ]);
      expect(response.metadata.recommendations).toEqual(['Rec 1', 'Rec 2']);
    });

    it('should include visualizations', () => {
      const visualizations = {
        html: '<html></html>',
        png_base64: 'base64data',
        svg: '<svg></svg>',
      };

      const response = createSuccessResponse('test_tool', {}, 100, {
        visualizations,
      });

      expect(response.visualizations).toEqual(visualizations);
    });

    it('should include export formats', () => {
      const exportFormats = {
        css: '.color { color: red; }',
        scss: '$color: red;',
        tailwind: 'bg-red-500',
        json: { color: 'red' },
      };

      const response = createSuccessResponse('test_tool', {}, 100, {
        exportFormats,
      });

      expect(response.export_formats).toEqual(exportFormats);
    });
  });

  describe('createErrorResponse', () => {
    it('should create basic error response', () => {
      const response = createErrorResponse(
        'test_tool',
        'TEST_ERROR',
        'Test error message',
        50
      );

      expect(response.success).toBe(false);
      expect(response.error.code).toBe('TEST_ERROR');
      expect(response.error.message).toBe('Test error message');
      expect(response.metadata.tool).toBe('test_tool');
      expect(response.metadata.execution_time).toBe(50);
      expect(response.metadata.timestamp).toBeDefined();
    });

    it('should include optional error details', () => {
      const response = createErrorResponse(
        'test_tool',
        'TEST_ERROR',
        'Test error',
        50,
        {
          details: { field: 'invalid' },
          suggestions: ['Try this', 'Or that'],
        }
      );

      expect(response.error.details).toEqual({ field: 'invalid' });
      expect(response.error.suggestions).toEqual(['Try this', 'Or that']);
    });
  });

  describe('createValidationErrorResponse', () => {
    it('should create validation error response', () => {
      const response = createValidationErrorResponse(
        'test_tool',
        'Invalid input',
        25
      );

      expect(response.success).toBe(false);
      expect(response.error.code).toBe('VALIDATION_ERROR');
      expect(response.error.message).toBe('Invalid input');
      expect(response.metadata.execution_time).toBe(25);
    });

    it('should include default suggestions', () => {
      const response = createValidationErrorResponse(
        'test_tool',
        'Invalid input',
        25
      );

      expect(response.error.suggestions).toContain(
        'Check the input format and try again'
      );
      expect(response.error.suggestions).toContain(
        'Refer to the tool documentation for valid parameter formats'
      );
    });

    it('should use custom suggestions', () => {
      const customSuggestions = ['Custom suggestion 1', 'Custom suggestion 2'];
      const response = createValidationErrorResponse(
        'test_tool',
        'Invalid input',
        25,
        customSuggestions
      );

      expect(response.error.suggestions).toEqual(customSuggestions);
    });
  });

  describe('createInternalErrorResponse', () => {
    it('should create internal error response', () => {
      const error = new Error('Internal error occurred');
      const response = createInternalErrorResponse('test_tool', error, 75);

      expect(response.success).toBe(false);
      expect(response.error.code).toBe('INTERNAL_ERROR');
      expect(response.error.message).toBe(
        'An internal error occurred while processing the request'
      );
      expect(response.metadata.execution_time).toBe(75);
    });

    it('should include error details in development', () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'development';

      const error = new Error('Internal error occurred');
      const response = createInternalErrorResponse('test_tool', error, 75);

      expect(response.error.details).toBe('Internal error occurred');

      process.env['NODE_ENV'] = originalEnv;
    });

    it('should not include error details in production', () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'production';

      const error = new Error('Internal error occurred');
      const response = createInternalErrorResponse('test_tool', error, 75);

      expect(response.error.details).toBeUndefined();

      process.env['NODE_ENV'] = originalEnv;
    });

    it('should include default suggestions', () => {
      const error = new Error('Internal error occurred');
      const response = createInternalErrorResponse('test_tool', error, 75);

      expect(response.error.suggestions).toContain('Please try again');
      expect(response.error.suggestions).toContain(
        'If the problem persists, check the server logs for more details'
      );
    });
  });
});
