# Edge Config Setup for Staging Auth Bridge

Vercel Edge Config provides ultra-low latency configuration reads from the edge, perfect for feature flags and dynamic configuration.

## Quick Setup

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Create Edge Config Store
```bash
# Create a new Edge Config store for staging auth
vercel edge-config create staging-auth-config

# Or create separate stores for each plugin
vercel edge-config create redirects-config
vercel edge-config create seo-config
```

### 3. Link to Your Project
```bash
# Pull environment variables (includes EDGE_CONFIG)
vercel env pull

# Or manually link in Vercel Dashboard
# Project Settings > Environment Variables > Add EDGE_CONFIG
```

### 4. Add Configuration Items

#### Via Dashboard
1. Go to https://vercel.com/dashboard/stores
2. Select your Edge Config store
3. Add items using the UI

#### Via CLI
```bash
# Add individual items
vercel edge-config add stagingUrl "https://staging.pocmarketing.org"
vercel edge-config add feature_autoValidation true
vercel edge-config add feature_debugMode false
vercel edge-config add rateLimitMs 60000

# Add allowed origins (as JSON array)
vercel edge-config add allowedOrigins '["https://staging.pocmarketing.org", "https://localhost:3000"]'
```

## Configuration Schema

### Staging Auth Bridge Config

```json
{
  "stagingUrl": "https://staging.pocmarketing.org",
  "allowedOrigins": [
    "https://staging.pocmarketing.org",
    "https://localhost:3000"
  ],
  "rateLimitMs": 60000,
  "feature_autoValidation": true,
  "feature_debugMode": false,
  "feature_enablePostMessage": true,
  "feature_showToasts": true
}
```

### Priority Order

Configuration is merged in this order (highest priority first):
1. **Edge Config** (when available on Vercel)
2. **Environment Variables** 
3. **Default Values**

## Benefits

### 1. **Ultra-Low Latency**
- Reads happen at the edge, typically <10ms
- No cold starts or function invocations
- Global replication

### 2. **Dynamic Updates**
- Change configuration without redeploying
- Instant propagation globally
- Perfect for feature flags

### 3. **Version Control**
- Track changes in Edge Config dashboard
- Rollback capabilities
- Audit trail

## Best Practices

### 1. **Use Separate Stores**
Each major plugin should have its own Edge Config store:
- `staging-auth-config` - Auth configuration
- `redirects-config` - Redirect rules (high volume)
- `seo-config` - SEO settings

### 2. **Naming Conventions**
- Feature flags: `feature_camelCase`
- Configuration: `camelCase`
- Lists: Use JSON arrays

### 3. **Fallback Values**
Always provide defaults in code:
```typescript
const debugMode = await edgeConfig.getConfig('feature_debugMode', false)
```

### 4. **Cache Wisely**
Edge Config is already cached at the edge, but you can add application-level caching for expensive operations.

## Monitoring

View Edge Config reads in your Vercel dashboard:
1. Go to your project
2. Click "Functions" tab
3. Look for Edge Config read metrics

## Troubleshooting

### Edge Config Not Loading
1. Check `EDGE_CONFIG` environment variable exists
2. Verify store is linked to project
3. Check Vercel dashboard for read errors

### Values Not Updating
1. Edge Config has ~30 second propagation time
2. Clear any application-level caches
3. Check for typos in key names

### Local Development
Edge Config works in local development if you:
1. Run `vercel env pull` to get credentials
2. Have `EDGE_CONFIG` in `.env.local`
3. Are connected to the internet

## Future Enhancements

### Redirect Suite Integration
The redirect suite will benefit most from Edge Config:
```json
{
  "redirects": [
    { "from": "/old", "to": "/new", "statusCode": 301 },
    { "from": "/legacy/*", "to": "/modern/$1", "statusCode": 302 }
  ],
  "feature_wildcardRedirects": true,
  "feature_queryStringPreservation": true
}
```

### SEO Suite Integration
Dynamic SEO configuration:
```json
{
  "defaultMetaTags": {
    "ogImage": "https://pocmarketing.org/default-og.jpg"
  },
  "robotsRules": {
    "staging": "noindex, nofollow",
    "production": "index, follow"
  }
}
```

## Size Limits

- **Per Store**: 512KB
- **Per Item**: 32KB
- **Recommendation**: Keep individual items small, use multiple stores for large datasets