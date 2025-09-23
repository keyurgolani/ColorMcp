#!/usr/bin/env node

/**
 * Analyze differences between local test commands and pre-commit/pre-push hooks
 * This helps identify inconsistencies in quality checks
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Parse package.json scripts
function getPackageScripts() {
  const packagePath = join(projectRoot, 'package.json');
  const packageContent = JSON.parse(readFileSync(packagePath, 'utf8'));
  return packageContent.scripts;
}

// Parse husky hooks
function getHuskyHooks() {
  const preCommitPath = join(projectRoot, '.husky/pre-commit');
  const prePushPath = join(projectRoot, '.husky/pre-push');

  const preCommit = readFileSync(preCommitPath, 'utf8');
  const prePush = readFileSync(prePushPath, 'utf8');

  return { preCommit, prePush };
}

// Parse lint-staged configuration
function getLintStagedConfig() {
  const packagePath = join(projectRoot, 'package.json');
  const packageContent = JSON.parse(readFileSync(packagePath, 'utf8'));
  return packageContent['lint-staged'];
}

// Extract commands from script content
function extractCommands(content) {
  const commands = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('npm ') || trimmed.startsWith('npx ')) {
      commands.push(trimmed);
    }
  }

  return commands;
}

// Analyze script composition
function analyzeScript(scriptName, scriptContent) {
  if (!scriptContent) return [];

  const commands = [];
  const parts = scriptContent.split('&&').map(p => p.trim());

  for (const part of parts) {
    if (part.startsWith('npm run ')) {
      commands.push(part.replace('npm run ', ''));
    } else if (part.includes('npm ') || part.includes('npx ')) {
      commands.push(part);
    }
  }

  return commands;
}

// Main analysis function
function analyzeTestDifferences() {
  console.log('🔍 Analyzing test command differences...\n');

  const scripts = getPackageScripts();
  const hooks = getHuskyHooks();
  const lintStaged = getLintStagedConfig();

  console.log('📋 PACKAGE.JSON SCRIPTS:');
  console.log('========================');

  // Analyze main test scripts
  const testScripts = {
    test: scripts.test,
    'test:coverage:check': scripts['test:coverage:check'],
    lint: scripts.lint,
    'format:check': scripts['format:check'],
    'type-check': scripts['type-check'],
    'pre-commit': scripts['pre-commit'],
    'pre-push': scripts['pre-push'],
  };

  Object.entries(testScripts).forEach(([name, script]) => {
    if (script) {
      console.log(`${name}:`);
      console.log(`  ${script}`);
      const commands = analyzeScript(name, script);
      if (commands.length > 0) {
        console.log(`  → Runs: ${commands.join(', ')}`);
      }
      console.log('');
    }
  });

  console.log('🪝 HUSKY HOOKS:');
  console.log('===============');

  console.log('Pre-commit hook commands:');
  const preCommitCommands = extractCommands(hooks.preCommit);
  preCommitCommands.forEach(cmd => console.log(`  ${cmd}`));
  console.log('');

  console.log('Pre-push hook commands:');
  const prePushCommands = extractCommands(hooks.prePush);
  prePushCommands.forEach(cmd => console.log(`  ${cmd}`));
  console.log('');

  console.log('📝 LINT-STAGED CONFIGURATION:');
  console.log('=============================');
  Object.entries(lintStaged).forEach(([pattern, commands]) => {
    console.log(`${pattern}:`);
    commands.forEach(cmd => console.log(`  ${cmd}`));
    console.log('');
  });

  console.log('🔍 ANALYSIS RESULTS:');
  console.log('====================');

  // Analyze what each context runs
  const localTest = analyzeScript('test', scripts.test);
  const preCommitRuns = ['pre-commit', 'type-check', 'lint'];
  const prePushRuns = ['test', 'build', 'lint', 'type-check'];

  console.log('Local "npm test" runs:');
  localTest.forEach(cmd => console.log(`  ✓ ${cmd}`));
  console.log('');

  console.log('Pre-commit hook runs:');
  preCommitRuns.forEach(cmd => console.log(`  ✓ ${cmd}`));
  console.log('');

  console.log('Pre-push hook runs:');
  prePushRuns.forEach(cmd => console.log(`  ✓ ${cmd}`));
  console.log('');

  // Find differences
  console.log('⚠️  DIFFERENCES FOUND:');
  console.log('======================');

  const differences = [];

  // Check if pre-commit runs everything that local test does
  localTest.forEach(cmd => {
    if (!preCommitRuns.includes(cmd)) {
      differences.push(`Pre-commit missing: ${cmd}`);
    }
  });

  // Check if pre-push runs everything that local test does
  localTest.forEach(cmd => {
    if (!prePushRuns.includes(cmd)) {
      differences.push(`Pre-push missing: ${cmd}`);
    }
  });

  // Check for extra commands in hooks
  preCommitRuns.forEach(cmd => {
    if (!localTest.includes(cmd) && cmd !== 'pre-commit') {
      differences.push(`Pre-commit has extra: ${cmd}`);
    }
  });

  prePushRuns.forEach(cmd => {
    if (!localTest.includes(cmd) && cmd !== 'build') {
      differences.push(`Pre-push has extra: ${cmd}`);
    }
  });

  if (differences.length === 0) {
    console.log('✅ No significant differences found!');
  } else {
    differences.forEach(diff => console.log(`  ⚠️  ${diff}`));
  }

  console.log('\n💡 RECOMMENDATIONS:');
  console.log('===================');

  if (differences.length > 0) {
    console.log('1. Standardize commands across all contexts');
    console.log('2. Ensure pre-commit runs same checks as local tests');
    console.log('3. Ensure pre-push runs comprehensive validation');
    console.log('4. Consider creating unified test command');
  } else {
    console.log('✅ Test commands are well aligned!');
  }

  console.log('\n🎯 SUGGESTED UNIFIED APPROACH:');
  console.log('==============================');
  console.log(
    'Local test: type-check + lint + format:check + test:coverage:check'
  );
  console.log('Pre-commit: lint-staged + type-check + lint');
  console.log('Pre-push: full test suite + build + final validation');
}

analyzeTestDifferences();
