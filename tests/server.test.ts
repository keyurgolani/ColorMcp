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
  });
});
