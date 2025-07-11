/**
 * @fileoverview Generic type guard and parser utilities
 * @module staging-auth-bridge/utils/typeGuards
 * 
 * Provides factory functions for creating type guards and safe parsers
 * to reduce duplicate code in type checking and validation.
 */

import { z } from 'zod'
import { Logger } from '../types'

/**
 * Create a type guard function from a Zod schema
 * 
 * @param schema - Zod schema to use for validation
 * @returns Type guard function
 * 
 * @example
 * ```ts
 * const isValidUser = createTypeGuard(UserSchema)
 * if (isValidUser(data)) {
 *   // data is typed as User
 * }
 * ```
 */
export function createTypeGuard<T>(
  schema: z.ZodSchema<T>
): (value: unknown) => value is T {
  return (value: unknown): value is T => {
    try {
      schema.parse(value)
      return true
    } catch {
      return false
    }
  }
}

/**
 * Create a safe parser function from a Zod schema
 * 
 * @param schema - Zod schema to use for parsing
 * @param options - Parser options
 * @returns Parser function that returns parsed value or null
 * 
 * @example
 * ```ts
 * const parseUser = createSafeParser(UserSchema, {
 *   context: 'user_data',
 *   logger: myLogger
 * })
 * const user = parseUser(unknownData)
 * ```
 */
export function createSafeParser<T>(
  schema: z.ZodSchema<T>,
  options?: {
    context?: string
    logger?: Logger
  }
): (value: unknown) => T | null {
  return (value: unknown): T | null => {
    try {
      return schema.parse(value)
    } catch (error) {
      if (options?.logger && error instanceof z.ZodError) {
        options.logger.error(
          {
            event: `${options.context || 'data'}_parse_error`,
            errors: error.errors,
            input: value,
          },
          `Failed to parse ${options.context || 'data'}`
        )
      }
      return null
    }
  }
}

/**
 * Create a parser that throws with a custom error message
 * 
 * @param schema - Zod schema to use for parsing
 * @param errorMessage - Custom error message
 * @returns Parser function that throws on failure
 */
export function createStrictParser<T>(
  schema: z.ZodSchema<T>,
  errorMessage: string
): (value: unknown) => T {
  return (value: unknown): T => {
    try {
      return schema.parse(value)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`${errorMessage}: ${error.message}`)
      }
      throw error
    }
  }
}

/**
 * Type guard for checking if a value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Type guard for checking if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

/**
 * Type guard for checking if a value is a valid URL
 */
export function isValidUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}