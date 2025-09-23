#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Sync version from centralized version.ts to all other files
 * This ensures version consistency across the entire project
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Read version from centralized location
function getVersionFromSource() {
  const versionFile = join(projectRoot, 'src/version.ts');
  const content = readFileSync(versionFile, 'utf8');

  // Extract version using regex
  const versionMatch = content.match(/export const VERSION = '([^']+)'/);
  if (!versionMatch) {
    throw new Error('Could not extract version from src/version.ts');
  }

  return versionMatch[1];
}

// Update package.json
function updatePackageJson(version) {
  const packagePath = join(projectRoot, 'package.json');
  const packageContent = JSON.parse(readFileSync(packagePath, 'utf8'));

  if (packageContent.version !== version) {
    packageContent.version = version;
    writeFileSync(packagePath, JSON.stringify(packageContent, null, 2) + '\n');
    console.log(`✅ Updated package.json version to ${version}`);
  } else {
    console.log(`✅ package.json version already correct: ${version}`);
  }
}

// Update README.md
function updateReadme(version) {
  const readmePath = join(projectRoot, 'README.md');
  let content = readFileSync(readmePath, 'utf8');

  // Update version references
  const oldContent = content;
  content = content.replace(
    /### Current Version \([^)]+\)/g,
    `### Current Version (${version})`
  );

  if (content !== oldContent) {
    writeFileSync(readmePath, content);
    console.log(`✅ Updated README.md version references to ${version}`);
  } else {
    console.log(`✅ README.md version references already correct: ${version}`);
  }
}

// Update docs/security.md
function updateSecurity(version) {
  const securityPath = join(projectRoot, 'docs/security.md');
  let content = readFileSync(securityPath, 'utf8');

  // Update version references
  const oldContent = content;
  const majorMinor = version.split('.').slice(0, 2).join('.');
  content = content.replace(
    /Security updates are released as patch versions \(e\.g\., [^)]+\)/g,
    `Security updates are released as patch versions (e.g., ${majorMinor}.1, ${majorMinor}.2)`
  );

  if (content !== oldContent) {
    writeFileSync(securityPath, content);
    console.log(`✅ Updated docs/security.md version references to ${version}`);
  } else {
    console.log(`✅ docs/security.md version references already correct`);
  }
}

// Update test files
function updateTests(version) {
  const testPath = join(projectRoot, 'tests/server.test.ts');
  let content = readFileSync(testPath, 'utf8');

  const oldContent = content;
  content = content.replace(
    /expect\(config\.version\)\.toBe\('[^']+'\)/g,
    `expect(config.version).toBe('${version}')`
  );

  if (content !== oldContent) {
    writeFileSync(testPath, content);
    console.log(`✅ Updated test files version references to ${version}`);
  } else {
    console.log(`✅ Test files version references already correct: ${version}`);
  }
}

// Update documentation files
function updateDocs(version) {
  const files = [
    'docs/api-reference.md',
    'docs/export-formats-guide.md',
    'examples/mcp-client-configurations.md',
  ];

  files.forEach(filePath => {
    const fullPath = join(projectRoot, filePath);
    try {
      let content = readFileSync(fullPath, 'utf8');
      const oldContent = content;

      // Update version references
      content = content.replace(/version.*1\.0\.0/g, `version: "${version}"`);
      content = content.replace(
        /"version": "1\.0\.0"/g,
        `"version": "${version}"`
      );

      if (content !== oldContent) {
        writeFileSync(fullPath, content);
        console.log(`✅ Updated ${filePath} version references to ${version}`);
      } else {
        console.log(`✅ ${filePath} version references already correct`);
      }
    } catch (error) {
      console.log(`⚠️  Could not update ${filePath}: ${error.message}`);
    }
  });
}

// Main function
function main() {
  try {
    console.log('🔄 Syncing version across project...');

    const version = getVersionFromSource();
    console.log(`📋 Current version from src/version.ts: ${version}`);

    updatePackageJson(version);
    updateReadme(version);
    updateSecurity(version);
    updateTests(version);
    updateDocs(version);

    console.log('✅ Version sync completed successfully!');
    console.log(`🎯 All files now reference version: ${version}`);
  } catch (error) {
    console.error('❌ Version sync failed:', error.message);
    process.exit(1);
  }
}

main();
