/**
 * Test configuration for MCP Color Server
 * Allows tests to control file output behavior
 */

export interface TestConfig {
  enableFileOutput: boolean;
  testOutputDir: string;
  cleanupAfterTests: boolean;
}

class TestConfigManager {
  private static instance: TestConfigManager;
  private config: TestConfig;

  private constructor() {
    this.config = this.loadTestConfig();
  }

  public static getInstance(): TestConfigManager {
    if (!TestConfigManager.instance) {
      TestConfigManager.instance = new TestConfigManager();
    }
    return TestConfigManager.instance;
  }

  private loadTestConfig(): TestConfig {
    return {
      enableFileOutput: process.env['TEST_ENABLE_FILE_OUTPUT'] === 'true',
      testOutputDir: process.env['TEST_OUTPUT_DIR'] || './test-output',
      cleanupAfterTests: process.env['TEST_CLEANUP_FILES'] !== 'false',
    };
  }

  public getConfig(): TestConfig {
    return { ...this.config };
  }

  public enableFileOutput(): void {
    this.config.enableFileOutput = true;
  }

  public disableFileOutput(): void {
    this.config.enableFileOutput = false;
  }

  public isFileOutputEnabled(): boolean {
    return this.config.enableFileOutput;
  }

  public getTestOutputDir(): string {
    return this.config.testOutputDir;
  }

  public shouldCleanupAfterTests(): boolean {
    return this.config.cleanupAfterTests;
  }
}

export const testConfig = TestConfigManager.getInstance();
