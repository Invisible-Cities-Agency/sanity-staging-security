# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-07-11

### Security
- **CRITICAL**: Replace Math.random() with crypto.randomUUID() for cryptographically secure token generation
- **CRITICAL**: Fix async config initialization race condition with module-level loading
- Add CSRF protection with nonce validation for PostMessage communication
- Harden logging to redact sensitive data in production environments

### Added
- Throttling mechanism for validateSession() calls to prevent API spam
- Comprehensive unit tests for RoleUtils with 100% coverage
- Next.js API contract documentation with implementation examples
- Testing infrastructure with Vitest
- Support for 'contributor' role in role hierarchy

### Changed
- Deep copy configuration objects to prevent mutation of defaults
- Improve role normalization to support more variations (dev/Dev/DEV, contrib/Contrib, etc.)
- Reduce npm package size by 17% by excluding source files

### Fixed
- Array mutation issues in config building
- Circular dependency between config, roles, and debug modules
- Role extraction handling for empty string roles
- hasRole and hasAnyRole functions now support both SanityUser objects and role arrays

### Developer Experience
- Set up Vitest testing framework with mocks for Sanity and edge-config
- Update .npmignore to properly exclude development files
- All 30 tests passing

## [1.0.0] - 2025-01-11

### Added
- Initial release of @invisiblecities/sanity-staging-security
- Role-based access control for staging environments
- Sanity Studio v3+ integration with settings UI
- Visual status dashboard showing user access
- Automatic token generation and validation
- Cross-origin PostMessage support for preview panels
- Multiple logging providers (console, Logflare, edge-console)
- Vercel Edge Runtime optimizations
- React 18/19 compatibility layer
- TypeScript support with branded types
- JSDoc documentation for all APIs
- Role normalization (admin → administrator)
- Debug mode for troubleshooting
- Environment variable configuration
- Edge Config support for Vercel deployments

### Security
- HTTP-only cookies for token storage
- Automatic token expiration
- Rate limiting on validation endpoints
- Origin validation for PostMessage events
- Secure token generation with crypto

### Developer Experience
- Zero-config defaults
- Detailed error messages
- Detailed README with examples
- TypeScript types for all APIs
- ESLint and Prettier configuration
- Example Next.js integration code