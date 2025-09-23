/**
 * Centralized version management for MCP Color Server
 * This is the single source of truth for version information
 */

export const VERSION = '0.1.0';

export const VERSION_INFO = {
  version: VERSION,
  name: 'mcp-color-server',
  description:
    'A comprehensive MCP server for color manipulation and visualization',
  author: 'Keyur Golani <keyurrgolani@gmail.com>',
  license: 'MIT',
} as const;

/**
 * Get version information for different contexts
 */
export function getVersionInfo() {
  return VERSION_INFO;
}

/**
 * Get just the version string
 */
export function getVersion(): string {
  return VERSION;
}

/**
 * Check if a version string matches the current version
 */
export function isCurrentVersion(version: string): boolean {
  return version === VERSION;
}

/**
 * Get version for package.json format
 */
export function getPackageVersion() {
  return {
    version: VERSION,
    name: VERSION_INFO.name,
    description: VERSION_INFO.description,
    author: VERSION_INFO.author,
    license: VERSION_INFO.license,
  };
}
