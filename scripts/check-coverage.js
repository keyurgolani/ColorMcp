#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Check if test coverage meets the required thresholds
 */
function checkCoverage() {
  const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
  
  if (!fs.existsSync(coveragePath)) {
    console.error('❌ Coverage summary not found. Run tests with coverage first.');
    process.exit(1);
  }

  const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
  const total = coverage.total;

  // Define thresholds (matching jest.config.js)
  const thresholds = {
    statements: 89,
    branches: 76,
    functions: 92,
    lines: 89
  };

  let passed = true;
  const results = [];

  for (const [metric, threshold] of Object.entries(thresholds)) {
    const actual = total[metric].pct;
    const status = actual >= threshold ? '✅' : '❌';
    
    if (actual < threshold) {
      passed = false;
    }

    results.push(`${status} ${metric}: ${actual}% (required: ${threshold}%)`);
  }

  console.log('\n📊 Coverage Report:');
  console.log('==================');
  results.forEach(result => console.log(result));

  if (passed) {
    console.log('\n🎉 All coverage thresholds met!');
    process.exit(0);
  } else {
    console.log('\n💥 Coverage thresholds not met. Please add more tests.');
    process.exit(1);
  }
}

checkCoverage();