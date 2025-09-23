/**
 * Global test setup and teardown for Jest
 * This ensures all singleton intervals are properly cleaned up
 */

import { securityAuditor } from '../src/security/security-audit';
import { rateLimiter } from '../src/security/rate-limiter';
import { performanceMonitor } from '../src/utils/performance-monitor';
import { resourceManager } from '../src/utils/resource-manager';
import { cacheManager } from '../src/utils/cache-manager';

// Global cleanup function
export function cleanupAllSingletons(): void {
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

// Clean up after each test to prevent test interference
afterEach(async () => {
  // Clean up singletons first
  cleanupAllSingletons();

  // Wait a bit for any async cleanup to complete
  await new Promise(resolve => setTimeout(resolve, 10));
});

// Clean up before each test as well
beforeEach(() => {
  // Reset singleton states
  try {
    securityAuditor.reset();
  } catch (error) {
    // Ignore if reset method doesn't exist
  }

  try {
    rateLimiter.reset();
  } catch (error) {
    // Ignore if reset method doesn't exist
  }

  try {
    performanceMonitor.reset();
  } catch (error) {
    // Ignore if reset method doesn't exist
  }
});
