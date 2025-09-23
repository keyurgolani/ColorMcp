# Contributing to MCP Color Server

We welcome contributions to the MCP Color Server! This document provides guidelines for contributing to the project.

## Code of Conduct

This project adheres to a [Code of Conduct](code-of-conduct.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- Git

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/mcp-color-server.git
   cd mcp-color-server
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Code Quality Standards

Before submitting any code, ensure it meets our quality standards:

#### TypeScript

- Use strict TypeScript with all compiler checks enabled
- Provide explicit type annotations for public APIs
- Avoid `any` types unless absolutely necessary
- Use proper error handling with typed exceptions

#### Testing

- Write unit tests for all new functionality
- Maintain minimum 90% code coverage
- Include integration tests for MCP protocol compliance
- Test edge cases and error conditions

#### Code Style

- Follow the ESLint configuration
- Use Prettier for code formatting
- Write clear, descriptive variable and function names
- Add JSDoc comments for public APIs

### Running Quality Checks

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format

# Testing
npm test

# Coverage report
npm run test:coverage

# Build verification
npm run build
```

## Contribution Guidelines

### Pull Request Process

1. **Create an Issue**: For significant changes, create an issue first to discuss the approach
2. **Branch Naming**: Use descriptive branch names (e.g., `feature/gradient-generation`, `fix/contrast-calculation`)
3. **Commit Messages**: Write clear, descriptive commit messages following conventional commits format
4. **Testing**: Ensure all tests pass and add new tests for your changes
5. **Documentation**: Update documentation for any API changes
6. **Code Review**: Submit a pull request and address review feedback

### Commit Message Format

Use conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:

```
feat(palette): add golden ratio harmony algorithm
fix(contrast): correct WCAG contrast calculation
docs(readme): update installation instructions
```

### Code Organization

#### File Structure

- `src/`: Source code
  - `server.ts`: Main MCP server implementation
  - `tools/`: Individual tool implementations
  - `validation/`: Joi validation schemas
  - `types/`: TypeScript type definitions
  - `utils/`: Utility functions and helpers
- `tests/`: Test files mirroring src structure
- `docs/`: Documentation files
- `examples/`: Usage examples

#### Naming Conventions

- Files: kebab-case (`color-converter.ts`)
- Classes: PascalCase (`ColorConverter`)
- Functions/Variables: camelCase (`convertColor`)
- Constants: SCREAMING_SNAKE_CASE (`DEFAULT_PRECISION`)
- Types/Interfaces: PascalCase (`ColorFormat`)

### Adding New Features

#### New Color Tools

1. Create tool implementation in `src/tools/`
2. Add validation schema in `src/validation/`
3. Register tool in main server
4. Add comprehensive tests
5. Update documentation

#### New Color Formats

1. Add format support to color parser
2. Update conversion algorithms
3. Add validation rules
4. Include in test suite
5. Document format specifications

### Testing Guidelines

#### Unit Tests

- Test individual functions and classes
- Mock external dependencies
- Cover edge cases and error conditions
- Use descriptive test names

#### Integration Tests

- Test MCP protocol compliance
- Verify tool registration and execution
- Test end-to-end workflows
- Validate JSON-RPC 2.0 compliance

#### Performance Tests

- Benchmark color operations
- Test memory usage under load
- Verify response time requirements
- Monitor resource cleanup

### Documentation Standards

#### Code Documentation

- Use JSDoc for all public APIs
- Include parameter types and descriptions
- Provide usage examples
- Document error conditions

#### API Documentation

- Keep tool descriptions up to date
- Include parameter schemas
- Provide example requests/responses
- Document error codes and messages

#### User Documentation

- Update README for new features
- Add usage examples
- Include troubleshooting guides
- Maintain changelog

## Security Guidelines

### Input Validation

- Validate all user inputs using Joi schemas
- Sanitize URLs and file paths
- Check parameter bounds and types
- Prevent code injection in generated outputs

### Error Handling

- Never expose internal system details
- Provide helpful but safe error messages
- Log security-relevant events
- Implement proper exception handling

### Dependencies

- Keep dependencies up to date
- Audit for security vulnerabilities
- Use minimal, well-maintained packages
- Document security considerations

## Release Process

### Version Management

- Follow semantic versioning (SemVer)
- Update version in package.json
- Create git tags for releases
- Maintain CHANGELOG.md

### Release Checklist

- [ ] All tests pass
- [ ] Code coverage meets requirements
- [ ] Documentation is updated
- [ ] Security audit passes
- [ ] Performance benchmarks pass
- [ ] Breaking changes are documented

## Getting Help

### Resources

- **Documentation**: Check the [docs/](docs/) directory
- **Examples**: See [examples/](examples/) for usage patterns
- **Issues**: Search existing [GitHub Issues](https://github.com/your-org/mcp-color-server/issues)
- **Discussions**: Join [GitHub Discussions](https://github.com/your-org/mcp-color-server/discussions)

### Contact

- Create an issue for bugs or feature requests
- Start a discussion for questions or ideas
- Follow the project for updates

Thank you for contributing to MCP Color Server!
