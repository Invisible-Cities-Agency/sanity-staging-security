# Contributing to Sanity Staging Auth Bridge

Thank you for your interest in contributing to the Sanity Staging Auth Bridge plugin by Invisible Cities!

## Development Setup

### Prerequisites

- Node.js 20+ (we recommend using nvm)
- pnpm 8+
- Git
- SSL certificates for local HTTPS development

### Getting Started

1. Clone the repository:
```bash
git clone https://github.com/invisiblecities/sanity-staging-auth-bridge.git
cd sanity-staging-auth-bridge
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Run development server:
```bash
pnpm dev:https
```

## Development Guidelines

### Code Style

We follow these TypeScript guidelines:

1. **No `any` types** - Use branded unknown types for external data
2. **Runtime validation** - Use Zod for API boundaries
3. **JSDoc comments** - Document all public APIs
4. **Type safety first** - Prefer compile-time safety

### Testing

Write tests immediately after implementation:

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm type-check
```

### Commit Messages

Follow conventional commits:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Maintenance tasks

### Pull Request Process

1. Create a feature branch:
```bash
git checkout -b feat/your-feature-name
```

2. Make your changes following our guidelines

3. Ensure all tests pass:
```bash
pnpm test
pnpm type-check
pnpm lint
```

4. Update documentation if needed

5. Submit a pull request with:
   - Clear description of changes
   - Link to related issues
   - Screenshots for UI changes
   - Test coverage report

## Architecture

### Plugin Structure

```
staging-auth-bridge/
├── config/           # Centralized configuration
├── hooks/           # React hooks
├── types/           # TypeScript definitions
│   ├── branded.ts   # Branded unknown types
│   └── index.ts     # Type exports
├── utils/           # Utility functions
├── index.ts         # Plugin entry point
└── StudioAuthBridge.tsx  # Main component
```

### Key Concepts

1. **Branded Unknown Types**
   - Used for external data validation
   - Enables runtime type checking
   - Improves observability

2. **Configuration System**
   - Centralized in `config/index.ts`
   - Environment-based overrides
   - Platform detection

3. **Logging Strategy**
   - Multiple provider support
   - Level-based filtering
   - Structured logging

## Platform Support

### Vercel Edge Runtime

- Use Edge-compatible APIs only
- Avoid Node.js-specific modules
- Test with `vercel dev`

### Browser Compatibility

- Support modern browsers (Chrome, Firefox, Safari, Edge)
- Use standard Web APIs
- Polyfill when necessary

### React Versions

- Support React 18 (current)
- Prepare for React 19 (experimental)
- Use feature detection

## Security

### Reviewing Code

When reviewing security-sensitive code:

1. Check origin validation
2. Verify HTTPS usage
3. Review token handling
4. Audit logging for leaks

### Reporting Security Issues

Please report security vulnerabilities to skyline@invisiblecities.agency rather than public issues.

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Run full test suite
4. Create release PR
5. Tag release after merge
6. Publish to npm

## Questions?

- Open an issue for bugs/features
- Join discussions for questions
- Email skyline@invisiblecities.agency for private concerns

Thank you for contributing!

---

Built with ❤️ by [Invisible Cities](https://invisiblecities.com)