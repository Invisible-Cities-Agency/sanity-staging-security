/**
 * @fileoverview Branded type definitions for the Staging Auth Bridge plugin
 * @module staging-auth-bridge/types/branded
 * 
 * This module provides branded unknown types that ensure type safety 
 * and error tracing throughout the authentication
 * flow. These types replace any usage of 'any' with properly branded unknown types
 * that enable error tracing and observability metrics.
 */

import { z } from 'zod'

/**
 * Core branding symbol for type safety
 * @internal
 */
declare const StagingAuthBrand: unique symbol

/**
 * Branded unknown type for Sanity session data
 * Used when handling session tokens and user data from Sanity Studio
 */
export type SanitySessionUnknown = unknown & { 
  readonly [StagingAuthBrand]: 'SanitySession' 
}

/**
 * Branded unknown type for validation API responses
 * Used when handling responses from the staging validation API
 */
export type ValidationResponseUnknown = unknown & { 
  readonly [StagingAuthBrand]: 'ValidationResponse' 
}

/**
 * Branded unknown type for PostMessage event data
 * Used when handling cross-origin messages from iframes
 */
export type PostMessageDataUnknown = unknown & { 
  readonly [StagingAuthBrand]: 'PostMessageData' 
}

/**
 * Branded unknown type for Sanity user data
 * Used when handling currentUser from Sanity hooks
 */
export type SanityUserUnknown = unknown & { 
  readonly [StagingAuthBrand]: 'SanityUser' 
}

/**
 * Log context structure for structured logging
 */
export interface LogContext {
  /** Action identifier for the log event */
  action?: string
  /** Event type identifier */
  event?: string
  /** Duration in milliseconds */
  duration?: number
  /** Error message if applicable */
  error?: string
  /** Stack trace if applicable */
  stack?: string
  /** Additional context properties */
  [key: string]: any
}

/**
 * Zod schema for validation response structure
 * Provides runtime validation and type inference
 */
export const ValidationResponseSchema = z.object({
  authorized: z.boolean(),
  role: z.string().optional(),
  error: z.string().optional(),
  correlationId: z.string().optional(),
  timestamp: z.string().optional()
})

/**
 * Inferred type from the validation response schema
 */
export type ValidationResponse = z.infer<typeof ValidationResponseSchema>

/**
 * Zod schema for Sanity user structure
 */
export const SanityUserSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  roles: z.array(
    z.union([
      z.string(),
      z.object({
        name: z.string().optional(),
        title: z.string().optional()
      })
    ])
  ).optional()
})

/**
 * Inferred type from the Sanity user schema
 */
export type SanityUser = z.infer<typeof SanityUserSchema>

/**
 * Zod schema for PostMessage auth request
 */
export const PostMessageAuthRequestSchema = z.object({
  type: z.literal('request-staging-auth-status'),
  correlationId: z.string().optional()
})

/**
 * Zod schema for PostMessage auth response
 */
export const PostMessageAuthResponseSchema = z.object({
  type: z.literal('staging-auth-status'),
  authenticated: z.boolean(),
  hasValidation: z.boolean(),
  isValidating: z.boolean(),
  correlationId: z.string().optional()
})

/**
 * Type guard for validation response
 * @param value - Unknown value to check
 * @returns True if value is a valid ValidationResponse
 */
export function isValidationResponse(
  value: ValidationResponseUnknown
): value is ValidationResponse {
  try {
    ValidationResponseSchema.parse(value)
    return true
  } catch {
    return false
  }
}

/**
 * Type guard for Sanity user
 * @param value - Unknown value to check
 * @returns True if value is a valid SanityUser
 */
export function isSanityUser(
  value: SanityUserUnknown
): value is SanityUser {
  try {
    SanityUserSchema.parse(value)
    return true
  } catch {
    return false
  }
}

/**
 * Type guard for PostMessage auth request
 * @param value - Unknown value to check
 * @returns True if value is a valid auth request
 */
export function isPostMessageAuthRequest(
  value: PostMessageDataUnknown
): value is z.infer<typeof PostMessageAuthRequestSchema> {
  try {
    PostMessageAuthRequestSchema.parse(value)
    return true
  } catch {
    return false
  }
}

/**
 * Safely parse validation response with error handling
 * @param value - Unknown value to parse
 * @returns Parsed validation response or null with logged error
 */
export function parseValidationResponse(
  value: ValidationResponseUnknown,
  logger?: { error: (context: LogContext, message: string) => void }
): ValidationResponse | null {
  try {
    return ValidationResponseSchema.parse(value)
  } catch (error) {
    if (logger && error instanceof z.ZodError) {
      logger.error({
        event: 'validation_response_parse_error',
        errors: error.errors,
        input: value
      }, 'Failed to parse validation response')
    }
    return null
  }
}

/**
 * Safely parse Sanity user with error handling
 * @param value - Unknown value to parse
 * @returns Parsed Sanity user or null with logged error
 */
export function parseSanityUser(
  value: SanityUserUnknown,
  logger?: { error: (context: LogContext, message: string) => void }
): SanityUser | null {
  try {
    return SanityUserSchema.parse(value)
  } catch (error) {
    if (logger && error instanceof z.ZodError) {
      logger.error({
        event: 'sanity_user_parse_error',
        errors: error.errors,
        input: value
      }, 'Failed to parse Sanity user')
    }
    return null
  }
}

/**
 * Create a branded validation response for type safety
 * @param response - Response object to brand
 * @returns Branded validation response
 */
export function createValidationResponse(
  response: ValidationResponse
): ValidationResponseUnknown {
  return response as ValidationResponseUnknown
}

/**
 * Create a branded Sanity user for type safety
 * @param user - User object to brand
 * @returns Branded Sanity user
 */
export function createSanityUser(
  user: SanityUser
): SanityUserUnknown {
  return user as SanityUserUnknown
}