# Complete Setup Guide for Sanity Staging Auth Bridge

This guide walks through the complete setup process for the Sanity Staging Auth Bridge plugin by Invisible Cities.

## Prerequisites

- Sanity Studio v3.98+
- Next.js frontend with staging environment
- Node.js 18+

## Step-by-Step Setup

### 1. Install the Plugin

```bash
cd your-sanity-studio
pnpm add @invisiblecities/sanity-staging-auth-bridge zod
```

### 2. Add to Sanity Configuration

```typescript
// sanity.config.ts
import { defineConfig } from 'sanity'
import { stagingAuthBridge } from '@invisiblecities/sanity-staging-auth-bridge'

export default defineConfig({
  name: 'default',
  title: 'My Studio',
  projectId: 'your-project-id',
  dataset: 'production',
  
  plugins: [
    // ... other plugins
    stagingAuthBridge({
      hideFromSettings: false // Default, shows in settings menu
    })
  ],
  
  // ... rest of config
})
```

### 3. Update Your Structure Builder (REQUIRED!)

**This is the most important step!** Sanity v3 plugins cannot automatically add items to your structure.

```typescript
// structure.ts or structure/index.ts
import { StructureBuilder } from 'sanity/structure'
import { LockIcon } from '@sanity/icons'

// Add to your hidden doc types
const hiddenDocTypes = [
  // ... your existing hidden types
  'stagingAuthSettings', // Add this!
]

// In your structure definition
export default (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      // Settings section
      S.listItem()
        .title('Settings')
        .icon(SettingsIcon)
        .child(
          S.list()
            .title('Settings')
            .items([
              // ... your existing settings
              
              // Add Staging Auth Settings
              S.listItem()
                .title('Staging Access')
                .icon(LockIcon)
                .child(
                  S.document()
                    .schemaType('stagingAuthSettings')
                    .documentId('stagingAuthSettings')
                ),
            ])
        ),
        
      // ... rest of your structure
    ])
```

### 4. Set Up Environment Variables

Create or update `.env.local`:

```bash
# Required for production logging
SANITY_STUDIO_LOGFLARE_API_KEY=your-logflare-api-key
SANITY_STUDIO_LOGFLARE_SOURCE_ID=your-source-id

# Optional overrides
SANITY_STUDIO_STAGING_URL=https://staging.yoursite.com
SANITY_STUDIO_DEBUG=true # Enable debug logging
```

### 5. Implement NextJS Validation Endpoint

Create the validation endpoint in your Next.js app:

```typescript
// app/api/auth/validate-sanity-v3/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { normalizeRoles, getHighestPriorityRole } from './role-utils'

const ALLOWED_ORIGINS = [
  'https://your-studio.sanity.studio',
  'http://localhost:3333',
]

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || ''
  
  // Validate origin
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return new NextResponse('Forbidden', { status: 403 })
  }
  
  const { sessionToken, userRoles, userName, userEmail } = await request.json()
  
  // Normalize roles (handles 'admin' -> 'administrator')
  const normalizedRoles = normalizeRoles(userRoles)
  
  // Check access (implement your logic)
  const hasAccess = normalizedRoles.includes('administrator') || 
                    normalizedRoles.includes('editor')
  
  if (hasAccess) {
    // Set auth cookie
    return NextResponse.json({
      authorized: true,
      role: getHighestPriorityRole(normalizedRoles),
    })
  }
  
  return NextResponse.json({
    authorized: false,
    error: 'No authorized roles'
  })
}

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || ''
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : '',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}
```

### 6. Configure Roles in Studio

1. Navigate to Settings → Staging Access in your Studio
2. You'll see the configuration UI with:
   - **Access Status**: Real-time view of your current staging access
   - **Role-Based Access**: Configure which Sanity roles get automatic staging access
   - **Features & Behavior**: Control authentication behavior
   - **Advanced Configuration**: Override environment variables (collapsed by default)
   - **Logging**: Configure where authentication events are logged

#### UI Features:
- **Clear Descriptions**: Each field has contextual help text explaining its purpose
- **Organized Sections**: Related settings are grouped together
- **Collapsible Advanced Settings**: Complex options are hidden by default
- **Smart Defaults**: Pre-configured with sensible defaults for most use cases

### 7. Test the Integration

1. Log into Sanity Studio
2. Check the browser console for debug messages (if debug mode enabled)
3. You should see a toast notification about staging access
4. Navigate to Settings → Staging Access to see your status

## Verification Checklist

- [ ] Plugin installed in package.json
- [ ] Plugin added to sanity.config.ts
- [ ] Settings added to structure.ts (CRITICAL!)
- [ ] 'stagingAuthSettings' added to hiddenDocTypes
- [ ] Environment variables configured
- [ ] NextJS endpoint implemented
- [ ] CORS configured correctly
- [ ] Settings appear in Studio menu

## Common Mistakes to Avoid

1. **Forgetting to update structure.ts** - The #1 issue!
2. **Not adding to hiddenDocTypes** - Settings will appear in root
3. **Wrong origin in ALLOWED_ORIGINS** - Check exact studio URL
4. **Missing role normalization** - 'admin' vs 'administrator'
5. **Incorrect workspace path** - Include /staging if using workspaces

## Need Help?

- Check console for errors with `SANITY_STUDIO_DEBUG=true`
- Verify schema is loaded: Look for `stagingAuthSettings` in schema types
- Check network tab for validation API calls
- Review server logs for API errors