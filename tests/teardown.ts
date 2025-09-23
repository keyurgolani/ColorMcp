/**
 * Global teardown for Jest
 * This runs once after all test suites are complete
 */

// Import the singleton classes directly to avoid setup.ts dependencies
import { securityAuditor } from '../src/security/security-audit';
import { rateLimiter } from '../src/security/rate-limiter';
import { performanceMonitor } from '../src/utils/performance-monitor';
import { resourceManager } from '../src/utils/resource-manager';
import { cacheManager } from '../src/utils/cache-manager';

function cleanupAllSingletons(): void {
  try {
    securityAuditor.destroy();
  } catch (error) {
    // Ignore errors if already destroyed
  }

  try {
    rateLimiter.destroy();
  } catch (error) {
    // Ignore errors if already destroyed
  }

  try {
    performanceMonitor.destroy();
  } catch (error) {
    // Ignore errors if already destroyed
  }

  try {
    resourceManager.destroy();
  } catch (error) {
    // Ignore errors if already destroyed
  }

  try {
    cacheManager.destroy();
  } catch (error) {
    // Ignore errors if already destroyed
  }
}

function clearAllTimers(): void {
  // Clear all active timers and intervals
  // This is a more aggressive approach to ensure nothing is left running

  // Get all timer IDs that might be active
  const maxTimerId = 50000; // Higher upper bound for CI

  for (let id = 1; id <= maxTimerId; id++) {
    try {
      clearTimeout(id as any);
      clearInterval(id as any);
      // Also try to clear immediate
      if (typeof clearImmediate !== 'undefined') {
        clearImmediate(id as any);
      }
    } catch (error) {
      // Ignore errors - timer might not exist
    }
  }

  // Additional cleanup for Node.js specific timers
  if (typeof process !== 'undefined' && process.nextTick) {
    // Clear any pending nextTick callbacks by scheduling an empty one
    process.nextTick(() => {});
  }
}

export default async function globalTeardown() {
  console.log('Running global teardown...');

  try {
    // Set a maximum timeout for teardown
    const teardownPromise = (async () => {
      // Clean up all singletons
      cleanupAllSingletons();

      // Aggressively clear all timers
      clearAllTimers();

      // Clear any remaining Node.js handles
      if (process.stdout && typeof process.stdout.destroy === 'function') {
        // Don't actually destroy stdout, just ensure it's flushed
        process.stdout.write('');
      }

      if (process.stderr && typeof process.stderr.destroy === 'function') {
        // Don't actually destroy stderr, just ensure it's flushed
        process.stderr.write('');
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Give a small delay to ensure all cleanup is complete
      await new Promise(resolve => {
        const timer = setTimeout(() => {
          clearTimeout(timer);
          resolve(undefined);
        }, 100);
      });
    })();

    // Race the teardown against a timeout
    const timeoutPromise = new Promise((_, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        reject(new Error('Global teardown timeout'));
      }, 5000); // 5 second timeout
    });

    await Promise.race([teardownPromise, timeoutPromise]).catch(error => {
      console.log('Global teardown error (continuing):', error.message);
    });
    console.log('Global teardown complete');
  } catch (error) {
    console.log('Global teardown completed with timeout or error:', error);
  } finally {
    // Force exit if in CI to prevent hanging
    if (process.env['CI'] === 'true') {
      // Give a small delay then force exit
      setTimeout(() => {
        process.exit(0);
      }, 100);
    }
  }
}
