/**
 * Tests for the main ColorServer class
 */

import { ColorServer, toolRegistry } from '../src/server';
import { logger } from '../src/utils/logger';

// Mock the MCP SDK
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');

describe('ColorServer', () => {
  let server: ColorServer;

  beforeEach(() => {
    // Reset tool registry for clean tests
    // Note: In a real implementation, we would clear the registry

    // Set logger to silent for tests
    logger.setLogLevel('error');

    server = new ColorServer();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      const config = server.getConfig();

      expect(config.name).toBe('mcp-color-server');
      expect(config.version).toBe('1.0.0');
      expect(config.description).toContain('comprehensive MCP server');
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        name: 'custom-color-server',
        version: '2.0.0',
        description: 'Custom color server',
      };

      const customServer = new ColorServer(customConfig);
      const config = customServer.getConfig();

      expect(config.name).toBe('custom-color-server');
      expect(config.version).toBe('2.0.0');
      expect(config.description).toBe('Custom color server');
    });

    it('should register tools during initialization', () => {
      expect(server.getToolCount()).toBeGreaterThan(0);
    });
  });

  describe('tool registration', () => {
    it('should have convert_color tool registered', () => {
      const tools = toolRegistry.getAllTools();
      const convertTool = tools.find(tool => tool.name === 'convert_color');

      expect(convertTool).toBeDefined();
      expect(convertTool?.description).toContain('Convert colors');
      expect(convertTool?.parameters).toBeDefined();
    });

    it('should provide tool names', () => {
      const toolNames = toolRegistry.getToolNames();

      expect(toolNames).toContain('convert_color');
      expect(toolNames.length).toBeGreaterThan(0);
    });
  });

  describe('server lifecycle', () => {
    it('should handle server startup', async () => {
      // Mock the transport to avoid actual connection
      jest.doMock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
        StdioServerTransport: jest.fn().mockImplementation(() => ({})),
      }));

      // This test verifies the server can be started without errors
      // Full integration testing would require actual MCP client
      expect(() => server.start()).not.toThrow();
    });

    it('should handle tool not found error', () => {
      const tools = toolRegistry.getAllTools();
      expect(tools.length).toBeGreaterThan(0);

      const nonExistentTool = toolRegistry.getTool('non-existent-tool');
      expect(nonExistentTool).toBeUndefined();
    });

    it('should handle server startup errors', async () => {
      // Mock the server's connect method to throw error
      jest
        .spyOn(server['server'], 'connect')
        .mockRejectedValue(new Error('Connection failed'));

      await expect(server.start()).rejects.toThrow('Connection failed');
    });
  });

  describe('request handlers', () => {
    let mockServer: any;

    beforeEach(() => {
      // Access the internal server for testing request handlers
      mockServer = (server as any).server;
    });

    it('should handle list tools request', async () => {
      // Find the list tools handler
      const handlers = mockServer.setRequestHandler.mock.calls;
      const listToolsHandler = handlers.find(
        ([schema]: [unknown]) =>
          schema ===
          require('@modelcontextprotocol/sdk/types.js').ListToolsRequestSchema
      )?.[1];

      expect(listToolsHandler).toBeDefined();

      const result = await listToolsHandler();
      expect(result.tools).toBeDefined();
      expect(result.tools.length).toBeGreaterThan(0);
      expect(result.tools[0]).toHaveProperty('name');
      expect(result.tools[0]).toHaveProperty('description');
      expect(result.tools[0]).toHaveProperty('inputSchema');
    });

    it('should handle call tool request for existing tool', async () => {
      // Find the call tool handler
      const handlers = mockServer.setRequestHandler.mock.calls;
      const callToolHandler = handlers.find(
        ([schema]: [unknown]) =>
          schema ===
          require('@modelcontextprotocol/sdk/types.js').CallToolRequestSchema
      )?.[1];

      expect(callToolHandler).toBeDefined();

      const request = {
        params: {
          name: 'convert_color',
          arguments: {
            color: '#FF0000',
            output_format: 'rgb',
          },
        },
      };

      const result = await callToolHandler(request);
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
    });

    it('should handle call tool request for non-existent tool', async () => {
      // Find the call tool handler
      const handlers = mockServer.setRequestHandler.mock.calls;
      const callToolHandler = handlers.find(
        ([schema]: [unknown]) =>
          schema ===
          require('@modelcontextprotocol/sdk/types.js').CallToolRequestSchema
      )?.[1];

      expect(callToolHandler).toBeDefined();

      const request = {
        params: {
          name: 'non-existent-tool',
          arguments: {},
        },
      };

      const result = await callToolHandler(request);
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('TOOL_NOT_FOUND');
      expect(response.error.suggestions).toBeDefined();
    });

    it('should handle call tool request with execution error', async () => {
      // Mock a tool that throws an error
      const mockTool = {
        name: 'convert_color',
        description: 'Test tool',
        parameters: {},
        handler: jest.fn().mockRejectedValue(new Error('Test error')),
      };

      // Temporarily replace the tool
      jest.spyOn(toolRegistry, 'getTool').mockReturnValue(mockTool);

      // Find the call tool handler
      const handlers = mockServer.setRequestHandler.mock.calls;
      const callToolHandler = handlers.find(
        ([schema]: [unknown]) =>
          schema ===
          require('@modelcontextprotocol/sdk/types.js').CallToolRequestSchema
      )?.[1];

      expect(callToolHandler).toBeDefined();

      const request = {
        params: {
          name: 'convert_color',
          arguments: {
            color: '#FF0000',
            output_format: 'rgb',
          },
        },
      };

      const result = await callToolHandler(request);
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('EXECUTION_ERROR');
      expect(response.metadata.execution_time).toBeDefined();

      // Restore original implementation
      jest.restoreAllMocks();
    });

    it('should handle call tool request with no arguments', async () => {
      // Find the call tool handler
      const handlers = mockServer.setRequestHandler.mock.calls;
      const callToolHandler = handlers.find(
        ([schema]: [unknown]) =>
          schema ===
          require('@modelcontextprotocol/sdk/types.js').CallToolRequestSchema
      )?.[1];

      expect(callToolHandler).toBeDefined();

      const request = {
        params: {
          name: 'convert_color',
          // No arguments provided
        },
      };

      const result = await callToolHandler(request);
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');

      const response = JSON.parse(result.content[0].text);
      // Should handle missing arguments gracefully
      expect(response).toBeDefined();
    });

    it('should include error details in development mode', async () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'development';

      // Mock a tool that throws an error
      const mockTool = {
        name: 'convert_color',
        description: 'Test tool',
        parameters: {},
        handler: jest.fn().mockRejectedValue(new Error('Detailed test error')),
      };

      jest.spyOn(toolRegistry, 'getTool').mockReturnValue(mockTool);

      // Find the call tool handler
      const handlers = mockServer.setRequestHandler.mock.calls;
      const callToolHandler = handlers.find(
        ([schema]: [unknown]) =>
          schema ===
          require('@modelcontextprotocol/sdk/types.js').CallToolRequestSchema
      )?.[1];

      const request = {
        params: {
          name: 'convert_color',
          arguments: {},
        },
      };

      const result = await callToolHandler(request);
      const response = JSON.parse(result.content[0].text);

      expect(response.success).toBe(false);
      expect(response.error.details).toBe('Detailed test error');

      // Restore environment
      process.env['NODE_ENV'] = originalEnv;
      jest.restoreAllMocks();
    });
  });
});
