/**
 * @fileoverview Centralized configuration for Staging Auth Bridge
 * @module staging-auth-bridge/config
 * 
 * This module provides a centralized configuration system that handles:
 * - Environment variable validation
 * - Default values and fallbacks
 * - Platform-specific optimizations
 * - Security settings
 * - Feature flags
 * 
 * @remarks
 * Configuration is loaded once and cached for performance.
 * All environment variables are validated at startup.
 */

import type { StagingAuthConfig } from '../types'
import { z } from 'zod'
import { vercel } from '../platform/vercel'
import { Platform } from '../platform'
import { RoleUtils } from '../utils/roles'
import { deepClone } from '../utils/configUtils'

/**
 * Environment variable schema for validation
 */
const EnvironmentSchema = z.object({
  SANITY_STUDIO_LOGFLARE_API_KEY: z.string().optional(),
  SANITY_STUDIO_LOGFLARE_SOURCE_ID: z.string().optional(),
  NODE_ENV: z.enum(['development', 'staging', 'production']).optional(),
  SANITY_STUDIO_DEBUG: z.string().optional(),
  SANITY_STUDIO_STAGING_URL: z.string().url().optional(),
  SANITY_STUDIO_STAGING_COOKIE_NAME: z.string().optional(),
  SANITY_STUDIO_STAGING_TOKEN_VALIDITY_DAYS: z.coerce.number().int().positive().optional(),
  SANITY_STUDIO_STAGING_RATE_LIMIT_MS: z.coerce.number().int().positive().optional(),
})


/**
 * Parsed environment configuration type
 */
type ParsedEnvironment = z.infer<typeof EnvironmentSchema>

/**
 * Get validated environment configuration
 */
function getEnvironment(): ParsedEnvironment {
  try {
    return EnvironmentSchema.parse(process.env)
  } catch (error) {
    console.warn('[StagingAuthBridge] Invalid environment configuration:', error)
    // Return raw env with defaults for numeric fields
    return {
      ...process.env,
      SANITY_STUDIO_STAGING_TOKEN_VALIDITY_DAYS: process.env.SANITY_STUDIO_STAGING_TOKEN_VALIDITY_DAYS ? parseInt(process.env.SANITY_STUDIO_STAGING_TOKEN_VALIDITY_DAYS, 10) : undefined,
      SANITY_STUDIO_STAGING_RATE_LIMIT_MS: process.env.SANITY_STUDIO_STAGING_RATE_LIMIT_MS ? parseInt(process.env.SANITY_STUDIO_STAGING_RATE_LIMIT_MS, 10) : undefined
    } as ParsedEnvironment
  }
}

// Re-export role utilities for backward compatibility
export const normalizeRoleName = RoleUtils.normalize
export const getHighestPriorityRole = (roles: string[]) => RoleUtils.getHighestPriority(roles) || null

/**
 * Default configuration values
 */
const defaults: StagingAuthConfig = {
  urls: {
    staging: 'https://staging.example.com',
    development: [
      'https://localhost:3000',
      'https://localhost:3334',
      'http://localhost:3000', // Fallback for local dev without SSL
    ],
    apiEndpoints: {
      validateV3: '/api/auth/validate-sanity-v3',
      stagingLogin: '/api/auth/staging-login',
    }
  },
  security: {
    tokenValidityDays: 7,
    rateLimitRetryMs: 60000, // 1 minute
    allowedOrigins: [
      'https://staging.example.com',
      'https://localhost:3000',
      'https://localhost:3334',
    ],
    cookieName: 'staging-auth',
  },
  logging: {
    provider: 'console',
    level: 'info',
    flushInterval: 1000,
  },
  features: {
    autoValidation: true,
    debugMode: false,
    enablePostMessage: true,
    showToasts: true,
  }
}

/**
 * Build configuration with environment overrides
 */
async function buildConfig(): Promise<StagingAuthConfig> {
  const env = getEnvironment()
  const isDevelopment = env.NODE_ENV === 'development'
  const isDebug = env.SANITY_STUDIO_DEBUG === 'true' || isDevelopment

  // Start with deep copy of defaults to avoid mutations
  const config = deepClone(defaults)
  
  // Check for Edge Config overrides (Vercel only)
  if (Platform.deployment.isVercel() && vercel.edgeConfig.isAvailable()) {
    try {
      // Get all configuration from Edge Config
      const edgeConfigValues = await vercel.edgeConfig.getMultiple([
        'stagingUrl',
        'allowedOrigins',
        'rateLimitMs',
        'feature_autoValidation',
        'feature_debugMode',
        'feature_enablePostMessage',
        'feature_showToasts',
      ])
      
      // Apply Edge Config overrides
      if (edgeConfigValues.stagingUrl) {
        config.urls.staging = edgeConfigValues.stagingUrl as string
      }
      if (edgeConfigValues.allowedOrigins) {
        config.security.allowedOrigins = edgeConfigValues.allowedOrigins as string[]
      }
      if (edgeConfigValues.rateLimitMs) {
        config.security.rateLimitRetryMs = edgeConfigValues.rateLimitMs as number
      }
      if (typeof edgeConfigValues.feature_autoValidation === 'boolean') {
        config.features.autoValidation = edgeConfigValues.feature_autoValidation
      }
      if (typeof edgeConfigValues.feature_debugMode === 'boolean') {
        config.features.debugMode = edgeConfigValues.feature_debugMode
      }
      if (typeof edgeConfigValues.feature_enablePostMessage === 'boolean') {
        config.features.enablePostMessage = edgeConfigValues.feature_enablePostMessage
      }
      if (typeof edgeConfigValues.feature_showToasts === 'boolean') {
        config.features.showToasts = edgeConfigValues.feature_showToasts
      }
      
      console.log('[StagingAuthBridge] Applied Edge Config overrides')
    } catch (error) {
      console.warn('[StagingAuthBridge] Failed to load Edge Config:', error)
    }
  }

  // Override with environment variables
  if (env.SANITY_STUDIO_STAGING_URL) {
    config.urls.staging = env.SANITY_STUDIO_STAGING_URL
  }

  if (env.SANITY_STUDIO_STAGING_COOKIE_NAME) {
    config.security.cookieName = env.SANITY_STUDIO_STAGING_COOKIE_NAME
  }

  if (env.SANITY_STUDIO_STAGING_TOKEN_VALIDITY_DAYS) {
    config.security.tokenValidityDays = env.SANITY_STUDIO_STAGING_TOKEN_VALIDITY_DAYS
  }

  if (env.SANITY_STUDIO_STAGING_RATE_LIMIT_MS) {
    config.security.rateLimitRetryMs = env.SANITY_STUDIO_STAGING_RATE_LIMIT_MS
  }

  // Configure logging based on environment
  if (env.SANITY_STUDIO_LOGFLARE_API_KEY && env.SANITY_STUDIO_LOGFLARE_SOURCE_ID) {
    config.logging.provider = 'logflare'
  } else if (Platform.deployment.isVercel() || Platform.runtime.isEdge()) {
    config.logging.provider = 'edge-console'
  }

  // Set logging level
  config.logging.level = isDebug ? 'debug' : isDevelopment ? 'info' : 'warn'

  // Feature flags
  config.features.debugMode = isDebug
  config.features.showToasts = isDevelopment || isDebug

  // Platform-specific optimizations
  if (Platform.deployment.isVercel()) {
    // Optimize for Vercel Edge Runtime
    config.logging.flushInterval = 500 // Faster flushes for serverless
  }

  // Add development origins in dev mode
  if (isDevelopment) {
    // Create new array to avoid mutating defaults
    config.security.allowedOrigins = [
      ...config.security.allowedOrigins,
      'http://localhost:3000',
      'http://localhost:3333', 
      'http://localhost:3334'
    ]
  }

  return config
}

/**
 * Cached configuration instance
 */
let cachedConfig: StagingAuthConfig | null = null
let configInitialized = false

/**
 * Initialize configuration on module load
 * This ensures config is ready before first use
 */
async function initializeConfig(): Promise<void> {
  if (configInitialized) return
  
  try {
    cachedConfig = await buildConfig()
    configInitialized = true
  } catch (error) {
    console.error('[StagingAuthBridge] Failed to initialize config:', error)
    cachedConfig = buildSyncConfig()
    configInitialized = true
  }
}

// Start initialization immediately
const initPromise = initializeConfig()

/**
 * Get the staging auth bridge configuration
 * 
 * Returns a configuration object that combines defaults with
 * environment overrides and Edge Config values. The configuration is 
 * validated and optimized for the current platform.
 * 
 * @returns The complete configuration object
 * 
 * @example
 * ```ts
 * import { getConfig } from './config'
 * 
 * const config = getConfig()
 * const apiUrl = config.urls.staging + config.urls.apiEndpoints.validateV3
 * ```
 * 
 * @remarks
 * On Vercel with Edge Config enabled, this will merge:
 * 1. Default values
 * 2. Environment variable overrides  
 * 3. Edge Config overrides (highest priority)
 * 
 * Note: First call may use sync config if Edge Config is still loading.
 * Subsequent calls will always use the fully loaded config.
 */
export function getConfig(): StagingAuthConfig {
  // If we have a cached config, return it immediately
  if (cachedConfig) {
    return cachedConfig
  }
  
  // If still initializing, return sync config for first call
  // This ensures the function remains synchronous for compatibility
  console.warn('[StagingAuthBridge] Config still initializing, using sync fallback')
  cachedConfig = buildSyncConfig()
  return cachedConfig
}

/**
 * Get the staging auth bridge configuration (async version)
 * 
 * This ensures you always get the fully loaded configuration including
 * Edge Config values. Use this when you can handle async operations.
 * 
 * @returns Promise resolving to the complete configuration object
 * 
 * @example
 * ```ts
 * import { getConfigAsync } from './config'
 * 
 * const config = await getConfigAsync()
 * ```
 */
export async function getConfigAsync(): Promise<StagingAuthConfig> {
  // Wait for initialization to complete
  await initPromise
  
  // Return cached config (guaranteed to exist after init)
  return cachedConfig || buildSyncConfig()
}

/**
 * Build configuration synchronously (without Edge Config)
 * Used as fallback when Edge Config is unavailable
 */
function buildSyncConfig(): StagingAuthConfig {
  const env = getEnvironment()
  const isDevelopment = env.NODE_ENV === 'development'
  const isDebug = env.SANITY_STUDIO_DEBUG === 'true' || isDevelopment

  // Start with deep copy of defaults to avoid mutations
  const config = deepClone(defaults)
  
  // Apply environment overrides
  config.urls.staging = env.SANITY_STUDIO_STAGING_URL || config.urls.staging
  config.features.debugMode = isDebug
  // Telemetry configuration if needed in future
  // config.features.enableTelemetry = env.SANITY_STUDIO_TELEMETRY_ENABLED === 'true'
  
  // Configure logging based on environment
  if (isDevelopment) {
    config.logging.provider = 'console'
    config.logging.level = isDebug ? 'debug' : 'info'
  } else if (env.SANITY_STUDIO_LOGFLARE_API_KEY && env.SANITY_STUDIO_LOGFLARE_SOURCE_ID) {
    config.logging.provider = 'logflare'
    config.logging.level = 'warn'
  }
  
  // Log configuration in debug mode
  if (config.features.debugMode) {
    console.log('[StagingAuthBridge] Configuration loaded:', {
      environment: process.env.NODE_ENV,
      platform: {
        vercel: Platform.deployment.isVercel(),
        netlify: Platform.deployment.isNetlify(),
        edge: Platform.runtime.isEdge(),
        node: Platform.node.version(),
      },
      logging: config.logging.provider,
      features: config.features,
    })
  }
  
  return config
}

/**
 * Reset configuration cache (useful for testing)
 * @internal
 */
export function resetConfig(): void {
  cachedConfig = null
}

/**
 * Export platform utilities for other modules
 */
// Platform utilities are now exported from '../platform'

/**
 * Export configuration type
 */
export type { StagingAuthConfig }