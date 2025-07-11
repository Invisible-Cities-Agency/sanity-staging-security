# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Comprehensive JSDoc documentation
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
- Comprehensive README documentation
- TypeScript types for all APIs
- ESLint and Prettier configuration
- Example Next.js integration code