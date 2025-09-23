# File-Based Visualization Output System

## Overview

The MCP Color Server implements a comprehensive file-based visualization output system that saves all generated visualizations (HTML, PNG, SVG) as files instead of returning large content in responses. This approach prevents context window overflow and provides users with persistent access to their visualizations.

## Environment Configuration

### Environment Variables

The system uses the following environment variables for configuration:

| Variable                       | Description                                     | Default                                | Example                     |
| ------------------------------ | ----------------------------------------------- | -------------------------------------- | --------------------------- |
| `COLOR_MCP_VISUALIZATIONS_DIR` | Base directory for saving visualizations        | `/tmp/mcp-color-server/visualizations` | `/home/user/visualizations` |
| `COLOR_MCP_MAX_FILE_AGE`       | Maximum file age in milliseconds before cleanup | `86400000` (24 hours)                  | `3600000` (1 hour)          |
| `COLOR_MCP_MAX_DIR_SIZE`       | Maximum directory size in bytes                 | `1073741824` (1GB)                     | `104857600` (100MB)         |
| `COLOR_MCP_ENABLE_CLEANUP`     | Enable automatic cleanup of old files           | `true`                                 | `false`                     |
| `COLOR_MCP_FILE_PREFIX`        | Prefix for generated file names                 | `mcp-color`                            | `my-project`                |

### Configuration Examples

#### Basic Setup

```bash
export COLOR_MCP_VISUALIZATIONS_DIR="/home/user/color-visualizations"
export COLOR_MCP_ENABLE_CLEANUP="true"
```

#### Development Setup

```bash
export COLOR_MCP_VISUALIZATIONS_DIR="./visualizations"
export COLOR_MCP_MAX_FILE_AGE="3600000"  # 1 hour
export COLOR_MCP_ENABLE_CLEANUP="false"  # Keep files for debugging
```

#### Production Setup

```bash
export COLOR_MCP_VISUALIZATIONS_DIR="/var/lib/mcp-color-server/visualizations"
export COLOR_MCP_MAX_FILE_AGE="86400000"  # 24 hours
export COLOR_MCP_MAX_DIR_SIZE="2147483648"  # 2GB
export COLOR_MCP_ENABLE_CLEANUP="true"
```

## File System Requirements

### Directory Structure

The system creates the following directory structure:

```
visualizations/
├── palettes/           # Palette visualizations
├── gradients/          # Gradient visualizations
├── themes/             # Theme preview visualizations
├── wheels/             # Color wheel visualizations
└── accessibility/      # Accessibility reports
```

### File Naming Convention

Files are named using the following pattern:

```
{prefix}-{type}-{timestamp}-{unique-id}.{extension}
```

Examples:

- `mcp-color-palette-2024-01-15T10-30-00-123Z-a1b2c3d4.html`
- `mcp-color-gradient-2024-01-15T10-30-00-456Z-e5f6g7h8-light.png`
- `mcp-color-wheel-2024-01-15T10-30-00-789Z-i9j0k1l2.svg`

### Dual Background PNG Files

PNG visualizations are generated with both light and dark background variants:

- Light background: `filename-light.png`
- Dark background: `filename-dark.png`

## API Response Format

### File-Based Response Structure

Instead of returning large content in responses, tools now return file paths:

```json
{
  "success": true,
  "data": {
    "colors": [...],
    "layout": "grid",
    "color_count": 5
  },
  "metadata": {
    "execution_time": 150,
    "tool": "create_palette_html",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "visualizations": {
    "html_file": {
      "file_path": "/path/to/visualizations/palette-2024-01-15T10-30-00-123Z-a1b2c3d4.html",
      "filename": "palette-2024-01-15T10-30-00-123Z-a1b2c3d4.html",
      "size": 15420,
      "created_at": "2024-01-15T10:30:00Z",
      "type": "html",
      "description": "Interactive color palette visualization"
    },
    "png_files": [
      {
        "file_path": "/path/to/visualizations/palette-2024-01-15T10-30-00-456Z-e5f6g7h8-light.png",
        "filename": "palette-2024-01-15T10-30-00-456Z-e5f6g7h8-light.png",
        "size": 25600,
        "created_at": "2024-01-15T10:30:00Z",
        "type": "png",
        "description": "Color palette PNG (light background)"
      },
      {
        "file_path": "/path/to/visualizations/palette-2024-01-15T10-30-00-456Z-e5f6g7h8-dark.png",
        "filename": "palette-2024-01-15T10-30-00-456Z-e5f6g7h8-dark.png",
        "size": 24800,
        "created_at": "2024-01-15T10:30:00Z",
        "type": "png",
        "description": "Color palette PNG (dark background)"
      }
    ]
  }
}
```

### Legacy Compatibility

For backward compatibility, tools can still return content directly when the file system is not available:

```json
{
  "success": true,
  "data": {...},
  "visualizations": {
    "html": "<!DOCTYPE html>...",
    "png_base64": "iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

## Security Features

### Path Validation

The system implements comprehensive security measures:

1. **Directory Traversal Prevention**: All file paths are validated to prevent `../` attacks
2. **Path Sanitization**: File names are sanitized to remove dangerous characters
3. **Allowed Directory Enforcement**: Files can only be created within the configured directory
4. **Suspicious Pattern Detection**: Blocks patterns like `~`, `..`, and reserved names

### Input Sanitization

File names and subdirectories are sanitized:

- Remove dangerous characters: `<>:"/\|?*`
- Block directory traversal: `../`, `..\\`
- Limit length to 100 characters
- Remove leading/trailing dots

### Example Security Validations

```typescript
// These inputs are automatically sanitized:
const maliciousName = "../../../etc/passwd<script>alert('xss')</script>";
// Becomes: "etcpasswdscriptalertxssscript"

const suspiciousSubdir = '../../tmp';
// Becomes: "tmp" (within allowed directory)
```

## File Management

### Automatic Cleanup

The system automatically cleans up old files based on:

1. **Age-based cleanup**: Files older than `COLOR_MCP_MAX_FILE_AGE` are removed
2. **Size-based cleanup**: When directory exceeds `COLOR_MCP_MAX_DIR_SIZE`, oldest files are removed first
3. **Scheduled cleanup**: Runs every hour when `COLOR_MCP_ENABLE_CLEANUP` is enabled

### Manual Cleanup

```typescript
import { fileOutputManager } from './utils/file-output-manager';

// Force cleanup regardless of settings
const result = await fileOutputManager.cleanup(true);
console.log(
  `Removed ${result.filesRemoved} files, freed ${result.bytesFreed} bytes`
);
```

### Directory Statistics

```typescript
const stats = await fileOutputManager.getDirectoryStats();
console.log(`Total files: ${stats.totalFiles}`);
console.log(`Total size: ${stats.totalSize} bytes`);
console.log(`Files by type:`, stats.filesByType);
```

## Error Handling

### Graceful Fallbacks

The system provides multiple fallback mechanisms:

1. **Directory Creation**: Automatically creates directories if they don't exist
2. **Permission Fallback**: Falls back to `/tmp` if primary directory is not writable
3. **Cleanup Errors**: Continues operation even if some files cannot be cleaned up
4. **File System Errors**: Provides detailed error messages with suggestions

### Error Examples

```json
{
  "success": false,
  "error": {
    "code": "FILE_SYSTEM_ERROR",
    "message": "Cannot create or write to directory: /readonly/path",
    "suggestions": [
      "Check directory permissions",
      "Ensure parent directory exists",
      "Try setting COLOR_MCP_VISUALIZATIONS_DIR to a writable location"
    ]
  }
}
```

## Performance Considerations

### File I/O Optimization

- **Async Operations**: All file operations use async/await for non-blocking I/O
- **Streaming**: Large files are handled with streaming when possible
- **Batch Operations**: Multiple files can be saved concurrently
- **Memory Management**: Buffers are properly disposed after use

### Caching Strategy

- **File Metadata Caching**: Recently accessed file information is cached
- **Directory Listing Cache**: Directory contents are cached for performance
- **Cleanup Scheduling**: Cleanup operations are batched and scheduled

### Performance Benchmarks

Target performance metrics:

- File save operations: < 100ms for typical HTML files
- PNG generation and save: < 2000ms for high-resolution images
- Directory cleanup: < 5000ms for directories with 1000+ files
- Concurrent operations: Support for 50+ simultaneous file operations

## Integration Examples

### Basic HTML Visualization

```typescript
import { enhancedFileOutputManager } from './utils/enhanced-file-output-manager';

const htmlContent = generatePaletteHTML(colors);
const result = await enhancedFileOutputManager.saveHTMLVisualization(
  htmlContent,
  {
    toolName: 'create_palette_html',
    description: 'Interactive color palette',
    subdirectory: 'palettes',
  }
);

return {
  success: true,
  data: { colors, layout: 'grid' },
  visualizations: result,
};
```

### Dual PNG Generation

```typescript
const lightPngBuffer = generatePNG(colors, 'light');
const darkPngBuffer = generatePNG(colors, 'dark');

const result = await enhancedFileOutputManager.saveDualPNGVisualization(
  lightPngBuffer,
  darkPngBuffer,
  {
    toolName: 'create_palette_png',
    description: 'Color palette PNG visualization',
    dimensions: [800, 600],
    resolution: 150,
    subdirectory: 'palettes',
  }
);
```

### Complete Visualization Set

```typescript
const htmlContent = generateHTML(data);
const lightPng = generatePNG(data, 'light');
const darkPng = generatePNG(data, 'dark');

const result = await enhancedFileOutputManager.saveCompleteVisualization(
  htmlContent,
  lightPng,
  darkPng,
  {
    toolName: 'create_theme_preview',
    description: 'Complete theme visualization',
    dimensions: [1200, 800],
    resolution: 150,
    subdirectory: 'themes',
  }
);
```

## Monitoring and Maintenance

### Health Checks

```typescript
// Check system health
const config = environmentConfig.getConfig();
const validation = environmentConfig.validateConfiguration();
const stats = await fileOutputManager.getDirectoryStats();

const health = {
  configuration_valid: validation.valid,
  directory_accessible: true, // Test write access
  total_files: stats.totalFiles,
  total_size: stats.totalSize,
  cleanup_enabled: config.enableCleanup,
};
```

### Maintenance Tasks

```bash
# Check directory size
du -sh $COLOR_MCP_VISUALIZATIONS_DIR

# Count files by type
find $COLOR_MCP_VISUALIZATIONS_DIR -name "*.html" | wc -l
find $COLOR_MCP_VISUALIZATIONS_DIR -name "*.png" | wc -l

# Manual cleanup of files older than 1 day
find $COLOR_MCP_VISUALIZATIONS_DIR -type f -mtime +1 -delete
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Check directory permissions: `chmod 755 $COLOR_MCP_VISUALIZATIONS_DIR`
   - Ensure parent directories exist
   - Verify user has write access

2. **Directory Not Found**
   - Create directory: `mkdir -p $COLOR_MCP_VISUALIZATIONS_DIR`
   - Check environment variable is set correctly
   - Verify path is absolute

3. **Disk Space Issues**
   - Check available space: `df -h $COLOR_MCP_VISUALIZATIONS_DIR`
   - Reduce `COLOR_MCP_MAX_DIR_SIZE`
   - Enable cleanup: `COLOR_MCP_ENABLE_CLEANUP=true`

4. **File Name Conflicts**
   - Files include unique IDs to prevent conflicts
   - Check system clock is correct
   - Verify multiple instances aren't using same directory

### Debug Mode

Enable debug logging to troubleshoot issues:

```bash
export LOG_LEVEL=debug
export COLOR_MCP_ENABLE_CLEANUP=false  # Preserve files for inspection
```

## Migration Guide

### From Content-Based to File-Based

1. **Update Client Code**: Modify clients to handle file paths instead of content
2. **Set Environment Variables**: Configure visualization directory
3. **Test File Access**: Ensure clients can access saved files
4. **Update Error Handling**: Handle file system errors appropriately

### Backward Compatibility

The system maintains backward compatibility by:

- Detecting client capabilities
- Falling back to content-based responses when needed
- Providing migration utilities for existing integrations

This file-based visualization system provides a robust, secure, and scalable solution for handling visualization outputs in the MCP Color Server while maintaining excellent performance and user experience.
