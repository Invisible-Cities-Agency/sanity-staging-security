/**
 * @fileoverview Studio Authentication Hook
 * @module staging-auth-bridge/hooks/useStudioAuth
 * 
 * This hook provides authentication state management and validation functions
 * for the staging auth bridge. It integrates with Sanity's user system and
 * handles session validation with the staging environment.
 */

import { useState, useCallback } from 'react'
import { useCurrentUser } from 'sanity'
import { validateStagingAccess } from '../utils/validateStaging'
import { Debug } from '../utils/debug'
import { RoleUtils } from '../utils/roles'
import type { 
  UseStudioAuthReturn, 
  ValidationResult,
  SanityUserUnknown,
  SanityUser 
} from '../types'
import { parseSanityUser } from '../types/branded'

/**
 * Studio Authentication Hook
 * 
 * Manages the authentication state between Sanity Studio and the staging
 * environment. Provides functions to validate sessions and track auth state.
 * 
 * @returns {UseStudioAuthReturn} Authentication state and control functions
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { 
 *     validateSession, 
 *     isValidating, 
 *     lastValidation,
 *     error 
 *   } = useStudioAuth()
 *   
 *   const handleValidate = async () => {
 *     try {
 *       const result = await validateSession()
 *       if (result.authorized) {
 *         console.log('User authorized with role:', result.role)
 *       }
 *     } catch (err) {
 *       console.error('Validation failed:', err)
 *     }
 *   }
 * }
 * ```
 * 
 * @remarks
 * This hook:
 * - Integrates with Sanity's useCurrentUser hook
 * - Generates session tokens for validation
 * - Handles error states and loading states
 * - Provides role extraction from Sanity user data
 */
export function useStudioAuth(): UseStudioAuthReturn {
  const currentUser = useCurrentUser()
  const [isValidating, setIsValidating] = useState(false)
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Validate the current user's session with the staging environment
   * 
   * @throws {Error} If no user session is found or validation fails
   * @returns {Promise<ValidationResult>} The validation result
   */
  const validateSession = useCallback(async (): Promise<ValidationResult> => {
    // Cast current user to branded type and validate
    const userUnknown = currentUser as SanityUserUnknown
    
    // Debug logging for role investigation
    Debug.log('useStudioAuth', 'Raw currentUser:', currentUser)
    Debug.log('useStudioAuth', 'User roles type:', typeof currentUser?.roles)
    Debug.log('useStudioAuth', 'User roles value:', currentUser?.roles)
    
    const validatedUser = parseSanityUser(userUnknown)
    
    if (!validatedUser?.id) {
      throw new Error('No user session found')
    }

    setIsValidating(true)
    setError(null)

    try {
      // Get the current session token
      // In production, this would integrate with Sanity's actual session management
      // Currently generates a secure mock token for validation
      const sessionToken = await getSessionToken()

      if (!sessionToken) {
        throw new Error('Could not retrieve session token')
      }

      // Extract user roles with type safety
      const userRoles = RoleUtils.extractFromUser(validatedUser)
      const userName = validatedUser.name || undefined
      const userEmail = validatedUser.email || undefined
      
      // Debug logging for extracted roles
      Debug.log('useStudioAuth', 'Extracted roles:', userRoles)
      Debug.log('useStudioAuth', 'Validated user:', validatedUser)
      
      // Validate with our API
      const result = await validateStagingAccess(sessionToken, userRoles, userName, userEmail)
      
      setLastValidation(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    } finally {
      setIsValidating(false)
    }
  }, [currentUser])

  const clearValidation = useCallback(() => {
    setLastValidation(null)
    setError(null)
  }, [])

  return {
    validateSession,
    clearValidation,
    isValidating,
    lastValidation,
    error,
    isAuthenticated: !!currentUser?.id,
    currentUser
  }
}

/**
 * Generate a session token for validation
 * 
 * This generates a secure placeholder token that identifies the validation
 * request as coming from Sanity Studio. In a production implementation,
 * this would integrate with Sanity's actual session management.
 * 
 * @returns {Promise<string | null>} The generated session token
 * @internal
 */
async function getSessionToken(): Promise<string | null> {
  // Generate a placeholder token that indicates we're validating from Studio
  // The actual validation will happen server-side based on the origin and user info
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2)
  const token = `studio-validation-${timestamp}-${random}`
  
  return token
}

// Role extraction is now handled by RoleUtils.extractFromUser
// Re-exported here for backward compatibility
export const getUserRoles = RoleUtils.extractFromUser