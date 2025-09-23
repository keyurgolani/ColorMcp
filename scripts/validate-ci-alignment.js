#!/usr/bin/env node

/**
 * Validate CI/CD Configuration Alignment
 *
 * This script ensures that:
 * 1. CI and local test configurations are aligned
 * 2. Coverage thresholds match between environments
 * 3. All required scripts are available
 * 4. GitHub workflow uses the same commands as local development
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🔍 Validating CI/CD Configuration Alignment...\n');

let hasErrors = false;

function logError(message) {
  console.error(`❌ ${message}`);
  hasErrors = true;
}

function logWarning(message) {
  console.warn(`⚠️  ${message}`);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

// 1. Check Jest configurations
function validateJestConfigs() {
  console.log('📋 Validating Jest configurations...');

  const baseConfigPath = join(rootDir, 'jest.config.js');
  const ciConfigPath = join(rootDir, 'jest.ci.config.js');

  if (!existsSync(baseConfigPath)) {
    logError('Base Jest config not found');
    return;
  }

  if (!existsSync(ciConfigPath)) {
    logError('CI Jest config not found');
    return;
  }

  try {
    // Read the CI config to extract coverage thresholds
    const ciConfigContent = readFileSync(ciConfigPath, 'utf8');

    // Extract coverage thresholds from CI config
    const ciThresholdMatch = ciConfigContent.match(
      /coverageThreshold:\s*{\s*global:\s*{([^}]+)}/s
    );
    if (!ciThresholdMatch) {
      logError('Could not find coverage thresholds in CI config');
      return;
    }

    const ciThresholds = {};
    const thresholdLines = ciThresholdMatch[1].split(',');
    thresholdLines.forEach(line => {
      const match = line.match(/(\w+):\s*(\d+)/);
      if (match) {
        ciThresholds[match[1]] = parseInt(match[2]);
      }
    });

    // Read base config
    const baseConfigContent = readFileSync(baseConfigPath, 'utf8');
    const baseThresholdMatch = baseConfigContent.match(
      /coverageThreshold:\s*{\s*global:\s*{([^}]+)}/s
    );
    if (!baseThresholdMatch) {
      logError('Could not find coverage thresholds in base config');
      return;
    }

    const baseThresholds = {};
    const baseThresholdLines = baseThresholdMatch[1].split(',');
    baseThresholdLines.forEach(line => {
      const match = line.match(/(\w+):\s*(\d+)/);
      if (match) {
        baseThresholds[match[1]] = parseInt(match[2]);
      }
    });

    // Compare thresholds
    const thresholdKeys = ['branches', 'functions', 'lines', 'statements'];
    let thresholdsMatch = true;

    thresholdKeys.forEach(key => {
      if (ciThresholds[key] !== baseThresholds[key]) {
        logError(
          `Coverage threshold mismatch for ${key}: CI=${ciThresholds[key]}, Base=${baseThresholds[key]}`
        );
        thresholdsMatch = false;
      }
    });

    if (thresholdsMatch) {
      logSuccess('Jest coverage thresholds are aligned');
    }
  } catch (error) {
    logError(`Error validating Jest configs: ${error.message}`);
  }
}

// 2. Check package.json scripts
function validatePackageScripts() {
  console.log('\n📦 Validating package.json scripts...');

  const packagePath = join(rootDir, 'package.json');
  if (!existsSync(packagePath)) {
    logError('package.json not found');
    return;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    const scripts = packageJson.scripts || {};

    const requiredScripts = [
      'build',
      'test',
      'test:ci',
      'lint',
      'format:check',
      'type-check',
    ];

    requiredScripts.forEach(script => {
      if (!scripts[script]) {
        logError(`Missing required script: ${script}`);
      } else {
        logSuccess(`Script '${script}' is defined`);
      }
    });
  } catch (error) {
    logError(`Error reading package.json: ${error.message}`);
  }
}

// 3. Check GitHub workflow
function validateGitHubWorkflow() {
  console.log('\n🔄 Validating GitHub workflow...');

  const workflowPath = join(rootDir, '.github/workflows/ci.yml');
  if (!existsSync(workflowPath)) {
    logError('GitHub workflow not found');
    return;
  }

  try {
    const workflowContent = readFileSync(workflowPath, 'utf8');

    // Check for required commands
    const requiredCommands = [
      'npm run lint',
      'npm run format:check',
      'npm run type-check',
      'npm run build',
      'npm run test:ci',
    ];

    requiredCommands.forEach(command => {
      if (workflowContent.includes(command)) {
        logSuccess(`Workflow includes: ${command}`);
      } else {
        logError(`Workflow missing command: ${command}`);
      }
    });

    // Check for Node.js version consistency
    const nodeVersionMatches = workflowContent.match(
      /node-version:\s*['"]?(\d+)['"]?/g
    );
    if (nodeVersionMatches && nodeVersionMatches.length > 0) {
      const versions = nodeVersionMatches.map(match => match.match(/\d+/)[0]);
      const uniqueVersions = [...new Set(versions)];

      if (uniqueVersions.length === 1) {
        logSuccess(`Consistent Node.js version: ${uniqueVersions[0]}`);
      } else {
        logWarning(
          `Multiple Node.js versions found: ${uniqueVersions.join(', ')}`
        );
      }
    }
  } catch (error) {
    logError(`Error reading GitHub workflow: ${error.message}`);
  }
}

// 4. Check environment configuration
function validateEnvironmentConfig() {
  console.log('\n🌍 Validating environment configuration...');

  // Check for required environment files
  const envFiles = ['.eslintrc.json', '.prettierrc', 'tsconfig.json'];

  envFiles.forEach(file => {
    const filePath = join(rootDir, file);
    if (existsSync(filePath)) {
      logSuccess(`Configuration file exists: ${file}`);
    } else {
      logError(`Missing configuration file: ${file}`);
    }
  });
}

// 5. Validate test structure
function validateTestStructure() {
  console.log('\n🧪 Validating test structure...');

  const testDirs = [
    'tests/color',
    'tests/tools',
    'tests/utils',
    'tests/security',
    'tests/performance',
    'tests/integration',
    'tests/quality-assurance',
  ];

  testDirs.forEach(dir => {
    const dirPath = join(rootDir, dir);
    if (existsSync(dirPath)) {
      logSuccess(`Test directory exists: ${dir}`);
    } else {
      logWarning(`Test directory missing: ${dir}`);
    }
  });
}

// Run all validations
async function main() {
  validateJestConfigs();
  validatePackageScripts();
  validateGitHubWorkflow();
  validateEnvironmentConfig();
  validateTestStructure();

  console.log('\n' + '='.repeat(50));

  if (hasErrors) {
    console.error('❌ CI/CD configuration validation failed!');
    console.error('Please fix the errors above before proceeding.');
    process.exit(1);
  } else {
    console.log('✅ CI/CD configuration validation passed!');
    console.log('Local and CI environments are properly aligned.');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('Validation script failed:', error);
  process.exit(1);
});
