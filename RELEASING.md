# Release Process

This document outlines the release process for Clockify Master MCP.

## 🚀 Quick Release Commands

```bash
# Patch release (bug fixes)
npm run version:patch

# Minor release (new features, backward compatible)
npm run version:minor

# Major release (breaking changes)
npm run version:major

# Pre-release (alpha, beta, rc)
npm run version:prerelease
```

## 📋 Release Types

### Patch Release (1.0.0 → 1.0.1)
- **When**: Bug fixes, security patches, documentation updates
- **Breaking**: No breaking changes
- **Command**: `npm run version:patch`

### Minor Release (1.0.0 → 1.1.0)
- **When**: New features, enhancements, new tool categories
- **Breaking**: No breaking changes (backward compatible)
- **Command**: `npm run version:minor`

### Major Release (1.0.0 → 2.0.0)
- **When**: Breaking changes, API changes, major refactoring
- **Breaking**: May include breaking changes
- **Command**: `npm run version:major`

### Pre-release (1.0.0 → 1.1.0-alpha.1)
- **When**: Testing new features, beta releases
- **Breaking**: May include breaking changes
- **Command**: `npm run version:prerelease`

## 🔄 Automated Release Process

### What Happens When You Run a Version Command:

1. **Quality Checks** (`npm run ci:check`)
   - TypeScript compilation
   - ESLint validation  
   - Full test suite with coverage
   
2. **Version Bump** (`npm version [type]`)
   - Updates `package.json` version
   - Updates `jsr.json` version automatically
   - Creates git tag (e.g., `v1.2.3`)
   - Creates git commit

3. **Trigger Release** (`npm run release:trigger`)
   - Pushes commits and tags to GitHub
   - Triggers automated release workflow

4. **Automated Workflow Execution**
   - 🏗️ Build and test package
   - 📝 Generate release notes
   - 🐙 Create GitHub release
   - 📦 Publish to NPM registry
   - 📦 Publish to JSR registry
   - ✅ Update release with publication status

## 📝 Release Notes Generation

Release notes are automatically generated from git commits using conventional commit format:

### Commit Types:
- `feat:` → ✨ Features
- `fix:` → 🐛 Bug Fixes  
- `perf:` → ⚡ Performance Improvements
- `refactor:` → ♻️ Code Refactoring
- `docs:` → 📚 Documentation
- `test:` → 🧪 Tests
- `chore:` → 🔧 Maintenance

### Example Commits:
```bash
feat: add bulk time entry operations
fix: resolve authentication timeout issue
docs: update API documentation
perf: optimize tool filtering performance
```

## 🛠️ Manual Release Process

If you need to perform a manual release:

### 1. Prepare Release
```bash
# Ensure you're on main branch
git checkout main
git pull origin main

# Run quality checks
npm run ci:check

# Generate changelog (optional)
npm run changelog
```

### 2. Version and Tag
```bash
# Choose appropriate version bump
npm version patch  # or minor/major
```

### 3. Push Changes
```bash
# Push commits and tags
git push origin main --follow-tags
```

### 4. Monitor Automation
- Check [GitHub Actions](https://github.com/hongkongkiwi/mcp-clockify/actions)
- Verify [GitHub Release](https://github.com/hongkongkiwi/mcp-clockify/releases)
- Confirm [NPM publication](https://www.npmjs.com/package/@hongkongkiwi/clockify-master-mcp)
- Confirm [JSR publication](https://jsr.io/@hongkongkiwi/clockify-master-mcp)

## 🔧 Advanced Release Options

### Dry Run
Test the release process without actually releasing:
```bash
npm run release:dry
```

### Manual Registry Publishing
If automated publishing fails:

```bash
# Build first
npm run build

# Publish to NPM
npm run publish:npm

# Publish to JSR  
npm run publish:jsr
```

### Pre-release Workflow
For alpha/beta releases:

```bash
# Create pre-release
npm version prerelease --preid=alpha
# or
npm version prerelease --preid=beta

# Push to trigger release
npm run release:trigger
```

## 📊 Release Checklist

### Before Release:
- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md reviewed
- [ ] Breaking changes documented
- [ ] Security scan clean

### During Release:
- [ ] Version command executed successfully
- [ ] Git tag created
- [ ] Changes pushed to GitHub
- [ ] GitHub Actions completed

### After Release:
- [ ] GitHub release created
- [ ] NPM package published
- [ ] JSR package published
- [ ] Documentation updated with new version
- [ ] Community notified (if major release)

## 🚨 Emergency Releases

For critical security fixes or major bugs:

### Hotfix Process:
1. Create hotfix branch from main
2. Make minimal necessary changes
3. Test thoroughly
4. Create patch release
5. Merge back to main

```bash
# Emergency patch release
git checkout main
git pull origin main

# Make critical fixes
# ... fix the issue ...

# Emergency release
npm run version:patch
```

## 🔍 Monitoring Releases

### Check Release Status:
- **GitHub Actions**: [View workflows](https://github.com/hongkongkiwi/mcp-clockify/actions)
- **NPM Package**: [View on NPM](https://www.npmjs.com/package/@hongkongkiwi/clockify-master-mcp)
- **JSR Package**: [View on JSR](https://jsr.io/@hongkongkiwi/clockify-master-mcp)
- **Download Stats**: Monitor adoption metrics

### Rollback Strategy:
If a release has critical issues:

1. **Immediate**: Deprecate problematic version on NPM
2. **Short-term**: Create hotfix release
3. **Communication**: Update GitHub release notes with warnings

## 🤝 Community Releases

### Version Guidelines:
- **Patch**: Weekly or as needed for bugs
- **Minor**: Monthly for new features  
- **Major**: Quarterly or for breaking changes
- **Pre-release**: As needed for testing

### Communication:
- GitHub Discussions for major releases
- Twitter/Social media for significant updates
- Documentation updates for all releases

## ❓ Troubleshooting

### Common Issues:

**Release workflow fails:**
- Check GitHub Actions logs
- Verify NPM_TOKEN secret is set
- Ensure all tests pass locally

**Version bump fails:**
- Ensure working directory is clean
- Check you're on main branch
- Verify npm is authenticated

**Publishing fails:**
- Check registry credentials
- Verify package.json configuration
- Check for naming conflicts

### Getting Help:
- Check [GitHub Issues](https://github.com/hongkongkiwi/mcp-clockify/issues)
- Review [GitHub Discussions](https://github.com/hongkongkiwi/mcp-clockify/discussions)
- Contact maintainers directly

---

**Remember**: Releases are permanent and public. Always test thoroughly before releasing!