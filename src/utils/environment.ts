/**
 * @fileoverview Centralized environment variable utilities
 * @module staging-auth-bridge/utils/environment
 * 
 * Provides a single source of truth for accessing and validating
 * environment variables throughout the plugin.
 */

/**
 * Environment variable utilities
 * 
 * Centralizes access to environment variables with proper defaults
 * and validation to avoid scattered process.env checks.
 */
export const Environment = {
  /**
   * Get Logflare API key from environment
   */
  getLogflareApiKey: (): string | undefined => 
    process.env.SANITY_STUDIO_LOGFLARE_API_KEY,
  
  /**
   * Get Logflare source ID from environment
   */
  getLogflareSourceId: (): string | undefined => 
    process.env.SANITY_STUDIO_LOGFLARE_SOURCE_ID,
  
  /**
   * Check if Logflare is fully configured
   */
  isLogflareConfigured: (): boolean => 
    !!(Environment.getLogflareApiKey() && Environment.getLogflareSourceId()),
  
  /**
   * Get current Node environment
   */
  getNodeEnv: (): string => 
    process.env.NODE_ENV || 'development',
  
  /**
   * Check if running in development mode
   */
  isDevelopment: (): boolean => 
    Environment.getNodeEnv() === 'development',
  
  /**
   * Check if debug mode is enabled
   */
  isDebug: (): boolean => 
    process.env.SANITY_STUDIO_DEBUG === 'true' || Environment.isDevelopment(),
  
  /**
   * Get staging URL from environment
   */
  getStagingUrl: (): string | undefined => 
    process.env.SANITY_STUDIO_STAGING_URL,
  
  /**
   * Get staging cookie name from environment
   */
  getStagingCookieName: (): string | undefined => 
    process.env.SANITY_STUDIO_STAGING_COOKIE_NAME,
  
  /**
   * Get token validity days from environment
   */
  getTokenValidityDays: (): number | undefined => {
    const days = process.env.SANITY_STUDIO_STAGING_TOKEN_VALIDITY_DAYS
    return days ? parseInt(days, 10) : undefined
  },
  
  /**
   * Get rate limit milliseconds from environment
   */
  getRateLimitMs: (): number | undefined => {
    const ms = process.env.SANITY_STUDIO_STAGING_RATE_LIMIT_MS
    return ms ? parseInt(ms, 10) : undefined
  },
  
  /**
   * Check if telemetry is enabled
   */
  isTelemetryEnabled: (): boolean => 
    process.env.SANITY_STUDIO_TELEMETRY_ENABLED === 'true',
} as const