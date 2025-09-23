# MCP Color Server - Client Configuration Examples

This document provides comprehensive configuration examples for integrating the MCP Color Server with various MCP-compatible clients and applications.

## Table of Contents

- [Claude Desktop](#claude-desktop)
- [Continue.dev](#continuedev)
- [Cody by Sourcegraph](#cody-by-sourcegraph)
- [Custom MCP Clients](#custom-mcp-clients)
- [Docker Deployment](#docker-deployment)
- [Production Configurations](#production-configurations)
- [Troubleshooting](#troubleshooting)

## Claude Desktop

### Basic Configuration

Add the MCP Color Server to your Claude Desktop configuration file:

**Location:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

```json
{
  "mcpServers": {
    "color-server": {
      "command": "node",
      "args": ["/path/to/mcp-color-server/dist/index.js"],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Advanced Configuration with Custom Settings

```json
{
  "mcpServers": {
    "color-server": {
      "command": "node",
      "args": ["/path/to/mcp-color-server/dist/index.js"],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info",
        "CACHE_SIZE": "256MB",
        "MAX_CONCURRENT_REQUESTS": "50",
        "REQUEST_TIMEOUT": "30000",
        "ENABLE_PERFORMANCE_MONITORING": "true"
      },
      "disabled": false,
      "autoApprove": [
        "convert_color",
        "analyze_color",
        "generate_harmony_palette"
      ],
      "disabledTools": []
    }
  }
}
```

### Using with NPM Global Installation

If you've installed the package globally:

```json
{
  "mcpServers": {
    "color-server": {
      "command": "mcp-color-server",
      "args": [],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Using with NPX

For automatic package management:

```json
{
  "mcpServers": {
    "color-server": {
      "command": "npx",
      "args": ["mcp-color-server@latest"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## Continue.dev

### Configuration in config.json

**Location:** `~/.continue/config.json`

```json
{
  "models": [
    {
      "title": "Claude 3.5 Sonnet",
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022",
      "apiKey": "your-api-key"
    }
  ],
  "mcpServers": [
    {
      "name": "color-server",
      "command": "node",
      "args": ["/path/to/mcp-color-server/dist/index.js"],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  ],
  "allowAnonymousTelemetry": false
}
```

### With Docker Integration

```json
{
  "models": [
    {
      "title": "Claude 3.5 Sonnet",
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022",
      "apiKey": "your-api-key"
    }
  ],
  "mcpServers": [
    {
      "name": "color-server",
      "command": "docker",
      "args": ["run", "--rm", "-i", "mcp-color-server:latest"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  ]
}
```

## Cody by Sourcegraph

### VS Code Extension Configuration

**Location:** VS Code Settings (JSON)

```json
{
  "cody.experimental.mcp.servers": {
    "color-server": {
      "command": "node",
      "args": ["/path/to/mcp-color-server/dist/index.js"],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Workspace-Specific Configuration

**Location:** `.vscode/settings.json` in your project

```json
{
  "cody.experimental.mcp.servers": {
    "color-server": {
      "command": "node",
      "args": ["./node_modules/mcp-color-server/dist/index.js"],
      "env": {
        "NODE_ENV": "development",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

## Custom MCP Clients

### Node.js Client Example

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

class ColorServerClient {
  constructor() {
    this.client = null;
    this.transport = null;
  }

  async connect() {
    // Spawn the color server process
    const serverProcess = spawn(
      'node',
      ['/path/to/mcp-color-server/dist/index.js'],
      {
        stdio: ['pipe', 'pipe', 'inherit'],
        env: {
          ...process.env,
          NODE_ENV: 'production',
          LOG_LEVEL: 'info',
        },
      }
    );

    // Create transport
    this.transport = new StdioClientTransport({
      stdin: serverProcess.stdin,
      stdout: serverProcess.stdout,
    });

    // Create client
    this.client = new Client(
      {
        name: 'color-client',
        version: "0.1.0"',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Connect
    await this.client.connect(this.transport);

    console.log('Connected to MCP Color Server');
  }

  async convertColor(color, outputFormat, precision = 2) {
    const result = await this.client.callTool({
      name: 'convert_color',
      arguments: {
        color,
        output_format: outputFormat,
        precision,
      },
    });

    return JSON.parse(result.content[0].text);
  }

  async generatePalette(baseColor, harmonyType, count = 5) {
    const result = await this.client.callTool({
      name: 'generate_harmony_palette',
      arguments: {
        base_color: baseColor,
        harmony_type: harmonyType,
        count,
      },
    });

    return JSON.parse(result.content[0].text);
  }

  async createVisualization(palette, layout = 'horizontal') {
    const result = await this.client.callTool({
      name: 'create_palette_html',
      arguments: {
        palette,
        layout,
        interactive: true,
      },
    });

    return JSON.parse(result.content[0].text);
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
    }
  }
}

// Usage example
async function main() {
  const colorClient = new ColorServerClient();

  try {
    await colorClient.connect();

    // Convert a color
    const converted = await colorClient.convertColor('#FF0000', 'hsl');
    console.log('Converted color:', converted.data.converted);

    // Generate a palette
    const palette = await colorClient.generatePalette(
      '#2563eb',
      'complementary',
      5
    );
    console.log('Generated palette:', palette.data.colors);

    // Create visualization
    const visualization = await colorClient.createVisualization(
      palette.data.colors,
      'grid'
    );
    console.log(
      'Visualization created, HTML length:',
      visualization.visualizations.html.length
    );
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await colorClient.disconnect();
  }
}

main();
```

### Python Client Example

```python
import asyncio
import json
import subprocess
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

class ColorServerClient:
    def __init__(self, server_path):
        self.server_path = server_path
        self.session = None

    async def connect(self):
        server_params = StdioServerParameters(
            command="node",
            args=[self.server_path],
            env={
                "NODE_ENV": "production",
                "LOG_LEVEL": "info"
            }
        )

        self.session = await stdio_client(server_params)
        await self.session.initialize()

    async def convert_color(self, color, output_format, precision=2):
        result = await self.session.call_tool(
            "convert_color",
            {
                "color": color,
                "output_format": output_format,
                "precision": precision
            }
        )

        return json.loads(result.content[0].text)

    async def generate_palette(self, base_color, harmony_type, count=5):
        result = await self.session.call_tool(
            "generate_harmony_palette",
            {
                "base_color": base_color,
                "harmony_type": harmony_type,
                "count": count
            }
        )

        return json.loads(result.content[0].text)

    async def close(self):
        if self.session:
            await self.session.close()

# Usage example
async def main():
    client = ColorServerClient("/path/to/mcp-color-server/dist/index.js")

    try:
        await client.connect()

        # Convert color
        result = await client.convert_color("#FF0000", "hsl", 3)
        print(f"Converted: {result['data']['converted']}")

        # Generate palette
        palette = await client.generate_palette("#2563eb", "complementary", 5)
        print(f"Palette: {palette['data']['colors']}")

    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(main())
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY dist/ ./dist/
COPY docs/ ./docs/

# Create non-root user
RUN addgroup -g 1001 -S colorserver && \
    adduser -S colorserver -u 1001

# Set permissions
RUN chown -R colorserver:colorserver /app
USER colorserver

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Expose port (if using HTTP mode)
EXPOSE 3000

# Start the server
CMD ["node", "dist/index.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  mcp-color-server:
    build: .
    container_name: mcp-color-server
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - CACHE_SIZE=256MB
      - MAX_CONCURRENT_REQUESTS=50
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ['CMD', 'node', '-e', "console.log('Health check')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    resource_limits:
      memory: 512M
      cpus: '1.0'
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
      - /app/logs
```

### Client Configuration for Docker

```json
{
  "mcpServers": {
    "color-server": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "--memory=512m",
        "--cpus=1.0",
        "--security-opt=no-new-privileges:true",
        "mcp-color-server:latest"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## Production Configurations

### High-Performance Configuration

```json
{
  "mcpServers": {
    "color-server": {
      "command": "node",
      "args": [
        "--max-old-space-size=2048",
        "--optimize-for-size",
        "/path/to/mcp-color-server/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "warn",
        "CACHE_SIZE": "512MB",
        "MAX_CONCURRENT_REQUESTS": "100",
        "REQUEST_TIMEOUT": "60000",
        "ENABLE_PERFORMANCE_MONITORING": "true",
        "ENABLE_CACHING": "true",
        "CACHE_TTL": "3600000"
      }
    }
  }
}
```

### Load Balancer Configuration

```json
{
  "mcpServers": {
    "color-server-1": {
      "command": "node",
      "args": ["/path/to/mcp-color-server/dist/index.js"],
      "env": {
        "NODE_ENV": "production",
        "SERVER_ID": "server-1",
        "PORT": "3001"
      }
    },
    "color-server-2": {
      "command": "node",
      "args": ["/path/to/mcp-color-server/dist/index.js"],
      "env": {
        "NODE_ENV": "production",
        "SERVER_ID": "server-2",
        "PORT": "3002"
      }
    }
  }
}
```

### Monitoring and Logging Configuration

```json
{
  "mcpServers": {
    "color-server": {
      "command": "node",
      "args": ["/path/to/mcp-color-server/dist/index.js"],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info",
        "LOG_FORMAT": "json",
        "LOG_FILE": "/var/log/mcp-color-server/server.log",
        "METRICS_ENABLED": "true",
        "METRICS_PORT": "9090",
        "HEALTH_CHECK_PORT": "8080"
      }
    }
  }
}
```

## Environment Variables Reference

### Core Configuration

- `NODE_ENV`: Environment mode (`development`, `production`, `test`)
- `LOG_LEVEL`: Logging level (`debug`, `info`, `warn`, `error`)
- `LOG_FORMAT`: Log format (`text`, `json`)
- `LOG_FILE`: Path to log file (optional)

### Performance Settings

- `CACHE_SIZE`: Memory cache size (default: `256MB`)
- `MAX_CONCURRENT_REQUESTS`: Maximum concurrent requests (default: `50`)
- `REQUEST_TIMEOUT`: Request timeout in milliseconds (default: `30000`)
- `ENABLE_CACHING`: Enable result caching (`true`, `false`)
- `CACHE_TTL`: Cache time-to-live in milliseconds (default: `3600000`)

### Resource Limits

- `MAX_MEMORY_USAGE`: Maximum memory usage (default: `512MB`)
- `MAX_CPU_USAGE`: Maximum CPU usage percentage (default: `80`)
- `MAX_FILE_SIZE`: Maximum file size for uploads (default: `50MB`)
- `MAX_PALETTE_SIZE`: Maximum colors per palette (default: `100`)

### Security Settings

- `ENABLE_RATE_LIMITING`: Enable rate limiting (`true`, `false`)
- `RATE_LIMIT_WINDOW`: Rate limit window in milliseconds (default: `60000`)
- `RATE_LIMIT_MAX`: Maximum requests per window (default: `100`)
- `ENABLE_INPUT_VALIDATION`: Enable strict input validation (`true`, `false`)

### Monitoring and Health

- `ENABLE_PERFORMANCE_MONITORING`: Enable performance monitoring (`true`, `false`)
- `METRICS_ENABLED`: Enable metrics collection (`true`, `false`)
- `METRICS_PORT`: Port for metrics endpoint (default: `9090`)
- `HEALTH_CHECK_PORT`: Port for health check endpoint (default: `8080`)

## Troubleshooting

### Common Issues

#### Server Won't Start

```bash
# Check Node.js version
node --version  # Should be 18.0.0 or higher

# Check if port is available
lsof -i :3000

# Check file permissions
ls -la /path/to/mcp-color-server/dist/index.js

# Test server directly
node /path/to/mcp-color-server/dist/index.js
```

#### Connection Timeout

```json
{
  "mcpServers": {
    "color-server": {
      "command": "node",
      "args": ["/path/to/mcp-color-server/dist/index.js"],
      "env": {
        "REQUEST_TIMEOUT": "60000",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

#### Memory Issues

```json
{
  "mcpServers": {
    "color-server": {
      "command": "node",
      "args": [
        "--max-old-space-size=4096",
        "/path/to/mcp-color-server/dist/index.js"
      ],
      "env": {
        "CACHE_SIZE": "128MB",
        "MAX_CONCURRENT_REQUESTS": "25"
      }
    }
  }
}
```

#### Performance Issues

```json
{
  "mcpServers": {
    "color-server": {
      "command": "node",
      "args": ["/path/to/mcp-color-server/dist/index.js"],
      "env": {
        "ENABLE_CACHING": "true",
        "CACHE_SIZE": "512MB",
        "ENABLE_PERFORMANCE_MONITORING": "true",
        "LOG_LEVEL": "warn"
      }
    }
  }
}
```

### Debug Configuration

```json
{
  "mcpServers": {
    "color-server": {
      "command": "node",
      "args": ["--inspect=9229", "/path/to/mcp-color-server/dist/index.js"],
      "env": {
        "NODE_ENV": "development",
        "LOG_LEVEL": "debug",
        "ENABLE_PERFORMANCE_MONITORING": "true"
      }
    }
  }
}
```

### Health Check Script

```bash
#!/bin/bash
# health-check.sh

SERVER_PID=$(pgrep -f "mcp-color-server")

if [ -z "$SERVER_PID" ]; then
    echo "❌ MCP Color Server is not running"
    exit 1
fi

# Test basic functionality
RESULT=$(echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node -e "
const { spawn } = require('child_process');
const server = spawn('node', ['/path/to/mcp-color-server/dist/index.js']);
let output = '';
server.stdout.on('data', (data) => output += data);
server.on('close', () => console.log(output));
process.stdin.pipe(server.stdin);
")

if [[ $RESULT == *"convert_color"* ]]; then
    echo "✅ MCP Color Server is healthy"
    exit 0
else
    echo "❌ MCP Color Server is not responding correctly"
    exit 1
fi
```

### Log Analysis

```bash
# Monitor server logs
tail -f /var/log/mcp-color-server/server.log

# Check for errors
grep -i error /var/log/mcp-color-server/server.log

# Monitor performance
grep -i "execution_time" /var/log/mcp-color-server/server.log | tail -20

# Check memory usage
grep -i "memory" /var/log/mcp-color-server/server.log | tail -10
```

This comprehensive configuration guide should help you integrate the MCP Color Server with any MCP-compatible client or deploy it in various environments. For additional support, please refer to the main documentation or create an issue in the project repository.
