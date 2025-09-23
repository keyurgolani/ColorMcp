# Release Process Guide

This document outlines the complete release process for MCP Color Server, including versioning strategy, quality gates, and deployment procedures.

## Versioning Strategy

### Semantic Versioning

MCP Color Server follows [Semantic Versioning (SemVer)](https://semver.org/) with the format `MAJOR.MINOR.PATCH`:

- **MAJOR** (X.0.0): Breaking changes, API incompatibilities
- **MINOR** (0.X.0): New features, backward-compatible additions
- **PATCH** (0.0.X): Bug fixes, security patches, backward-compatible changes

### Version Examples

```
0.1.0     - Initial development release
0.2.0     - New color format support (minor)
0.2.1     - Bug fix in color conversion (patch)
2.0.0     - Breaking API changes (major)
2.0.0-rc.1 - Release candidate
2.1.0-beta.1 - Beta version with new features
```

### Pre-release Versions

- **Alpha** (`0.1.0-alpha.1`): Early development, unstable
- **Beta** (`0.1.0-beta.1`): Feature-complete, testing phase
- **Release Candidate** (`0.1.0-rc.1`): Final testing before release

## Release Types

### Patch Release (0.0.X)

**When to Release:**

- Bug fixes
- Security patches
- Documentation updates
- Performance optimizations
- Dependency updates (non-breaking)

**Process:**

1. Create patch branch from main
2. Apply fixes and test thoroughly
3. Update CHANGELOG.md
4. Create pull request
5. Merge after review and CI passes
6. Tag and release

**Timeline:** As needed, typically within 1-2 days of fix

### Minor Release (0.X.0)

**When to Release:**

- New tools or features
- New color formats
- New export formats
- Performance improvements
- Backward-compatible API additions

**Process:**

1. Feature development on feature branches
2. Merge to develop branch
3. Integration testing
4. Update documentation
5. Update CHANGELOG.md
6. Create release branch
7. Final testing and bug fixes
8. Merge to main and tag

**Timeline:** Monthly or when significant features are ready

### Major Release (X.0.0)

**When to Release:**

- Breaking API changes
- Removal of deprecated features
- Significant architectural changes
- Major new capabilities

**Process:**

1. Extended development cycle (2-3 months)
2. Alpha releases for early feedback
3. Beta releases for broader testing
4. Release candidates for final validation
5. Migration guide preparation
6. Documentation overhaul
7. Community notification
8. Final release

**Timeline:** 6-12 months between major versions

## Release Process

### 1. Pre-Release Preparation

#### Code Quality Checklist

- [ ] All tests pass (unit, integration, performance)
- [ ] Code coverage ≥ 90%
- [ ] No TypeScript errors or ESLint warnings
- [ ] Security audit passes
- [ ] Performance benchmarks meet requirements
- [ ] Documentation is up to date

#### Version Planning

```bash
# Determine version type
npm version --help

# For patch release
npm version patch

# For minor release
npm version minor

# For major release
npm version major

# For pre-release
npm version prerelease --preid=beta
```

#### Update Documentation

- [ ] Update README.md with new features
- [ ] Update API documentation
- [ ] Update examples and tutorials
- [ ] Update migration guide (for breaking changes)
- [ ] Update CHANGELOG.md

### 2. Release Branch Creation

```bash
# Create release branch
git checkout -b release/v1.2.0

# Update version in package.json
npm version 1.2.0 --no-git-tag-version

# Update CHANGELOG.md
# Add release date and finalize notes

# Commit changes
git add .
git commit -m "chore: prepare release v1.2.0"

# Push release branch
git push origin release/v1.2.0
```

### 3. Quality Gates

#### Automated Testing

```bash
# Run full test suite
npm test

# Run performance tests
npm run test:performance

# Run security audit
npm audit

# Run load tests
npm run test:load

# Build and validate
npm run build
```

#### Manual Testing

- [ ] Test all major features manually
- [ ] Verify examples in documentation work
- [ ] Test installation from npm package
- [ ] Cross-platform testing (Windows, macOS, Linux)
- [ ] Performance validation under load

#### Security Review

- [ ] Dependency vulnerability scan
- [ ] Input validation testing
- [ ] XSS prevention verification
- [ ] Rate limiting validation
- [ ] Resource limit testing

### 4. Release Execution

#### Create GitHub Release

```bash
# Tag the release
git tag -a v1.2.0 -m "Release v1.2.0"

# Push tag
git push origin v1.2.0
```

This triggers the automated release workflow:

1. Validates the release
2. Runs full test suite
3. Builds the package
4. Publishes to npm
5. Creates GitHub release
6. Updates documentation

#### Manual Steps (if needed)

```bash
# Build for production
npm run build

# Create package
npm pack

# Publish to npm (automated in CI)
npm publish

# Create GitHub release (automated in CI)
gh release create v1.2.0 \
  --title "Release v1.2.0" \
  --notes-file RELEASE_NOTES.md \
  --verify-tag
```

### 5. Post-Release Tasks

#### Immediate Tasks

- [ ] Verify npm package is available
- [ ] Test installation from npm
- [ ] Update main branch with release changes
- [ ] Close milestone (if using GitHub milestones)
- [ ] Update project boards

#### Communication

- [ ] Announce release in GitHub Discussions
- [ ] Update documentation website
- [ ] Notify community channels
- [ ] Update integration examples

#### Next Development Cycle

```bash
# Bump version for next development
npm version patch --no-git-tag-version

# Add -dev suffix
# Update package.json version to "1.2.1-dev"

# Update CHANGELOG.md with new unreleased section
# Commit and push to main branch
```

## Release Automation

### GitHub Actions Workflows

#### CI Pipeline (`.github/workflows/ci.yml`)

- Runs on every push and pull request
- Code quality checks (lint, type-check, format)
- Test suite execution (unit, integration, performance)
- Security audit
- Cross-platform testing
- Documentation validation

#### Release Pipeline (`.github/workflows/release.yml`)

- Triggers on version tags (`v*.*.*`)
- Validates release readiness
- Builds and packages
- Publishes to npm
- Creates GitHub release
- Updates documentation

### Automated Quality Gates

```yaml
# Example quality gate configuration
quality_gates:
  test_coverage: 90%
  performance_regression: 0%
  security_vulnerabilities: 0
  documentation_coverage: 95%
  api_compatibility: 100%
```

## Rollback Procedures

### Emergency Rollback

If a critical issue is discovered after release:

```bash
# Unpublish from npm (within 24 hours)
npm unpublish mcp-color-server@1.2.0

# Or deprecate the version
npm deprecate mcp-color-server@1.2.0 "Critical bug, use 1.1.9 instead"

# Create hotfix
git checkout v1.1.9
git checkout -b hotfix/v1.1.10

# Apply fix and release patch version
npm version patch
# ... follow patch release process
```

### Planned Rollback

For planned rollbacks or version deprecation:

```bash
# Deprecate specific version
npm deprecate mcp-color-server@1.2.0 "Deprecated due to performance issues"

# Deprecate version range
npm deprecate mcp-color-server@">=1.2.0 <1.3.0" "Use version 1.3.0 or later"
```

## Version Support Policy

### Current Version (Latest)

- **Full Support**: New features, bug fixes, security patches
- **Response Time**: Critical issues within 24 hours
- **Update Frequency**: As needed

### Previous Minor Version (N-1)

- **Maintenance Support**: Bug fixes and security patches only
- **Response Time**: Critical issues within 48 hours
- **Duration**: Until next minor release + 3 months

### Previous Major Version (N-1.x.x)

- **Security Support**: Security patches only
- **Response Time**: Security issues within 72 hours
- **Duration**: 12 months after major release

### End of Life (EOL)

- **No Support**: Community support only
- **Recommendation**: Upgrade to supported version

## Release Calendar

### Regular Release Schedule

- **Patch Releases**: As needed (bug fixes, security)
- **Minor Releases**: Monthly (new features)
- **Major Releases**: Every 6-12 months (breaking changes)

### Special Releases

- **Security Releases**: Immediate (critical vulnerabilities)
- **Hotfix Releases**: Within 24-48 hours (critical bugs)
- **LTS Releases**: Every 18 months (long-term support)

## Release Checklist Template

### Pre-Release Checklist

#### Development Complete

- [ ] All planned features implemented
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Examples and tutorials verified
- [ ] Migration guide prepared (if breaking changes)

#### Quality Assurance

- [ ] All tests pass (unit, integration, e2e)
- [ ] Performance benchmarks meet requirements
- [ ] Security audit completed
- [ ] Cross-platform testing completed
- [ ] Load testing completed
- [ ] Memory leak testing completed

#### Documentation

- [ ] API documentation updated
- [ ] README.md updated
- [ ] CHANGELOG.md updated
- [ ] Migration guide updated
- [ ] Examples verified
- [ ] Troubleshooting guide updated

#### Release Preparation

- [ ] Version number updated
- [ ] Release notes prepared
- [ ] Breaking changes documented
- [ ] Deprecation notices added
- [ ] License compliance verified

### Release Execution Checklist

#### Automated Release

- [ ] Release branch created
- [ ] CI pipeline passes
- [ ] Release workflow triggered
- [ ] npm package published
- [ ] GitHub release created
- [ ] Documentation deployed

#### Manual Verification

- [ ] npm package installation tested
- [ ] GitHub release assets verified
- [ ] Documentation links working
- [ ] Examples still functional
- [ ] Performance within acceptable range

### Post-Release Checklist

#### Immediate Tasks

- [ ] Release announcement published
- [ ] Community notified
- [ ] Integration examples updated
- [ ] Monitoring alerts configured
- [ ] Support channels prepared

#### Follow-up Tasks

- [ ] User feedback collected
- [ ] Performance monitoring reviewed
- [ ] Error tracking reviewed
- [ ] Next release planning started
- [ ] Lessons learned documented

## Troubleshooting Release Issues

### Common Issues and Solutions

#### CI Pipeline Failures

```bash
# Check test failures
npm test -- --verbose

# Check build issues
npm run build -- --verbose

# Check linting issues
npm run lint -- --fix
```

#### npm Publishing Issues

```bash
# Check npm authentication
npm whoami

# Check package contents
npm pack --dry-run

# Verify version not already published
npm view mcp-color-server versions --json
```

#### GitHub Release Issues

```bash
# Check tag exists
git tag -l

# Verify tag points to correct commit
git show v1.2.0

# Check release workflow logs
gh run list --workflow=release.yml
```

### Emergency Contacts

- **Release Manager**: [Contact Information]
- **Security Team**: security@mcp-color-server.org
- **DevOps Team**: [Contact Information]
- **Community Manager**: [Contact Information]

## Metrics and Monitoring

### Release Metrics

- Time from code complete to release
- Number of bugs found post-release
- User adoption rate of new versions
- Performance impact of releases
- Security vulnerability response time

### Success Criteria

- Zero critical bugs in first 48 hours
- 95% of users upgrade within 30 days (minor releases)
- Performance regression < 5%
- Documentation accuracy > 95%
- Community satisfaction > 4.5/5

This comprehensive release process ensures high-quality, reliable releases while maintaining rapid development velocity and community trust.
