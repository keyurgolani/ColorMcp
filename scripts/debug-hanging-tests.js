#!/usr/bin/env node

/**
 * Debug Hanging Tests Script
 *
 * This script helps identify what might be causing tests to hang
 * by checking for common issues like unclosed intervals, promises, etc.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findFilesRecursively(dir, extension) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (
        stat.isDirectory() &&
        !item.startsWith('.') &&
        item !== 'node_modules'
      ) {
        traverse(fullPath);
      } else if (stat.isFile() && item.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  const warnings = [];

  // Check for setInterval without clearInterval
  const intervalMatches = content.match(/setInterval\s*\(/g) || [];
  const clearIntervalMatches = content.match(/clearInterval\s*\(/g) || [];

  if (intervalMatches.length > clearIntervalMatches.length) {
    issues.push(
      `Potential unclosed intervals: ${intervalMatches.length} setInterval vs ${clearIntervalMatches.length} clearInterval`
    );
  }

  // Check for setTimeout without clearTimeout
  const timeoutMatches = content.match(/setTimeout\s*\(/g) || [];
  const clearTimeoutMatches = content.match(/clearTimeout\s*\(/g) || [];

  if (timeoutMatches.length > clearTimeoutMatches.length * 2) {
    // Allow some leeway for timeouts
    warnings.push(
      `Many timeouts: ${timeoutMatches.length} setTimeout vs ${clearTimeoutMatches.length} clearTimeout`
    );
  }

  // Check for Promise without proper handling
  const promiseMatches = content.match(/new Promise\s*\(/g) || [];
  const awaitMatches = content.match(/await\s+/g) || [];
  const thenMatches = content.match(/\.then\s*\(/g) || [];
  const catchMatches = content.match(/\.catch\s*\(/g) || [];

  if (
    promiseMatches.length > 0 &&
    awaitMatches.length + thenMatches.length === 0
  ) {
    warnings.push(
      `Promises without await/then: ${promiseMatches.length} new Promise`
    );
  }

  if (promiseMatches.length + thenMatches.length > catchMatches.length) {
    warnings.push(
      `Promises without catch: ${promiseMatches.length + thenMatches.length} promises vs ${catchMatches.length} catch`
    );
  }

  // Check for event listeners without removal
  const addListenerMatches = content.match(/addEventListener\s*\(/g) || [];
  const removeListenerMatches =
    content.match(/removeEventListener\s*\(/g) || [];

  if (addListenerMatches.length > removeListenerMatches.length) {
    warnings.push(
      `Event listeners without removal: ${addListenerMatches.length} add vs ${removeListenerMatches.length} remove`
    );
  }

  // Check for process.nextTick without proper handling
  const nextTickMatches = content.match(/process\.nextTick\s*\(/g) || [];
  if (nextTickMatches.length > 0) {
    warnings.push(
      `Uses process.nextTick: ${nextTickMatches.length} occurrences`
    );
  }

  // Check for setImmediate without clearImmediate
  const immediateMatches = content.match(/setImmediate\s*\(/g) || [];
  const clearImmediateMatches = content.match(/clearImmediate\s*\(/g) || [];

  if (immediateMatches.length > clearImmediateMatches.length) {
    warnings.push(
      `Immediate without clear: ${immediateMatches.length} setImmediate vs ${clearImmediateMatches.length} clearImmediate`
    );
  }

  // Check for singleton patterns that might not be cleaned up
  if (content.includes('static instance') && !content.includes('destroy()')) {
    warnings.push('Singleton pattern without destroy method');
  }

  // Check for test environment detection
  const hasTestDetection =
    content.includes('NODE_ENV') && content.includes('test');
  if (
    (intervalMatches.length > 0 || immediateMatches.length > 0) &&
    !hasTestDetection
  ) {
    issues.push('Uses intervals/timers but lacks test environment detection');
  }

  return { issues, warnings };
}

function main() {
  console.log('🔍 Debugging hanging tests...\n');

  const projectRoot = path.resolve(__dirname, '..');
  const srcFiles = findFilesRecursively(path.join(projectRoot, 'src'), '.ts');
  const testFiles = findFilesRecursively(
    path.join(projectRoot, 'tests'),
    '.ts'
  );

  const allFiles = [...srcFiles, ...testFiles];

  let totalIssues = 0;
  let totalWarnings = 0;

  console.log(`Analyzing ${allFiles.length} files...\n`);

  for (const filePath of allFiles) {
    const relativePath = path.relative(projectRoot, filePath);
    const { issues, warnings } = analyzeFile(filePath);

    if (issues.length > 0 || warnings.length > 0) {
      console.log(`📄 ${relativePath}`);

      if (issues.length > 0) {
        console.log('  ❌ Issues:');
        issues.forEach(issue => console.log(`     - ${issue}`));
        totalIssues += issues.length;
      }

      if (warnings.length > 0) {
        console.log('  ⚠️  Warnings:');
        warnings.forEach(warning => console.log(`     - ${warning}`));
        totalWarnings += warnings.length;
      }

      console.log('');
    }
  }

  // Check Jest configuration
  console.log('🧪 Checking Jest configuration...');

  const jestConfigPath = path.join(projectRoot, 'jest.config.js');
  const jestCiConfigPath = path.join(projectRoot, 'jest.ci.config.js');

  if (fs.existsSync(jestConfigPath)) {
    const jestConfig = fs.readFileSync(jestConfigPath, 'utf8');

    if (!jestConfig.includes('forceExit: true')) {
      console.log('  ⚠️  Jest config missing forceExit: true');
      totalWarnings++;
    }

    if (!jestConfig.includes('detectOpenHandles')) {
      console.log('  ⚠️  Jest config missing detectOpenHandles setting');
      totalWarnings++;
    }

    if (!jestConfig.includes('globalTeardown')) {
      console.log('  ⚠️  Jest config missing globalTeardown');
      totalWarnings++;
    }
  }

  if (fs.existsSync(jestCiConfigPath)) {
    const jestCiConfig = fs.readFileSync(jestCiConfigPath, 'utf8');

    if (!jestCiConfig.includes('forceExit: true')) {
      console.log('  ❌ Jest CI config missing forceExit: true');
      totalIssues++;
    }

    if (!jestCiConfig.includes('detectOpenHandles: false')) {
      console.log('  ❌ Jest CI config should have detectOpenHandles: false');
      totalIssues++;
    }
  }

  // Summary
  console.log('\n📊 Summary:');
  console.log('='.repeat(40));
  console.log(`Total files analyzed: ${allFiles.length}`);
  console.log(`Issues found: ${totalIssues}`);
  console.log(`Warnings found: ${totalWarnings}`);

  if (totalIssues === 0 && totalWarnings === 0) {
    console.log('\n🎉 No obvious issues found that would cause hanging tests!');
  } else if (totalIssues > 0) {
    console.log(
      '\n🔧 Please address the issues above to prevent hanging tests.'
    );
    console.log('\nCommon fixes:');
    console.log('- Add clearInterval() for every setInterval()');
    console.log('- Add test environment detection before starting timers');
    console.log('- Implement destroy() methods for singletons');
    console.log('- Add proper error handling for promises');
  } else {
    console.log(
      '\n✅ No critical issues, but review warnings for potential improvements.'
    );
  }

  // Recommendations
  console.log('\n💡 Recommendations to prevent hanging tests:');
  console.log('- Use forceExit: true in Jest CI config');
  console.log('- Set detectOpenHandles: false in CI');
  console.log('- Implement proper cleanup in globalTeardown');
  console.log('- Check test environment before starting intervals');
  console.log('- Use shorter timeouts in CI');
  console.log('- Clear all timers aggressively in teardown');
}

main();
