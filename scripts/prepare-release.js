#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unused-vars, no-console */

/**
 * Release Preparation Script
 * Automates the release preparation process for MCP Color Server
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const PACKAGE_JSON_PATH = 'package.json';
const CHANGELOG_PATH = 'CHANGELOG.md';
const VERSION_FILE_PATH = 'src/version.ts';

class ReleasePreparation {
  constructor() {
    this.packageJson = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8'));
    this.currentVersion = this.packageJson.version;
    this.newVersion = null;
    this.releaseType = null;
    this.releaseNotes = [];
  }

  /**
   * Main release preparation workflow
   */
  async prepare() {
    console.log('🚀 MCP Color Server Release Preparation');
    console.log('=====================================\n');

    try {
      // Step 1: Validate current state
      await this.validateCurrentState();

      // Step 2: Determine version bump
      await this.determineVersionBump();

      // Step 3: Run comprehensive tests
      await this.runTests();

      // Step 4: Update version files
      await this.updateVersionFiles();

      // Step 5: Generate changelog
      await this.generateChangelog();

      // Step 6: Update documentation
      await this.updateDocumentation();

      // Step 7: Create release commit
      await this.createReleaseCommit();

      // Step 8: Generate release summary
      await this.generateReleaseSummary();

      console.log('✅ Release preparation completed successfully!');
      console.log(`📦 Ready to release version ${this.newVersion}`);
    } catch (error) {
      console.error('❌ Release preparation failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Validate current repository state
   */
  async validateCurrentState() {
    console.log('🔍 Validating current state...');

    // Check if we're on main branch
    const currentBranch = execSync('git branch --show-current', {
      encoding: 'utf8',
    }).trim();
    if (currentBranch !== 'main') {
      throw new Error(`Must be on main branch (currently on ${currentBranch})`);
    }

    // Check for uncommitted changes
    const gitStatus = execSync('git status --porcelain', {
      encoding: 'utf8',
    }).trim();
    if (gitStatus) {
      throw new Error('Repository has uncommitted changes');
    }

    // Check if we're up to date with remote
    try {
      execSync('git fetch origin main', { stdio: 'pipe' });
      const behind = execSync('git rev-list --count HEAD..origin/main', {
        encoding: 'utf8',
      }).trim();
      if (parseInt(behind) > 0) {
        throw new Error(
          'Local branch is behind remote. Please pull latest changes.'
        );
      }
    } catch (error) {
      console.warn('⚠️  Could not check remote status:', error.message);
    }

    console.log('✅ Repository state is clean');
  }

  /**
   * Determine version bump type
   */
  async determineVersionBump() {
    console.log('📈 Determining version bump...');

    // Get commits since last tag
    let commits = [];
    try {
      const lastTag = execSync('git describe --tags --abbrev=0', {
        encoding: 'utf8',
      }).trim();
      const commitRange = `${lastTag}..HEAD`;
      const commitLog = execSync(`git log ${commitRange} --oneline`, {
        encoding: 'utf8',
      }).trim();
      commits = commitLog.split('\n').filter(line => line.trim());
    } catch (error) {
      // No previous tags, get all commits
      const commitLog = execSync('git log --oneline', {
        encoding: 'utf8',
      }).trim();
      commits = commitLog.split('\n').filter(line => line.trim());
    }

    // Analyze commits for version bump type
    let hasMajor = false;
    let hasMinor = false;
    let hasPatch = false;

    for (const commit of commits) {
      const message = commit.toLowerCase();

      if (message.includes('breaking') || message.includes('major')) {
        hasMajor = true;
      } else if (message.includes('feat') || message.includes('feature')) {
        hasMinor = true;
      } else if (message.includes('fix') || message.includes('patch')) {
        hasPatch = true;
      }
    }

    // Determine release type
    if (hasMajor) {
      this.releaseType = 'major';
    } else if (hasMinor) {
      this.releaseType = 'minor';
    } else if (hasPatch) {
      this.releaseType = 'patch';
    } else {
      this.releaseType = 'patch'; // Default to patch
    }

    // Calculate new version
    const [major, minor, patch] = this.currentVersion.split('.').map(Number);

    switch (this.releaseType) {
      case 'major':
        this.newVersion = `${major + 1}.0.0`;
        break;
      case 'minor':
        this.newVersion = `${major}.${minor + 1}.0`;
        break;
      case 'patch':
        this.newVersion = `${major}.${minor}.${patch + 1}`;
        break;
    }

    console.log(
      `📊 Version bump: ${this.currentVersion} → ${this.newVersion} (${this.releaseType})`
    );
    console.log(`📝 Found ${commits.length} commits since last release`);
  }

  /**
   * Run comprehensive test suite
   */
  async runTests() {
    console.log('🧪 Running comprehensive test suite...');

    const testCommands = [
      'npm run type-check',
      'npm run lint',
      'npm run format:check',
      'npm run test:coverage:check',
      'npm run test:integration',
      'npm run test:security',
      'npm run build',
    ];

    for (const command of testCommands) {
      console.log(`  Running: ${command}`);
      try {
        execSync(command, { stdio: 'pipe' });
        console.log(`  ✅ ${command} passed`);
      } catch (error) {
        throw new Error(
          `Test failed: ${command}\n${error.stdout || error.message}`
        );
      }
    }

    console.log('✅ All tests passed');
  }

  /**
   * Update version in all relevant files
   */
  async updateVersionFiles() {
    console.log('📝 Updating version files...');

    // Update package.json
    this.packageJson.version = this.newVersion;
    writeFileSync(
      PACKAGE_JSON_PATH,
      JSON.stringify(this.packageJson, null, 2) + '\n'
    );
    console.log(`  ✅ Updated ${PACKAGE_JSON_PATH}`);

    // Update version.ts
    if (existsSync(VERSION_FILE_PATH)) {
      const versionContent = `/**
 * MCP Color Server Version
 * Auto-generated during release preparation
 */

export const VERSION = '${this.newVersion}';
export const BUILD_DATE = '${new Date().toISOString()}';
export const RELEASE_TYPE = '${this.releaseType}';

export function getVersionInfo() {
  return {
    version: VERSION,
    buildDate: BUILD_DATE,
    releaseType: RELEASE_TYPE,
    fullVersion: \`\${VERSION} (\${BUILD_DATE})\`
  };
}
`;
      writeFileSync(VERSION_FILE_PATH, versionContent);
      console.log(`  ✅ Updated ${VERSION_FILE_PATH}`);
    }

    console.log('✅ Version files updated');
  }

  /**
   * Generate or update changelog
   */
  async generateChangelog() {
    console.log('📋 Generating changelog...');

    const releaseDate = new Date().toISOString().split('T')[0];
    const releaseHeader = `## [${this.newVersion}] - ${releaseDate}`;

    // Get commits for changelog
    let commits = [];
    try {
      const lastTag = execSync('git describe --tags --abbrev=0', {
        encoding: 'utf8',
      }).trim();
      const commitRange = `${lastTag}..HEAD`;
      const commitLog = execSync(
        `git log ${commitRange} --pretty=format:"%s (%h)"`,
        { encoding: 'utf8' }
      ).trim();
      commits = commitLog.split('\n').filter(line => line.trim());
    } catch (error) {
      // No previous tags, get recent commits
      const commitLog = execSync('git log --pretty=format:"%s (%h)" -10', {
        encoding: 'utf8',
      }).trim();
      commits = commitLog.split('\n').filter(line => line.trim());
    }

    // Categorize commits
    const categories = {
      Added: [],
      Changed: [],
      Fixed: [],
      Security: [],
      Performance: [],
      Documentation: [],
    };

    for (const commit of commits) {
      const message = commit.toLowerCase();

      if (message.includes('feat') || message.includes('add')) {
        categories.Added.push(commit);
      } else if (message.includes('fix') || message.includes('bug')) {
        categories.Fixed.push(commit);
      } else if (message.includes('security') || message.includes('vuln')) {
        categories.Security.push(commit);
      } else if (message.includes('perf') || message.includes('performance')) {
        categories.Performance.push(commit);
      } else if (
        message.includes('docs') ||
        message.includes('documentation')
      ) {
        categories.Documentation.push(commit);
      } else {
        categories.Changed.push(commit);
      }
    }

    // Generate changelog entry
    let changelogEntry = `${releaseHeader}\n\n`;

    for (const [category, items] of Object.entries(categories)) {
      if (items.length > 0) {
        changelogEntry += `### ${category}\n\n`;
        for (const item of items) {
          changelogEntry += `- ${item}\n`;
        }
        changelogEntry += '\n';
      }
    }

    // Update or create changelog
    let changelogContent = '';
    if (existsSync(CHANGELOG_PATH)) {
      const existingChangelog = readFileSync(CHANGELOG_PATH, 'utf8');
      const lines = existingChangelog.split('\n');
      const headerIndex = lines.findIndex(line => line.startsWith('## ['));

      if (headerIndex >= 0) {
        // Insert new entry after the main header
        lines.splice(headerIndex, 0, changelogEntry);
        changelogContent = lines.join('\n');
      } else {
        changelogContent = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n${changelogEntry}${existingChangelog}`;
      }
    } else {
      changelogContent = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

${changelogEntry}`;
    }

    writeFileSync(CHANGELOG_PATH, changelogContent);
    console.log(`  ✅ Updated ${CHANGELOG_PATH}`);

    this.releaseNotes = changelogEntry.split('\n').slice(2); // Remove header
    console.log('✅ Changelog generated');
  }

  /**
   * Update documentation with new version
   */
  async updateDocumentation() {
    console.log('📚 Updating documentation...');

    // Update README version references
    if (existsSync('README.md')) {
      let readmeContent = readFileSync('README.md', 'utf8');

      // Update version badges or references
      readmeContent = readmeContent.replace(
        /version-\d+\.\d+\.\d+-/g,
        `version-${this.newVersion}-`
      );

      writeFileSync('README.md', readmeContent);
      console.log('  ✅ Updated README.md');
    }

    // Update API documentation
    const apiDocPath = 'docs/api-reference.md';
    if (existsSync(apiDocPath)) {
      let apiContent = readFileSync(apiDocPath, 'utf8');

      // Update version references in API docs
      apiContent = apiContent.replace(
        /Version: \d+\.\d+\.\d+/g,
        `Version: ${this.newVersion}`
      );

      writeFileSync(apiDocPath, apiContent);
      console.log('  ✅ Updated API documentation');
    }

    console.log('✅ Documentation updated');
  }

  /**
   * Create release commit and tag
   */
  async createReleaseCommit() {
    console.log('🏷️  Creating release commit...');

    // Stage all changes
    execSync('git add .');

    // Create release commit
    const commitMessage = `chore(release): prepare release ${this.newVersion}

- Update version to ${this.newVersion}
- Update changelog
- Update documentation
- Prepare for ${this.releaseType} release`;

    execSync(`git commit -m "${commitMessage}"`);
    console.log('  ✅ Created release commit');

    // Create tag
    const tagMessage = `Release ${this.newVersion}

${this.releaseNotes.slice(0, 10).join('\n')}`;

    execSync(`git tag -a v${this.newVersion} -m "${tagMessage}"`);
    console.log(`  ✅ Created tag v${this.newVersion}`);

    console.log('✅ Release commit and tag created');
  }

  /**
   * Generate release summary
   */
  async generateReleaseSummary() {
    console.log('📊 Generating release summary...');

    const summary = `
🚀 MCP Color Server Release ${this.newVersion}
${'='.repeat(50)}

📦 Version: ${this.currentVersion} → ${this.newVersion}
🏷️  Type: ${this.releaseType}
📅 Date: ${new Date().toISOString().split('T')[0]}

📋 Release Notes:
${this.releaseNotes.slice(0, 15).join('\n')}

🔧 Next Steps:
1. Review the changes: git show v${this.newVersion}
2. Push to remote: git push origin main --tags
3. Create GitHub release from tag v${this.newVersion}
4. Publish to npm: npm publish
5. Update deployment environments

📚 Documentation:
- Changelog: ${CHANGELOG_PATH}
- API Reference: docs/api-reference.md
- Release Notes: Available in git tag

🧪 Quality Assurance:
✅ All tests passed
✅ Code quality checks passed
✅ Security audit passed
✅ Documentation updated
✅ Version files updated

⚠️  Remember to:
- Test the release in a staging environment
- Verify all integrations work correctly
- Monitor for any issues after deployment
- Update any dependent projects

Happy releasing! 🎉
`;

    console.log(summary);

    // Save summary to file
    writeFileSync(`release-summary-${this.newVersion}.md`, summary);
    console.log(
      `📄 Release summary saved to release-summary-${this.newVersion}.md`
    );
  }
}

// Run the release preparation
if (import.meta.url === `file://${process.argv[1]}`) {
  const releasePrep = new ReleasePreparation();
  releasePrep.prepare().catch(error => {
    console.error('Release preparation failed:', error);
    process.exit(1);
  });
}

export { ReleasePreparation };
