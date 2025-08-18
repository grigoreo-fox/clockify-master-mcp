# Contributing to Clockify Master MCP

Thank you for your interest in contributing to Clockify Master MCP! This guide will help you get started.

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ (LTS recommended)
- **Python** 3.8+ (for pre-commit hooks)
- **Git** 2.x

### Setup Development Environment

1. **Clone and install**
   ```bash
   git clone https://github.com/hongkongkiwi/mcp-clockify.git
   cd mcp-clockify
   npm install
   ```

2. **Install pre-commit hooks** (Recommended)
   ```bash
   # Install pre-commit (one time)
   pip install pre-commit
   
   # Install hooks for this project
   pre-commit install --install-hooks
   
   # Install commit message hook
   pre-commit install --hook-type commit-msg
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Clockify API key for testing
   ```

4. **Verify setup**
   ```bash
   npm run ci:check
   ```

## 🔧 Development Workflow

### Pre-commit Hooks
We use [pre-commit](https://pre-commit.com/) to ensure code quality. Hooks run automatically on every commit:

- **Code formatting** with Prettier
- **Linting** with ESLint
- **Type checking** with TypeScript  
- **Security scanning** for secrets
- **GitHub Actions** validation with actionlint
- **Conventional commits** enforcement

### Manual Pre-commit Run
```bash
# Run on all files
pre-commit run --all-files

# Run on staged files only
pre-commit run

# Run specific hook
pre-commit run prettier
```

### Available Scripts

```bash
# Development
npm run dev              # Watch mode development
npm run build           # Build for production
npm run start           # Run built version

# Quality Assurance
npm run lint            # ESLint
npm run typecheck       # TypeScript check
npm run format          # Prettier format
npm run format:check    # Check formatting
npm run test            # Run tests
npm run test:coverage   # Tests with coverage
npm run ci:check        # Full CI checks

# Release
npm run version:patch   # Patch release (1.0.0 → 1.0.1)
npm run version:minor   # Minor release (1.0.0 → 1.1.0)  
npm run version:major   # Major release (1.0.0 → 2.0.0)
```

## 📝 Contribution Guidelines

### Commit Messages
We use [Conventional Commits](https://conventionalcommits.org/):

```bash
feat: add new timer functionality
fix: resolve authentication timeout
docs: update API documentation
test: add integration tests
refactor: improve code structure
```

**Types:**
- `feat`: New features
- `fix`: Bug fixes  
- `docs`: Documentation changes
- `test`: Adding/updating tests
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes**
   - Follow existing code style
   - Add tests for new functionality
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm run ci:check
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add awesome new feature"
   git push origin feat/your-feature-name
   ```

5. **Create Pull Request**
   - Use descriptive title
   - Fill out PR template
   - Link related issues

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Enforced automatically
- **Prettier**: Auto-formatting on commit
- **Imports**: Absolute paths preferred
- **Comments**: JSDoc for public APIs

### Testing

- **Unit tests**: For individual functions
- **Integration tests**: For tool interactions  
- **E2E tests**: For complete workflows
- **Coverage**: Minimum 80% required

```bash
# Run specific test suites
npm run test test/unit/
npm run test test/integration/
npm run test test/e2e/
```

## 🏗️ Project Structure

```
├── src/
│   ├── api/           # Clockify API client
│   ├── config/        # Configuration management
│   ├── middleware/    # Request middleware  
│   ├── tools/         # MCP tool definitions
│   └── types/         # TypeScript types
├── test/
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   └── e2e/           # End-to-end tests
├── scripts/           # Build/utility scripts
└── .github/           # GitHub workflows
```

## 🎯 How to Contribute

### Reporting Bugs
- Use [GitHub Issues](https://github.com/hongkongkiwi/mcp-clockify/issues)
- Include reproduction steps
- Provide environment details
- Add relevant logs/screenshots

### Requesting Features
- Check existing issues first
- Describe the use case
- Explain expected behavior
- Consider implementation approach

### Contributing Code

**Good first issues:**
- Documentation improvements
- Test coverage increases
- Bug fixes with clear reproduction
- Small feature additions

**Advanced contributions:**
- New tool categories
- Performance optimizations
- Security enhancements
- Integration improvements

## 🔒 Security

- **No secrets in code**: Use environment variables
- **Validate inputs**: All user inputs must be validated
- **Secure defaults**: Fail-safe configurations
- **Regular updates**: Keep dependencies current

Report security issues privately to the maintainers.

## 📚 Resources

- **MCP Documentation**: [Model Context Protocol](https://modelcontextprotocol.io/)
- **Clockify API**: [API Documentation](https://docs.clockify.me/)
- **TypeScript**: [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- **Testing**: [Vitest Documentation](https://vitest.dev/)

## 🤝 Community

- **GitHub Discussions**: For questions and ideas
- **Issues**: For bugs and feature requests
- **Pull Requests**: For code contributions

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- GitHub contributors graph
- Release notes (for significant contributions)

---

**Questions?** Feel free to ask in [GitHub Discussions](https://github.com/hongkongkiwi/mcp-clockify/discussions) or open an issue!

Thank you for contributing to Clockify Master MCP! 🚀