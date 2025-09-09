/**
 * Main MCP Color Server implementation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { ServerConfig } from './types/index';
import { toolRegistry } from './tools/index';
import { logger } from './utils/logger';

// Import tools/index to ensure all tools are registered
import './tools/index';

export class ColorServer {
  private server: Server;
  private config: ServerConfig;

  constructor(config?: Partial<ServerConfig>) {
    this.config = {
      name: 'mcp-color-server',
      version: '1.0.0',
      description:
        'A comprehensive MCP server for color manipulation and visualization',
      ...config,
    };

    // Initialize MCP server
    this.server = new Server(
      {
        name: this.config.name,
        version: this.config.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupRequestHandlers();
    this.registerTools();

    logger.info(`${this.config.name} v${this.config.version} initialized`);
  }

  private setupRequestHandlers(): void {
    // Handle tool listing requests
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = toolRegistry.getAllTools();

      logger.debug(`Listing ${tools.length} available tools`);

      return {
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.parameters,
        })),
      };
    });

    // Handle tool execution requests
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;
      const startTime = Date.now();

      logger.info(`Executing tool: ${name}`, { tool: name });

      try {
        const tool = toolRegistry.getTool(name);

        if (!tool) {
          const executionTime = Date.now() - startTime;
          logger.warn(`Tool not found: ${name}`, { tool: name, executionTime });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    error: {
                      code: 'TOOL_NOT_FOUND',
                      message: `Tool '${name}' not found`,
                      suggestions: [
                        `Available tools: ${toolRegistry.getToolNames().join(', ')}`,
                        'Check the tool name spelling and try again',
                      ],
                    },
                    metadata: {
                      execution_time: executionTime,
                      tool: name,
                      timestamp: new Date().toISOString(),
                    },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // Execute the tool
        const result = await tool.handler(args || {});
        const executionTime = Date.now() - startTime;

        logger.logToolExecution(
          name,
          'Tool executed successfully',
          executionTime
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const executionTime = Date.now() - startTime;
        logger.error(`Tool execution failed: ${name}`, {
          tool: name,
          executionTime,
          error: error as Error,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: {
                    code: 'EXECUTION_ERROR',
                    message: 'Tool execution failed',
                    details:
                      process.env['NODE_ENV'] === 'development'
                        ? (error as Error).message
                        : undefined,
                  },
                  metadata: {
                    execution_time: executionTime,
                    tool: name,
                    timestamp: new Date().toISOString(),
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }
    });
  }

  private registerTools(): void {
    // All tools are automatically registered when tools/index.ts is imported
    // No need to manually register individual tools here

    const toolCount = toolRegistry.getAllTools().length;
    logger.info(
      `Registered ${toolCount} tools: ${toolRegistry.getToolNames().join(', ')}`
    );
  }

  public async start(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      logger.info(
        `${this.config.name} started successfully on stdio transport`
      );
    } catch (error) {
      logger.error('Failed to start server', { error: error as Error });
      throw error;
    }
  }

  public getConfig(): ServerConfig {
    return { ...this.config };
  }

  public getToolCount(): number {
    return toolRegistry.getAllTools().length;
  }
}

// Export for testing
export { toolRegistry };
