# Husky Git Hooks Setup

This project uses [Husky](https://typicode.github.io/husky/) to enforce code quality standards and prevent regressions from being committed or pushed to the repository.

## Overview

The following Git hooks are configured to maintain our zero-defect policy:

### Pre-commit Hook (`.husky/pre-commit`)

Runs automatically before each commit and performs:

- **Linting**: ESLint checks on staged TypeScript files
- **Formatting**: Prettier formatting on staged files
- **Type Checking**: TypeScript compilation check on staged files

Uses `lint-staged` to only check files that are being committed, making the process fast and efficient.

### Pre-push Hook (`.husky/pre-push`)

Runs automatically before pushing to remote and performs:

- **Full Type Check**: Complete TypeScript compilation check
- **Test Coverage**: Runs full test suite with strict coverage requirements:
  - Statements: 90%
  - Branches: 85%
  - Functions: 95%
  - Lines: 90%
- **Build Verification**: Ensures the project builds successfully

### Commit Message Hook (`.husky/commit-msg`)

Validates commit messages follow conventional commit format:

```
<type>[optional scope]: <description>
```

**Allowed types:**

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes
- `revert`: Reverting previous commits

**Examples:**

- `feat: add color harmony generation`
- `fix(parser): handle invalid hex colors`
- `docs: update API documentation`
- `test: add palette generation tests`

## Configuration

### Lint-staged Configuration

Located in `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,js}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"],
    "*.ts": ["npm run type-check"]
  }
}
```

### Coverage Thresholds

Configured in `jest.config.js`:

```javascript
{
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 95,
      lines: 90,
      statements: 90,
    },
  }
}
```

## Bypassing Hooks (Emergency Use Only)

In rare cases where you need to bypass hooks:

```bash
# Skip pre-commit hooks
git commit --no-verify -m "emergency fix"

# Skip pre-push hooks
git push --no-verify
```

**⚠️ Warning:** Only use `--no-verify` in genuine emergencies. All bypassed checks must be resolved in follow-up commits.

## Troubleshooting

### Hook Not Running

If hooks aren't running, ensure they're executable:

```bash
chmod +x .husky/pre-commit .husky/pre-push .husky/commit-msg
```

### Coverage Failures

If tests fail due to coverage requirements:

1. Add missing tests for uncovered code
2. Remove dead/unused code
3. Check if coverage thresholds are appropriate for your changes

### Linting Failures

Fix linting issues with:

```bash
npm run lint:fix
```

### Type Check Failures

Fix TypeScript errors:

```bash
npm run type-check
```

### Build Failures

Ensure your code compiles:

```bash
npm run build
```

## Development Workflow

1. Make your changes
2. Stage files: `git add .`
3. Commit: `git commit -m "feat: your feature description"`
   - Pre-commit hook runs automatically
   - Commit message format is validated
4. Push: `git push`
   - Pre-push hook runs automatically
   - Full test suite and build verification

This ensures that only high-quality, tested code reaches the remote repository, maintaining our commitment to zero-defect development.
