# MCP Color Server - Client Configuration Examples

This document provides comprehensive configuration examples for integrating MCP Color Server with various MCP clients and environments.

## Table of Contents

1. [Claude Desktop Configuration](#claude-desktop-configuration)
2. [Custom MCP Client Configuration](#custom-mcp-client-configuration)
3. [Docker Configuration](#docker-configuration)
4. [Development Environment Setup](#development-environment-setup)
5. [Production Deployment](#production-deployment)
6. [Environment Variables](#environment-variables)
7. [Troubleshooting](#troubleshooting)

## Claude Desktop Configuration

### Basic Configuration

Add the following to your Claude Desktop MCP configuration file:

**Location**:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "color": {
      "command": "node",
      "args": ["path/to/mcp-color-server/dist/index.js"],
      "env": {
        "COLOR_MCP_VISUALIZATIONS_DIR": "/Users/username/color-visualizations"
      }
    }
  }
}
```

### Advanced Configuration with Custom Settings

```json
{
  "mcpServers": {
    "mcp-color-server": {
      "command": "node",
      "args": ["path/to/mcp-color-server/dist/index.js"],
      "env": {
        "COLOR_MCP_VISUALIZATIONS_DIR": "/Users/username/Documents/color-visualizations",
        "COLOR_MCP_MAX_FILE_AGE": "86400000",
        "COLOR_MCP_MAX_DIRECTORY_SIZE": "1073741824",
        "COLOR_MCP_ENABLE_CLEANUP": "true",
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
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

### Configuration with NPM Global Installation

If you've installed MCP Color Server globally via npm:

```json
{
  "mcpServers": {
    "color": {
      "command": "mcp-color-server",
      "args": [],
      "env": {
        "COLOR_MCP_VISUALIZATIONS_DIR": "~/color-visualizations"
      }
    }
  }
}
```

### Configuration with UV/UVX (Recommended)

Using UV for Python-style package management:

```json
{
  "mcpServers": {
    "color": {
      "command": "uvx",
      "args": ["mcp-color-server@latest"],
      "env": {
        "COLOR_MCP_VISUALIZATIONS_DIR": "~/color-visualizations",
        "FASTMCP_LOG_LEVEL": "ERROR"
      }
    }
  }
}
```

## Custom MCP Client Configuration

### Node.js MCP Client

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const client = new Client(
  {
    name: 'color-client',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const transport = new StdioClientTransport({
  command: 'node',
  args: ['path/to/mcp-color-server/dist/index.js'],
  env: {
    COLOR_MCP_VISUALIZATIONS_DIR: './visualizations',
    NODE_ENV: 'development',
  },
});

await client.connect(transport);

// Example tool call
const result = await client.callTool({
  name: 'convert_color',
  arguments: {
    color: '#FF0000',
    output_format: 'hsl',
  },
});

console.log(result);
```

### Python MCP Client

```python
import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def main():
    server_params = StdioServerParameters(
        command="node",
        args=["path/to/mcp-color-server/dist/index.js"],
        env={
            "COLOR_MCP_VISUALIZATIONS_DIR": "./visualizations",
            "NODE_ENV": "production"
        }
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            # Initialize the session
            await session.initialize()

            # List available tools
            tools = await session.list_tools()
            print("Available tools:", [tool.name for tool in tools.tools])

            # Call a tool
            result = await session.call_tool(
                "convert_color",
                {
                    "color": "#FF0000",
                    "output_format": "rgb"
                }
            )
            print("Result:", result)

if __name__ == "__main__":
    asyncio.run(main())
```

## Docker Configuration

### Dockerfile for MCP Color Server

```dockerfile
FROM node:18-alpine

# Install system dependencies for Sharp and Canvas
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create visualizations directory
RUN mkdir -p /app/visualizations

# Set environment variables
ENV NODE_ENV=production
ENV COLOR_MCP_VISUALIZATIONS_DIR=/app/visualizations

# Expose port (if needed for health checks)
EXPOSE 3000

# Run the server
CMD ["node", "dist/index.js"]
```

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  mcp-color-server:
    build: .
    container_name: mcp-color-server
    environment:
      - NODE_ENV=production
      - COLOR_MCP_VISUALIZATIONS_DIR=/app/visualizations
      - COLOR_MCP_MAX_FILE_AGE=86400000
      - COLOR_MCP_ENABLE_CLEANUP=true
    volumes:
      - ./visualizations:/app/visualizations
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'node', '-e', 'process.exit(0)']
      interval: 30s
      timeout: 10s
      retries: 3
    mem_limit: 512m
    cpus: 1.0

  # Example MCP client service
  mcp-client:
    image: node:18-alpine
    depends_on:
      - mcp-color-server
    volumes:
      - ./client:/app
    working_dir: /app
    command: node client.js
    environment:
      - MCP_SERVER_HOST=mcp-color-server
      - MCP_SERVER_PORT=3000
```

### Claude Desktop with Docker

```json
{
  "mcpServers": {
    "color": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-v",
        "/Users/username/color-visualizations:/app/visualizations",
        "mcp-color-server:latest"
      ],
      "env": {
        "COLOR_MCP_VISUALIZATIONS_DIR": "/app/visualizations"
      }
    }
  }
}
```

## Development Environment Setup

### Local Development Configuration

```json
{
  "mcpServers": {
    "color-dev": {
      "command": "npm",
      "args": ["run", "dev"],
      "cwd": "/path/to/mcp-color-server",
      "env": {
        "NODE_ENV": "development",
        "COLOR_MCP_VISUALIZATIONS_DIR": "./dev-visualizations",
        "LOG_LEVEL": "debug",
        "COLOR_MCP_ENABLE_CLEANUP": "false"
      }
    }
  }
}
```

### Development with Hot Reload

```json
{
  "mcpServers": {
    "color-dev": {
      "command": "npx",
      "args": ["tsx", "watch", "src/index.ts"],
      "cwd": "/path/to/mcp-color-server",
      "env": {
        "NODE_ENV": "development",
        "COLOR_MCP_VISUALIZATIONS_DIR": "./dev-visualizations",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

### Testing Configuration

```json
{
  "mcpServers": {
    "color-test": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/mcp-color-server",
      "env": {
        "NODE_ENV": "test",
        "COLOR_MCP_VISUALIZATIONS_DIR": "./test-visualizations",
        "LOG_LEVEL": "error",
        "COLOR_MCP_MAX_FILE_AGE": "3600000"
      }
    }
  }
}
```

## Production Deployment

### PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'mcp-color-server',
      script: 'dist/index.js',
      cwd: '/opt/mcp-color-server',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        COLOR_MCP_VISUALIZATIONS_DIR:
          '/var/lib/mcp-color-server/visualizations',
        COLOR_MCP_MAX_FILE_AGE: '86400000',
        COLOR_MCP_ENABLE_CLEANUP: 'true',
        LOG_LEVEL: 'info',
      },
      error_file: '/var/log/mcp-color-server/error.log',
      out_file: '/var/log/mcp-color-server/out.log',
      log_file: '/var/log/mcp-color-server/combined.log',
      time: true,
      max_memory_restart: '500M',
      node_args: '--max-old-space-size=512',
    },
  ],
};
```

Claude Desktop configuration for PM2:

```json
{
  "mcpServers": {
    "color": {
      "command": "pm2",
      "args": ["start", "ecosystem.config.js", "--no-daemon"],
      "cwd": "/opt/mcp-color-server"
    }
  }
}
```

### Systemd Service

Create `/etc/systemd/system/mcp-color-server.service`:

```ini
[Unit]
Description=MCP Color Server
After=network.target

[Service]
Type=simple
User=mcp-color
Group=mcp-color
WorkingDirectory=/opt/mcp-color-server
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=COLOR_MCP_VISUALIZATIONS_DIR=/var/lib/mcp-color-server/visualizations
Environment=LOG_LEVEL=info
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mcp-color-server
KillMode=mixed
KillSignal=SIGINT
TimeoutStopSec=30

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/mcp-color-server
MemoryLimit=512M

[Install]
WantedBy=multi-user.target
```

Claude Desktop configuration for systemd:

```json
{
  "mcpServers": {
    "color": {
      "command": "systemd-run",
      "args": [
        "--user",
        "--scope",
        "node",
        "/opt/mcp-color-server/dist/index.js"
      ],
      "env": {
        "COLOR_MCP_VISUALIZATIONS_DIR": "/var/lib/mcp-color-server/visualizations"
      }
    }
  }
}
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-color-server
  labels:
    app: mcp-color-server
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mcp-color-server
  template:
    metadata:
      labels:
        app: mcp-color-server
    spec:
      containers:
        - name: mcp-color-server
          image: mcp-color-server:0.1.0
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: 'production'
            - name: COLOR_MCP_VISUALIZATIONS_DIR
              value: '/app/visualizations'
            - name: LOG_LEVEL
              value: 'info'
          resources:
            requests:
              memory: '256Mi'
              cpu: '250m'
            limits:
              memory: '512Mi'
              cpu: '500m'
          volumeMounts:
            - name: visualizations
              mountPath: /app/visualizations
          livenessProbe:
            exec:
              command:
                - node
                - -e
                - 'process.exit(0)'
            initialDelaySeconds: 30
            periodSeconds: 30
          readinessProbe:
            exec:
              command:
                - node
                - -e
                - 'process.exit(0)'
            initialDelaySeconds: 5
            periodSeconds: 10
      volumes:
        - name: visualizations
          persistentVolumeClaim:
            claimName: mcp-color-visualizations
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mcp-color-visualizations
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

## Environment Variables

### Complete Environment Variable Reference

```bash
# Core Configuration
NODE_ENV=production                    # Environment: development, test, production
LOG_LEVEL=info                        # Logging: error, warn, info, debug

# File System Configuration
COLOR_MCP_VISUALIZATIONS_DIR=/path/to/visualizations  # Visualization output directory
COLOR_MCP_MAX_FILE_AGE=86400000       # Max file age in milliseconds (24 hours)
COLOR_MCP_MAX_DIRECTORY_SIZE=1073741824  # Max directory size in bytes (1GB)
COLOR_MCP_ENABLE_CLEANUP=true         # Enable automatic file cleanup

# Performance Configuration
COLOR_MCP_CACHE_SIZE=268435456        # Cache size in bytes (256MB)
COLOR_MCP_MAX_CONCURRENT=50           # Maximum concurrent requests
COLOR_MCP_REQUEST_TIMEOUT=30000       # Request timeout in milliseconds

# Security Configuration
COLOR_MCP_RATE_LIMIT=100              # Requests per minute per client
COLOR_MCP_MAX_MEMORY_PER_REQUEST=104857600  # Max memory per request (100MB)
COLOR_MCP_ENABLE_SECURITY_AUDIT=true  # Enable security audit logging

# Development Configuration
COLOR_MCP_DEBUG=false                 # Enable debug mode
COLOR_MCP_PROFILE=false               # Enable performance profiling
COLOR_MCP_MOCK_FILE_SYSTEM=false     # Mock file system for testing
```

### Environment-Specific Configurations

#### Development Environment

```bash
NODE_ENV=development
LOG_LEVEL=debug
COLOR_MCP_VISUALIZATIONS_DIR=./dev-visualizations
COLOR_MCP_ENABLE_CLEANUP=false
COLOR_MCP_DEBUG=true
COLOR_MCP_PROFILE=true
```

#### Testing Environment

```bash
NODE_ENV=test
LOG_LEVEL=error
COLOR_MCP_VISUALIZATIONS_DIR=./test-visualizations
COLOR_MCP_MAX_FILE_AGE=3600000
COLOR_MCP_ENABLE_CLEANUP=true
COLOR_MCP_MOCK_FILE_SYSTEM=true
```

#### Production Environment

```bash
NODE_ENV=production
LOG_LEVEL=info
COLOR_MCP_VISUALIZATIONS_DIR=/var/lib/mcp-color-server/visualizations
COLOR_MCP_MAX_FILE_AGE=86400000
COLOR_MCP_MAX_DIRECTORY_SIZE=1073741824
COLOR_MCP_ENABLE_CLEANUP=true
COLOR_MCP_RATE_LIMIT=100
COLOR_MCP_ENABLE_SECURITY_AUDIT=true
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Server Not Starting

**Problem**: MCP Color Server fails to start

**Solutions**:

```bash
# Check Node.js version
node --version  # Should be 18.0.0 or higher

# Check dependencies
npm install

# Check build
npm run build

# Check permissions
ls -la dist/index.js

# Run with debug logging
LOG_LEVEL=debug node dist/index.js
```

#### 2. File System Permissions

**Problem**: Cannot write visualization files

**Solutions**:

```bash
# Check directory permissions
ls -la /path/to/visualizations

# Create directory with proper permissions
mkdir -p /path/to/visualizations
chmod 755 /path/to/visualizations

# Check disk space
df -h /path/to/visualizations
```

#### 3. Memory Issues

**Problem**: Out of memory errors

**Solutions**:

```bash
# Increase Node.js memory limit
node --max-old-space-size=1024 dist/index.js

# Check memory usage
ps aux | grep node

# Configure memory limits
export COLOR_MCP_MAX_MEMORY_PER_REQUEST=52428800  # 50MB
```

#### 4. Performance Issues

**Problem**: Slow response times

**Solutions**:

```bash
# Enable profiling
export COLOR_MCP_PROFILE=true

# Check cache configuration
export COLOR_MCP_CACHE_SIZE=536870912  # 512MB

# Monitor performance
npm run test:performance
```

#### 5. Claude Desktop Integration

**Problem**: Claude Desktop doesn't recognize the server

**Solutions**:

1. Check configuration file location and syntax
2. Verify file paths are absolute
3. Check server executable permissions
4. Review Claude Desktop logs
5. Test server independently

```json
{
  "mcpServers": {
    "color": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-color-server/dist/index.js"],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

### Debugging Commands

```bash
# Test server directly
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/index.js

# Check tool availability
npm run test -- --testNamePattern="tool registration"

# Validate configuration
node -e "console.log(JSON.parse(require('fs').readFileSync('claude_desktop_config.json')))"

# Monitor file system
watch -n 1 'ls -la /path/to/visualizations'

# Check memory usage
node --expose-gc -e "
const server = require('./dist/index.js');
setInterval(() => {
  global.gc();
  console.log(process.memoryUsage());
}, 5000);
"
```

### Performance Monitoring

```bash
# Monitor response times
time echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"convert_color","arguments":{"color":"#FF0000","output_format":"rgb"}}}' | node dist/index.js

# Memory profiling
node --inspect dist/index.js

# CPU profiling
node --prof dist/index.js
```

### Log Analysis

```bash
# Filter error logs
grep "ERROR" /var/log/mcp-color-server/combined.log

# Monitor real-time logs
tail -f /var/log/mcp-color-server/combined.log

# Analyze performance logs
grep "execution_time" /var/log/mcp-color-server/combined.log | awk '{print $NF}' | sort -n
```

This comprehensive configuration guide should help you set up MCP Color Server in any environment. For additional support, please refer to the [troubleshooting documentation](../docs/troubleshooting.md) or create an issue on GitHub.
