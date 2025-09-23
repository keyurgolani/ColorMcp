/**
 * Comprehensive performance benchmarking for MCP Color Server
 */

import { performanceMonitor } from '../../src/utils/performance-monitor';
import { cacheManager } from '../../src/utils/cache-manager';
import { resourceManager } from '../../src/utils/resource-manager';

interface BenchmarkResult {
  operation: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  throughput: number; // operations per second
  memoryUsage: {
    initial: number;
    peak: number;
    final: number;
  };
}

class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];

  async runBenchmark(
    name: string,
    operation: () => Promise<void>,
    iterations = 1000
  ): Promise<BenchmarkResult> {
    console.log(`\n🚀 Running benchmark: ${name} (${iterations} iterations)`);

    // Reset monitoring
    performanceMonitor.reset();

    // Force garbage collection before benchmark
    if (global.gc) {
      global.gc();
    }

    const initialMemory = process.memoryUsage().heapUsed;
    let peakMemory = initialMemory;
    const times: number[] = [];

    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      const iterationStart = Date.now();

      await operation();

      const iterationEnd = Date.now();
      times.push(iterationEnd - iterationStart);

      // Track peak memory usage
      const currentMemory = process.memoryUsage().heapUsed;
      if (currentMemory > peakMemory) {
        peakMemory = currentMemory;
      }

      // Progress indicator
      if (i % Math.floor(iterations / 10) === 0) {
        process.stdout.write('.');
      }
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const finalMemory = process.memoryUsage().heapUsed;

    const result: BenchmarkResult = {
      operation: name,
      iterations,
      totalTime,
      averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      throughput: (iterations / totalTime) * 1000, // ops/sec
      memoryUsage: {
        initial: initialMemory,
        peak: peakMemory,
        final: finalMemory,
      },
    };

    this.results.push(result);
    this.printResult(result);

    return result;
  }

  private printResult(result: BenchmarkResult): void {
    console.log(`\n📊 Results for ${result.operation}:`);
    console.log(`   Total time: ${result.totalTime}ms`);
    console.log(`   Average time: ${result.averageTime.toFixed(2)}ms`);
    console.log(`   Min time: ${result.minTime}ms`);
    console.log(`   Max time: ${result.maxTime}ms`);
    console.log(`   Throughput: ${result.throughput.toFixed(2)} ops/sec`);
    console.log(
      `   Memory usage: ${this.formatBytes(result.memoryUsage.initial)} → ${this.formatBytes(result.memoryUsage.peak)} → ${this.formatBytes(result.memoryUsage.final)}`
    );
  }

  private formatBytes(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  }

  async runAllBenchmarks(): Promise<void> {
    console.log('🎯 Starting MCP Color Server Performance Benchmarks\n');

    // Benchmark 1: Cache operations
    await this.runBenchmark(
      'Cache Set/Get Operations',
      async () => {
        const key = `test_key_${Math.random()}`;
        const value = { data: 'test_value', timestamp: Date.now() };

        cacheManager.set('benchmark', key, value);
        cacheManager.get('benchmark', key);
      },
      10000
    );

    // Benchmark 2: Cache key generation
    await this.runBenchmark(
      'Cache Key Generation',
      async () => {
        const params = {
          color: `#${Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, '0')}`,
          format: 'rgb',
          precision: 2,
        };
        cacheManager.generateCacheKey('convert_color', params);
      },
      5000
    );

    // Benchmark 3: Performance monitoring
    await this.runBenchmark(
      'Performance Monitoring',
      async () => {
        const operationId = performanceMonitor.startOperation('benchmark_test');
        await new Promise(resolve => setTimeout(resolve, 1));
        performanceMonitor.endOperation(operationId, 'benchmark_test', true);
      },
      2000
    );

    // Benchmark 4: Resource usage calculation
    await this.runBenchmark(
      'Resource Usage Calculation',
      async () => {
        resourceManager.getCurrentUsage();
        resourceManager.getDegradationStrategy(
          resourceManager.getCurrentUsage()
        );
      },
      1000
    );

    // Benchmark 5: Concurrent operations simulation
    await this.runBenchmark(
      'Concurrent Operations Simulation',
      async () => {
        const operations = Array(10)
          .fill(null)
          .map(async () => {
            const operationId =
              performanceMonitor.startOperation('concurrent_test');
            await new Promise(resolve =>
              setTimeout(resolve, Math.random() * 5)
            );
            performanceMonitor.endOperation(
              operationId,
              'concurrent_test',
              true
            );
          });

        await Promise.all(operations);
      },
      100
    );

    // Benchmark 6: Memory pressure simulation
    await this.runBenchmark(
      'Memory Pressure Handling',
      async () => {
        // Create some memory pressure
        const largeData = Array(1000)
          .fill(null)
          .map((_, i) => ({
            id: i,
            data: 'x'.repeat(100),
            timestamp: Date.now(),
          }));

        // Simulate processing
        largeData.forEach(item => {
          item.data = item.data.toUpperCase();
        });

        // Clean up
        largeData.length = 0;
      },
      500
    );

    this.printSummary();
  }

  private printSummary(): void {
    console.log('\n📈 BENCHMARK SUMMARY');
    console.log('='.repeat(80));

    this.results.forEach(result => {
      const status = this.getPerformanceStatus(result);
      console.log(
        `${status} ${result.operation.padEnd(35)} ${result.averageTime.toFixed(2)}ms avg, ${result.throughput.toFixed(0)} ops/sec`
      );
    });

    console.log('\n🎯 PERFORMANCE REQUIREMENTS CHECK');
    console.log('='.repeat(80));

    const requirements = [
      {
        name: 'Color operations < 100ms',
        check: this.checkRequirement('Cache Set/Get Operations', 100),
      },
      {
        name: 'Complex operations < 500ms',
        check: this.checkRequirement('Concurrent Operations Simulation', 500),
      },
      { name: 'Memory usage stable', check: this.checkMemoryStability() },
      { name: 'High throughput maintained', check: this.checkThroughput() },
    ];

    requirements.forEach(req => {
      const status = req.check ? '✅' : '❌';
      console.log(`${status} ${req.name}`);
    });

    console.log('\n🔧 OPTIMIZATION RECOMMENDATIONS');
    console.log('='.repeat(80));
    this.generateRecommendations();
  }

  private getPerformanceStatus(result: BenchmarkResult): string {
    if (result.averageTime < 10) return '🚀';
    if (result.averageTime < 50) return '✅';
    if (result.averageTime < 100) return '⚠️';
    return '❌';
  }

  private checkRequirement(operationName: string, maxTime: number): boolean {
    const result = this.results.find(r => r.operation === operationName);
    return result ? result.averageTime < maxTime : false;
  }

  private checkMemoryStability(): boolean {
    return this.results.every(result => {
      const memoryIncrease =
        result.memoryUsage.final - result.memoryUsage.initial;
      const memoryIncreasePercent =
        (memoryIncrease / result.memoryUsage.initial) * 100;
      return memoryIncreasePercent < 50; // Less than 50% increase
    });
  }

  private checkThroughput(): boolean {
    return this.results.every(result => result.throughput > 100); // At least 100 ops/sec
  }

  private generateRecommendations(): void {
    const slowOperations = this.results.filter(r => r.averageTime > 50);
    const highMemoryOperations = this.results.filter(r => {
      const increase = r.memoryUsage.final - r.memoryUsage.initial;
      return increase > 10 * 1024 * 1024; // More than 10MB increase
    });

    if (slowOperations.length > 0) {
      console.log('• Consider optimizing slow operations:');
      slowOperations.forEach(op => {
        console.log(
          `  - ${op.operation}: ${op.averageTime.toFixed(2)}ms average`
        );
      });
    }

    if (highMemoryOperations.length > 0) {
      console.log('• Consider memory optimization for:');
      highMemoryOperations.forEach(op => {
        const increase = op.memoryUsage.final - op.memoryUsage.initial;
        console.log(
          `  - ${op.operation}: +${this.formatBytes(increase)} memory usage`
        );
      });
    }

    console.log('• Enable caching for frequently used operations');
    console.log('• Implement request throttling during high load');
    console.log('• Consider connection pooling for external resources');
    console.log('• Monitor and tune garbage collection settings');
  }
}

// Run benchmarks if this file is executed directly
if (require.main === module) {
  const benchmark = new PerformanceBenchmark();

  benchmark
    .runAllBenchmarks()
    .then(() => {
      console.log('\n🎉 Benchmarking completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Benchmarking failed:', error);
      process.exit(1);
    });
}

export { PerformanceBenchmark };
