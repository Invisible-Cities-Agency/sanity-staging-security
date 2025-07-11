/**
 * @fileoverview Type definitions for the Staging Auth Bridge plugin
 * @module staging-auth-bridge/types
 * 
 * This module exports all type definitions used throughout the plugin,
 * including branded types, interfaces, and type guards.
 */

export * from './branded'

// Import specific types we need
import type { LogContext, SanityUser } from './branded'

/**
 * Configuration for the staging auth bridge plugin
 */
export interface StagingAuthConfig {
  /**
   * URL configurations for different environments
   */
  urls: {
    /** Production staging URL */
    staging: string
    /** Development URLs (can be multiple for different local setups) */
    development: string[]
    /** API endpoint paths */
    apiEndpoints: {
      /** Validation endpoint for Sanity v3 */
      validateV3: string
      /** Login endpoint for staging */
      stagingLogin: string
    }
  }
  
  /**
   * Security configurations
   */
  security: {
    /** Token validity period in days */
    tokenValidityDays: number
    /** Rate limit retry delay in milliseconds */
    rateLimitRetryMs: number
    /** Allowed origins for PostMessage communication */
    allowedOrigins: string[]
    /** Cookie name for staging auth */
    cookieName: string
  }
  
  /**
   * Logging configurations
   */
  logging: {
    /** Primary logging provider */
    provider: 'edge-console' | 'logflare' | 'console'
    /** Experimental logging providers (marked as beta) */
    experimental?: Array<'winston' | 'bunyan' | 'debug'>
    /** Log level */
    level: 'debug' | 'info' | 'warn' | 'error'
    /** Flush interval for batched logging (ms) */
    flushInterval: number
  }
  
  /**
   * Feature flags
   */
  features: {
    /** Enable auto-validation on login */
    autoValidation: boolean
    /** Enable debug logging */
    debugMode: boolean
    /** Enable PostMessage communication */
    enablePostMessage: boolean
    /** Show validation toast notifications */
    showToasts: boolean
  }
}

/**
 * Validation result from the staging auth API
 */
export interface ValidationResult {
  /** Whether the user is authorized */
  authorized: boolean
  /** User's role if authorized */
  role?: string
  /** Error message if not authorized */
  error?: string
  /** Correlation ID for tracking */
  correlationId?: string
  /** Timestamp of validation */
  timestamp?: string
}

/**
 * Hook return type for useStudioAuth
 */
export interface UseStudioAuthReturn {
  /** Function to validate the current session */
  validateSession: () => Promise<ValidationResult>
  /** Function to clear validation state */
  clearValidation: () => void
  /** Whether validation is in progress */
  isValidating: boolean
  /** Last validation result */
  lastValidation: ValidationResult | null
  /** Any error that occurred */
  error: Error | null
  /** Whether the user is authenticated in Sanity */
  isAuthenticated: boolean
  /** Current Sanity user */
  currentUser: SanityUser | null
}

/**
 * Logger interface for the plugin
 */
export interface Logger {
  /** Log info level message */
  info: (context: LogContext, message: string) => void
  /** Log error level message */
  error: (context: LogContext, message: string) => void
  /** Log warning level message */
  warn: (context: LogContext, message: string) => void
  /** Log debug level message */
  debug: (context: LogContext, message: string) => void
  /** Flush any pending logs */
  flush?: () => Promise<void>
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Service name for log identification */
  service: string
  /** Environment (development, staging, production) */
  environment: string
  /** Additional context to include in all logs */
  baseContext?: LogContext
}

/**
 * PostMessage event types
 */
export type PostMessageEventType = 
  | 'request-staging-auth-status'
  | 'staging-auth-status'

/**
 * PostMessage event data structure
 */
export interface PostMessageEvent {
  /** Event type */
  type: PostMessageEventType
  /** Event payload - structure depends on event type */
  payload?: Record<string, unknown>
  /** Correlation ID for request/response matching */
  correlationId?: string
}

/**
 * Environment configuration from process.env
 */
export interface EnvironmentConfig {
  /** Logflare API key */
  SANITY_STUDIO_LOGFLARE_API_KEY?: string
  /** Logflare source ID */
  SANITY_STUDIO_LOGFLARE_SOURCE_ID?: string
  /** Node environment */
  NODE_ENV?: 'development' | 'staging' | 'production'
  /** Enable debug mode */
  SANITY_STUDIO_DEBUG?: string
  /** Staging URL override */
  SANITY_STUDIO_STAGING_URL?: string
  /** Cookie name override */
  SANITY_STUDIO_STAGING_COOKIE_NAME?: string
  /** Token validity days override */
  SANITY_STUDIO_STAGING_TOKEN_VALIDITY_DAYS?: string
  /** Rate limit milliseconds override */
  SANITY_STUDIO_STAGING_RATE_LIMIT_MS?: string
  /** Enable telemetry */
  SANITY_STUDIO_TELEMETRY_ENABLED?: string
}

/**
 * Component props for StudioAuthBridge
 */
export interface StudioAuthBridgeProps {
  /** Render function for the wrapped layout */
  renderDefault: (props: StudioAuthBridgeProps) => React.ReactElement
  /** Additional props passed to the layout */
  [key: string]: unknown
}

/**
 * API request payload for validation
 */
export interface ValidationRequestPayload {
  /** Session token from Sanity */
  sessionToken: string
  /** User roles array */
  userRoles: string[]
  /** User name (optional) */
  userName?: string
  /** User email (optional) */
  userEmail?: string
}

/**
 * API response from validation endpoint
 */
export interface ValidationApiResponse {
  /** Authorization status */
  authorized: boolean
  /** User role if authorized */
  role?: string
  /** Error message if any */
  error?: string
  /** Additional metadata */
  metadata?: {
    /** Correlation ID */
    correlationId?: string
    /** Server timestamp */
    timestamp?: string
    /** Cache status */
    cached?: boolean
  }
}