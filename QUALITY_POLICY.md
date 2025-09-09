# Code Quality Policy

## CRITICAL: Quality Checks Are Mandatory

This project enforces strict quality standards to ensure reliable, maintainable code. **Quality checks must NEVER be bypassed.**

## Quality Standards

### 1. Zero-Defect Policy

- **No TypeScript errors** - All code must compile without errors
- **No ESLint warnings** - All linting rules must be followed
- **No failing tests** - All tests must pass
- **No formatting issues** - Code must be properly formatted

### 2. Test Coverage Requirements

- **90%+ statement coverage**
- **82%+ branch coverage** (target: 85%+)
- **95%+ function coverage**
- **90%+ line coverage**

### 3. Code Quality Standards

- No `any` types in TypeScript
- Proper error handling
- Comprehensive JSDoc comments
- Consistent code formatting

## Enforcement Mechanisms

### Pre-commit Hooks

- Automatic linting and formatting of staged files
- TypeScript type checking
- Code quality validation

### Pre-push Hooks

- Full test suite execution
- Build verification
- Final quality validation

### CI/CD Pipeline

- Automated quality checks on all pull requests
- Deployment blocked if quality checks fail

## Consequences of Bypassing Quality Checks

**Bypassing quality checks is strictly prohibited and will result in:**

1. **Immediate code review rejection**
2. **Requirement to fix all quality issues**
3. **Additional code review scrutiny**
4. **Potential rollback of changes**

## How to Handle Quality Check Failures

### If Pre-commit Fails:

1. Fix the reported issues
2. Re-stage your changes
3. Commit again

### If Pre-push Fails:

1. Run `npm test` locally to identify issues
2. Fix all failing tests and quality issues
3. Ensure `npm run build` succeeds
4. Push again

### If CI/CD Fails:

1. Check the CI logs for specific failures
2. Fix issues locally
3. Push the fixes

## Emergency Procedures

**There are NO emergency procedures that allow bypassing quality checks.**

If you believe you have a legitimate emergency:

1. Contact the team lead immediately
2. Document the emergency situation
3. Get explicit approval before proceeding
4. Create a follow-up task to address any technical debt

## Quality Tools

- **TypeScript**: Static type checking
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **Jest**: Testing framework with coverage reporting
- **Husky**: Git hooks for quality enforcement

## Remember

Quality is not optional. These checks exist to:

- Prevent bugs from reaching production
- Maintain code consistency
- Ensure long-term maintainability
- Protect the codebase integrity

**When in doubt, prioritize quality over speed.**
