#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Script to run the dual PNG integration test
 */

import { execSync } from 'child_process';

try {
  console.log('Running dual PNG tools integration test...');

  // Run the test without coverage requirements
  execSync(
    'npx jest tests/tools/dual-png-tools-integration.test.ts --verbose',
    {
      stdio: 'inherit',
      cwd: process.cwd(),
    }
  );

  console.log('\n✅ Dual PNG integration test completed successfully!');
} catch (error) {
  console.error('\n❌ Dual PNG integration test failed:', error.message);
  process.exit(1);
}
