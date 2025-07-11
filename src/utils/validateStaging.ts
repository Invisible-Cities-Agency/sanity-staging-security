/**
 * @fileoverview Staging validation utilities
 * @module staging-auth-bridge/utils/validateStaging
 * 
 * This module provides the core validation logic for authenticating Sanity Studio
 * users with the staging environment. It handles API communication, error handling,
 * rate limiting, and comprehensive logging.
 */

import { createLogflareLogger } from './logflare'
import { getConfig } from '../config'
import { Platform, getFetchOptions, compatFetch } from '../platform'
import { vercel } from '../platform/vercel'
import type { 
  ValidationResult, 
  ValidationResponseUnknown,
  Logger 
} from '../types'
import { parseValidationResponse } from '../types/branded'

// Get configuration
const config = getConfig()

// Initialize logger for Studio-side events
const loggerPromise = createLogflareLogger({
  service: 'studio-auth-bridge',
  environment: process.env.NODE_ENV || 'development'
})

/**
 * Validate user access to the staging environment
 * 
 * This function communicates with the NextJS staging API to validate a user's
 * session and determine their authorization level. It handles:
 * - Environment-specific API routing
 * - Secure credential transmission
 * - Rate limiting with proper error messages
 * - Comprehensive logging for debugging
 * - Type-safe response parsing
 * 
 * @param sessionToken - The session token from Sanity Studio
 * @param userRoles - Array of user roles from Sanity (optional)
 * @param userName - User's display name (optional)
 * @param userEmail - User's email address (optional)
 * @returns Promise resolving to validation result
 * @throws {Error} On network failures, rate limiting, or authorization errors
 * 
 * @example
 * ```ts
 * try {
 *   const result = await validateStagingAccess(
 *     'studio-validation-123456-abc',
 *     ['admin', 'editor'],
 *     'John Doe',
 *     'john@example.com'
 *   )
 *   
 *   if (result.authorized) {
 *     console.log('User authorized as:', result.role)
 *   }
 * } catch (error) {
 *   console.error('Validation failed:', error.message)
 * }
 * ```
 * 
 * @remarks
 * Security notes:
 * - Always uses HTTPS in production
 * - Includes credentials for cookie setting
 * - Validates response structure with Zod
 * - Logs are sanitized to avoid leaking sensitive data
 */
export async function validateStagingAccess(
  sessionToken: string, 
  userRoles?: string[], 
  userName?: string, 
  userEmail?: string
): Promise<ValidationResult> {
  const logger = await loggerPromise
  const startTime = Date.now()
  
  // Determine the correct API URL based on environment
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? config.urls.development[0] // Use first development URL
    : config.urls.staging
  const apiUrl = baseUrl + config.urls.apiEndpoints.validateV3

  // Get current URL and params for diagnostic logging
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'unknown'
  const urlParams = typeof window !== 'undefined' ? Object.fromEntries(new URLSearchParams(window.location.search)) : {}
  
  logger.info({
    action: 'validate_staging_access_start',
    apiUrl,
    tokenLength: sessionToken.length,
    userRoles,
    currentUrl,
    urlParams,
    referrer: typeof document !== 'undefined' ? document.referrer : 'unknown'
  }, 'Initiating staging access validation')

  try {
    // Use platform-optimized fetch
    const fetchFn = Platform.deployment.isVercel() ? vercel.fetch : compatFetch
    const fetchOptions = getFetchOptions()
    
    const response = await fetchFn(apiUrl, {
      ...fetchOptions,
      method: 'POST',
      headers: {
        ...fetchOptions.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        sessionToken,
        userRoles: userRoles || [],
        userName,
        userEmail
      })
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      
      logger.error({
        action: 'validate_staging_access_http_error',
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        duration: Date.now() - startTime
      }, 'HTTP error during validation')

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const retrySeconds = retryAfter || Math.floor(config.security.rateLimitRetryMs / 1000)
        throw new Error(`Rate limit exceeded. Please try again in ${retrySeconds} seconds.`)
      }

      if (response.status === 403) {
        throw new Error('Access forbidden. This domain is not authorized.')
      }

      throw new Error(`Validation failed: ${response.statusText}`)
    }

    // Parse response with type safety
    const responseData = await response.json() as ValidationResponseUnknown
    const result = parseValidationResponse(responseData, logger)
    
    if (!result) {
      throw new Error('Invalid response format from validation API')
    }

    logger.info({
      action: 'validate_staging_access_complete',
      authorized: result.authorized,
      role: result.role,
      duration: Date.now() - startTime
    }, 'Staging access validation completed')

    return result
  } catch (error) {
    logger.error({
      action: 'validate_staging_access_error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime
    }, 'Failed to validate staging access')

    // Re-throw with a user-friendly message
    if (error instanceof Error) {
      throw error
    }
    
    throw new Error('Failed to validate staging access. Please check your connection and try again.')
  }
}