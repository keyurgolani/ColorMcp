/**
 * Test file manager for handling test output files
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';

export class TestFileManager {
  private static instance: TestFileManager;
  private testOutputDir: string;

  private constructor() {
    this.testOutputDir = process.env['TEST_OUTPUT_DIR'] || './test-output';
  }

  public static getInstance(): TestFileManager {
    if (!TestFileManager.instance) {
      TestFileManager.instance = new TestFileManager();
    }
    return TestFileManager.instance;
  }

  public async ensureTestOutputDir(): Promise<void> {
    if (!existsSync(this.testOutputDir)) {
      await fs.mkdir(this.testOutputDir, { recursive: true });
    }
  }

  public async cleanupTestFiles(): Promise<void> {
    if (existsSync(this.testOutputDir)) {
      try {
        const files = await fs.readdir(this.testOutputDir);
        await Promise.all(
          files.map(file =>
            fs.unlink(join(this.testOutputDir, file)).catch(() => {
              // Ignore errors - file might already be deleted
            })
          )
        );
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  public getTestOutputDir(): string {
    return this.testOutputDir;
  }

  public async getTestFiles(): Promise<string[]> {
    if (!existsSync(this.testOutputDir)) {
      return [];
    }

    try {
      return await fs.readdir(this.testOutputDir);
    } catch (error) {
      return [];
    }
  }
}

export const testFileManager = TestFileManager.getInstance();
