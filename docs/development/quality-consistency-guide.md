# Quality Consistency Guide

This document outlines the standardized quality checks across all development contexts in the MCP Color Server project.

## Version Management

### Centralized Version Control

All version information is now managed from a single source of truth:

**📍 Single Source of Truth: `src/version.ts`**

```typescript
export const VERSION = '0.1.0';

export const VERSION_INFO = {
  version: VERSION,
  name: 'mcp-color-server',
  description:
    'A comprehensive MCP server for color manipulation and visualization',
  author: 'MCP Color Server Contributors',
  license: 'MIT',
} as const;
```

### Version Synchronization

Use the version sync script to update all references:

```bash
npm run version:sync
```

This script updates:

- `package.json`
- `README.md`
- `SECURITY.md`
- Test files
- Documentation files
- Example configurations

### Files That Reference Version

The following files automatically get their version from the centralized source:

1. **`src/server.ts`** - Server configuration
2. **`src/tools/export-json.ts`** - JSON export default version
3. **`package.json`** - NPM package version
4. **`tests/server.test.ts`** - Version validation tests
5. **Documentation files** - API references and examples

## Quality Check Consistency

### Unified Test Commands

All quality checks are now consistent across different contexts:

#### Local Development (`npm test`)

```bash
npm run type-check &&
npm run lint &&
npm run format:check &&
npm run test:coverage:check
```

#### Pre-commit Hook

```bash
# Lint-staged (automatic fixing for staged files)
npm run pre-commit

# Same checks as local test
npm run type-check
npm run format:check
npm run lint
```

#### Pre-push Hook

```bash
# Full test suite (includes all local test checks)
npm test

# Build verification
npm run build
```

### Quality Check Matrix

| Check                  | Local Test | Pre-commit | Pre-push | Description              |
| ---------------------- | ---------- | ---------- | -------- | ------------------------ |
| TypeScript Compilation | ✅         | ✅         | ✅       | `tsc --noEmit`           |
| ESLint                 | ✅         | ✅         | ✅       | Code quality rules       |
| Prettier Format Check  | ✅         | ✅         | ✅       | Code formatting          |
| Jest Coverage          | ✅         | ❌         | ✅       | Test coverage thresholds |
| Lint-staged            | ❌         | ✅         | ❌       | Auto-fix staged files    |
| Build Verification     | ❌         | ❌         | ✅       | Ensure code compiles     |

### Lint-staged Configuration

Automatic fixes applied to staged files:

```json
{
  "*.{ts,js}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"],
  "src/**/*.ts": ["bash -c 'tsc --noEmit'"]
}
```

## Quality Standards

### Coverage Thresholds

```json
{
  "global": {
    "statements": 90,
    "branches": 78,
    "functions": 94,
    "lines": 90
  }
}
```

### ESLint Configuration

- TypeScript strict mode
- Prettier integration
- No `any` types allowed
- Comprehensive error detection

### TypeScript Configuration

- Strict mode enabled
- No implicit any
- Strict null checks
- No unused locals/parameters

## Scripts and Commands

### Development Scripts

```bash
# Run all quality checks locally
npm test

# Run tests with coverage
npm run test:coverage

# Check types only
npm run type-check

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Fix formatting
npm run format

# Sync version across project
npm run version:sync

# Analyze test consistency
npm run version:check
```

### Release Scripts

```bash
# Prepare release (includes version sync)
npm run release:prepare

# Validate release readiness
npm run release:validate

# Run all test suites
npm run test:all
```

## Consistency Verification

### Automated Analysis

Run the consistency analysis tool:

```bash
npm run version:check
```

This script:

- Compares local test commands with hook commands
- Identifies missing or extra checks
- Provides recommendations for consistency
- Ensures all contexts run appropriate quality checks

### Manual Verification

1. **Version Consistency**: All files should reference the same version
2. **Test Consistency**: Pre-commit and pre-push should include all local test checks
3. **Build Consistency**: Code should build successfully in all environments

## Best Practices

### For Developers

1. **Always run `npm test` before committing**
2. **Use `npm run version:sync` when updating versions**
3. **Don't bypass quality checks** - they protect code integrity
4. **Fix issues locally** rather than relying on hooks to catch them

### For Maintainers

1. **Keep hooks in sync with local tests**
2. **Update version in `src/version.ts` only**
3. **Run consistency analysis after changes**
4. **Maintain high coverage thresholds**

### For CI/CD

1. **Use same commands as local development**
2. **Fail fast on quality issues**
3. **Ensure build verification**
4. **Maintain audit trails**

## Troubleshooting

### Common Issues

1. **Version Mismatch**: Run `npm run version:sync`
2. **Test Inconsistency**: Run `npm run version:check` and follow recommendations
3. **Hook Failures**: Ensure local tests pass first
4. **Build Issues**: Run `npm run build` locally

### Quality Check Failures

1. **TypeScript Errors**: Fix type issues, don't use `any`
2. **Linting Errors**: Run `npm run lint:fix` or fix manually
3. **Format Issues**: Run `npm run format`
4. **Coverage Issues**: Add tests to meet thresholds

This guide ensures consistent, high-quality code across all development contexts while maintaining a single source of truth for version management.
