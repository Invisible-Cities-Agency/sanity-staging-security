/**
 * @fileoverview Studio Auth Bridge Layout Component
 * @module staging-auth-bridge/components/StudioAuthBridge
 * 
 * This component wraps the Sanity Studio layout to provide automatic authentication
 * bridging with the staging environment. It handles:
 * - Auto-validation when users log into Sanity
 * - PostMessage communication with embedded iframes
 * - Toast notifications for auth status
 * - Debug logging in development mode
 */

import React, { useEffect } from 'react'
import { useCurrentUser } from 'sanity'
import { useToast } from '@sanity/ui'
import { useStudioAuth } from './hooks/useStudioAuth'
import { getConfig } from './config'
import type { 
  StudioAuthBridgeProps, 
  PostMessageDataUnknown
} from './types'
import { 
  isPostMessageAuthRequest,
  PostMessageAuthResponseSchema,
  PostMessageNonceRegistrationSchema
} from './types/branded'

/**
 * Studio Auth Bridge Layout Component
 * 
 * This component intercepts the Sanity Studio layout render to add authentication
 * bridging capabilities. It runs validation automatically when a user logs in
 * and handles cross-origin communication for embedded preview iframes.
 * 
 * @param props - Component props including the renderDefault function
 * @returns The wrapped layout component
 * 
 * @example
 * ```tsx
 * // This is used internally by the plugin and not directly by consumers
 * // The plugin automatically wraps the studio layout with this component
 * ```
 * 
 * @remarks
 * Security considerations:
 * - Only responds to PostMessage from trusted origins
 * - Validates all incoming message data with Zod schemas
 * - Requires CSRF nonce validation for enhanced security
 * - Rate limits validation attempts
 * - Uses secure HTTPS endpoints in production
 * 
 * CSRF Protection Usage (from iframe):
 * ```javascript
 * // 1. Generate a nonce
 * const nonce = crypto.randomUUID()
 * 
 * // 2. Register the nonce
 * parent.postMessage({
 *   type: 'register-nonce',
 *   nonce: nonce,
 *   origin: window.location.origin
 * }, studioOrigin)
 * 
 * // 3. Use the nonce in auth requests
 * parent.postMessage({
 *   type: 'request-staging-auth-status',
 *   nonce: nonce,
 *   correlationId: 'some-id'
 * }, studioOrigin)
 * ```
 */
export function StudioAuthBridge(props: StudioAuthBridgeProps) {
  const currentUser = useCurrentUser()
  const toast = useToast()
  const { validateSession, isValidating, lastValidation } = useStudioAuth()
  const config = getConfig()
  
  // Generate CSRF token for this session
  const [_csrfToken] = React.useState(() => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    return `csrf-${Date.now()}-${Math.random().toString(36).substring(2)}`
  })
  
  // Store valid nonces from child iframes
  const validNonces = React.useRef<Set<string>>(new Set())

  // Helper function to validate message origin
  const isValidOrigin = React.useCallback((origin: string): boolean => {
    return config.security.allowedOrigins.includes(origin)
  }, [config.security.allowedOrigins])

  // Helper function to validate nonce
  const isValidNonce = (nonce: string | undefined): boolean => {
    return !nonce || validNonces.current.has(nonce)
  }

  // Handle nonce registration
  const handleNonceRegistration = React.useCallback((messageData: PostMessageDataUnknown, eventOrigin: string): boolean => {
    try {
      const nonceReg = PostMessageNonceRegistrationSchema.parse(messageData)
      if (nonceReg.type === 'register-nonce' && nonceReg.origin === eventOrigin) {
        validNonces.current.add(nonceReg.nonce)
        if (config.features.debugMode) {
          console.log('[StudioAuthBridge] Registered nonce from iframe:', {
            nonce: nonceReg.nonce.substring(0, 8) + '...',
            origin: eventOrigin
          })
        }
        return true
      }
    } catch {
      // Not a nonce registration
    }
    return false
  }, [config.features.debugMode])

  // Handle auth status request
  const handleAuthRequest = React.useCallback((event: MessageEvent, messageData: PostMessageDataUnknown): void => {
    if (!config.features.enablePostMessage || !isPostMessageAuthRequest(messageData)) {
      return
    }

    // Validate CSRF nonce if provided
    if (messageData.nonce && !isValidNonce(messageData.nonce)) {
      console.warn('[StudioAuthBridge] Invalid or missing CSRF nonce:', {
        origin: event.origin,
        nonce: messageData.nonce?.substring(0, 8) + '...'
      })
      return
    }

    // Create validated response with correlation ID and nonce
    const response = PostMessageAuthResponseSchema.parse({
      type: 'staging-auth-status',
      authenticated: !!currentUser?.id,
      hasValidation: !!lastValidation,
      isValidating,
      correlationId: messageData.correlationId,
      nonce: messageData.nonce // Echo back the nonce
    })

    // Send current auth status
    if (event.source && 'postMessage' in event.source) {
      (event.source as Window).postMessage(response, event.origin)
    }

    if (config.features.debugMode) {
      console.log('[StudioAuthBridge] Sent auth status to iframe:', {
        origin: event.origin,
        authenticated: !!currentUser?.id,
        correlationId: messageData.correlationId
      })
    }
  }, [config.features.enablePostMessage, config.features.debugMode, currentUser?.id, lastValidation, isValidating])

  // Handle auto-validation on user login
  const handleAutoValidation = React.useCallback(async () => {
    if (!config.features.autoValidation || !currentUser?.id || lastValidation) {
      return
    }

    if (config.features.debugMode) {
      console.log('[StudioAuthBridge] User logged in, initiating validation', {
        hasUserId: !!currentUser.id
      })
    }

    try {
      const result = await validateSession()
      
      if (result.authorized && config.features.showToasts) {
        toast.push({
          status: 'success',
          title: 'Staging Access Granted',
          description: `You now have access to ${config.urls.staging} as ${result.role}`
        })
      } else if (!result.authorized && config.features.debugMode && config.features.showToasts) {
        toast.push({
          status: 'warning',
          title: 'Staging Access Not Available',
          description: result.error || 'Session validation failed'
        })
      }
    } catch (error) {
      if (config.features.debugMode) {
        console.error('[StudioAuthBridge] Validation error:', error)
        if (config.features.showToasts) {
          toast.push({
            status: 'error',
            title: 'Auth Bridge Error',
            description: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }
  }, [config.features.autoValidation, config.features.debugMode, config.features.showToasts, config.urls.staging, currentUser?.id, lastValidation, validateSession, toast])

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return

    // Handle auto-validation
    handleAutoValidation()

    /**
     * Handle PostMessage events from embedded iframes
     */
    const handleMessage = (event: MessageEvent) => {
      // Validate origin first
      if (!isValidOrigin(event.origin)) {
        console.warn('[StudioAuthBridge] Ignoring message from untrusted origin:', event.origin)
        return
      }

      // Cast to branded unknown type for safe validation
      const messageData = event.data as PostMessageDataUnknown
      
      // Try to handle nonce registration first
      if (handleNonceRegistration(messageData, event.origin)) {
        return
      }
      
      // Handle auth request
      handleAuthRequest(event, messageData)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [currentUser, validateSession, lastValidation, isValidating, toast, config, handleAuthRequest, handleAutoValidation, handleNonceRegistration, isValidOrigin])

  // Render the wrapped layout
  return <>{props.renderDefault(props)}</>
}