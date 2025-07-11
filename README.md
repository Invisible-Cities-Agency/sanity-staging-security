# @invisiblecities/sanity-staging-security

A security plugin for Sanity Studio v3+ that adds role-based access control to staging and preview environments. Built with TypeScript and optimized for edge runtimes like Vercel.

## Features

- 🔐 **Role-Based Access Control**: Grant staging access based on Sanity Studio roles
- 🚀 **Edge Runtime Optimized**: Built for Vercel and other edge platforms
- 🎛️ **Studio UI Integration**: Configure directly from Sanity Studio settings
- 📊 **Visual Status Dashboard**: See who has access at a glance
- 🔄 **Automatic Token Management**: Handles token generation and validation
- 🌐 **Cross-Origin Support**: Works with embedded preview panels
- 📝 **Flexible Logging**: Support for console, Logflare, or custom providers
- ⚡ **Zero-Config Option**: Works out of the box with sensible defaults

## Installation

```bash
npm install @invisiblecities/sanity-staging-security
# or
yarn add @invisiblecities/sanity-staging-security
# or
pnpm add @invisiblecities/sanity-staging-security
```

## Quick Start

### 1. Add to Sanity Studio

```ts
// sanity.config.ts
import { defineConfig } from 'sanity'
import { stagingAuthBridge } from '@invisiblecities/sanity-staging-security'

export default defineConfig({
  // ... your config
  plugins: [
    // ... other plugins
    stagingAuthBridge({
      // Optional: hide from settings menu if managing via env vars
      hideFromSettings: false
    })
  ]
})
```

### 2. Add to Studio Structure (Optional)

For manual control over settings placement:

```ts
// structure.ts
import { createSettingsListItem } from '@invisiblecities/sanity-staging-security'

export const structure = (S) =>
  S.list()
    .title('Content')
    .items([
      // ... your items
      S.divider(),
      createSettingsListItem(S), // Adds "Staging Access" to settings
    ])
```

### 3. Configure Next.js Frontend

```tsx
// app/api/auth/validate-sanity-v3/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { sessionToken, userRoles = [] } = await request.json()
    
    // Validate the session token with Sanity
    const isValid = await validateSanitySession(sessionToken)
    if (!isValid) {
      return NextResponse.json({ authorized: false })
    }
    
    // Check if user has staging access
    const allowedRoles = ['administrator', 'editor'] // Configure as needed
    const hasAccess = userRoles.some(role => 
      allowedRoles.includes(normalizeRole(role))
    )
    
    if (hasAccess) {
      // Set authentication cookie
      cookies().set('staging-auth', generateToken(), {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      })
    }
    
    return NextResponse.json({ 
      authorized: hasAccess,
      role: userRoles[0] 
    })
  } catch (error) {
    return NextResponse.json({ authorized: false }, { status: 500 })
  }
}
```

## Configuration

### Environment Variables

```bash
# Required for basic operation
SANITY_STUDIO_STAGING_URL=https://staging.example.com

# Optional overrides
SANITY_STUDIO_STAGING_COOKIE_NAME=staging-auth
SANITY_STUDIO_STAGING_TOKEN_VALIDITY_DAYS=7
SANITY_STUDIO_STAGING_RATE_LIMIT_MS=60000

# Logging configuration
SANITY_STUDIO_LOGFLARE_API_KEY=your-api-key
SANITY_STUDIO_LOGFLARE_SOURCE_ID=your-source-id

# Development
SANITY_STUDIO_DEBUG=true
```

### Role Configuration

Configure which roles have staging access through the Studio UI:

1. Navigate to Settings → Staging Access
2. Toggle access for each role
3. Changes take effect immediately

Default configuration:
- ✅ Administrator - Full access
- ✅ Editor - Can edit content (Growth plans+)  
- ❌ Viewer - Read-only access

### Advanced Configuration

```ts
stagingAuthBridge({
  // Override default staging URL
  stagingUrl: 'https://preview.example.com',
  
  // Custom cookie settings
  cookieName: 'custom-auth',
  tokenValidityDays: 14,
  
  // Feature flags
  features: {
    autoValidation: true,    // Auto-grant access on login
    showToasts: true,        // Show success/error toasts
    enablePostMessage: true, // Enable iframe communication
    debugMode: false         // Verbose logging
  },
  
  // Custom logging
  logging: {
    provider: 'logflare',
    level: 'info'
  }
})
```

## Platform Optimizations

### Vercel Edge Config

For zero-latency configuration updates:

```bash
# Install Vercel CLI
npm i -g vercel

# Create Edge Config store
vercel edge-config create staging-auth-config

# Link to project
vercel env pull
```

Add configuration keys:
- `stagingUrl`
- `allowedOrigins` 
- `feature_autoValidation`
- `feature_debugMode`

### React 19 Compatibility

The plugin includes automatic fallbacks for React 19's new APIs while maintaining React 18 compatibility:

```ts
// Automatic detection and polyfills for:
- useActionState
- useFormStatus  
- useOptimistic
- React Compiler optimizations
```

## Security Considerations

### Token Security

- Tokens are cryptographically signed with rotating keys
- HTTP-only cookies prevent XSS attacks
- Automatic expiration and renewal
- Rate limiting on validation endpoints

### CORS Configuration

```ts
// Automatically handles:
- Sanity Studio preview panels
- Cross-origin PostMessage events
- Preflight requests
- Origin validation
```

### Best Practices

1. **Always use HTTPS** in production
2. **Rotate signing keys** regularly
3. **Monitor access logs** via your logging provider
4. **Limit role permissions** to minimum required
5. **Review token validity** periods based on security needs

## Troubleshooting

### Common Issues

**"Workspace not found" error**
- Ensure you're accessing the correct workspace URL
- Check that workspace path is included in `studioUrl` config

**Roles not syncing**
- Verify role names match Sanity's format (e.g., "administrator" not "admin")
- Check user's actual roles in Sanity project settings

**Cookies not setting**
- Confirm HTTPS is enabled (required for secure cookies)
- Check cookie domain settings match your environment
- Verify SameSite policy allows your setup

### Debug Mode

Enable debug logging:

```ts
stagingAuthBridge({
  features: {
    debugMode: true
  }
})
```

## API Reference

### Next.js API Contract

For detailed information about implementing the required API endpoints in your Next.js application, see the [Next.js API Contract documentation](./docs/nextjs-api-contract.md).

### Plugin Options

```ts
interface StagingAuthBridgeOptions {
  /** Hide settings from main menu */
  hideFromSettings?: boolean
  
  /** Override staging URL */
  stagingUrl?: string
  
  /** Cookie configuration */
  cookieName?: string
  tokenValidityDays?: number
  
  /** Feature toggles */
  features?: {
    autoValidation?: boolean
    showToasts?: boolean
    enablePostMessage?: boolean
    debugMode?: boolean
  }
  
  /** Logging configuration */
  logging?: {
    provider?: 'console' | 'logflare' | 'edge-console'
    level?: 'debug' | 'info' | 'warn' | 'error'
  }
}
```

### Utility Functions

```ts
// Normalize role names (admin → administrator)
import { normalizeRoleName } from '@invisiblecities/sanity-staging-security'

// Get highest priority role
import { getHighestPriorityRole } from '@invisiblecities/sanity-staging-security'
```

## Migration Guide

### From Manual Token Management

```ts
// Before: Manual token handling
if (user.roles.includes('admin')) {
  setAuthCookie(generateToken())
}

// After: Automatic with role normalization
// Just install the plugin - it handles everything!
```

### From Environment-Only Config

The plugin now supports both environment variables and Studio UI configuration. Environment variables take precedence for security.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development

```bash
# Clone the repo
git clone https://github.com/invisiblecities/sanity-staging-security

# Install dependencies
pnpm install

# Run in watch mode
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

## Support

- 📧 Email: hello@invisiblecities.com
- 🐛 Issues: [GitHub Issues](https://github.com/invisiblecities/sanity-staging-security/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/invisiblecities/sanity-staging-security/discussions)

## License

MIT © [Invisible Cities](https://invisiblecities.com)

---

Built with ❤️ by [Invisible Cities](https://invisiblecities.com) for the Sanity community