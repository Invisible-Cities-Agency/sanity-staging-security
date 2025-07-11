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
  PostMessageAuthResponseSchema
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
 * - Rate limits validation attempts
 * - Uses secure HTTPS endpoints in production
 */
export function StudioAuthBridge(props: StudioAuthBridgeProps) {
  const currentUser = useCurrentUser()
  const toast = useToast()
  const { validateSession, isValidating, lastValidation } = useStudioAuth()
  const config = getConfig()

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return

    // Check if we're in debug mode
    const isDebug = config.features.debugMode

    // Auto-validate when user logs in (if enabled)
    if (config.features.autoValidation && currentUser?.id && !lastValidation) {
      if (isDebug) {
        console.log('[StudioAuthBridge] User logged in, initiating validation', {
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email
        })
      }

      validateSession()
        .then((result) => {
          if (result.authorized) {
            if (config.features.showToasts) {
              toast.push({
                status: 'success',
                title: 'Staging Access Granted',
                description: `You now have access to ${config.urls.staging} as ${result.role}`
              })
            }
          } else if (isDebug && config.features.showToasts) {
            toast.push({
              status: 'warning',
              title: 'Staging Access Not Available',
              description: result.error || 'Session validation failed'
            })
          }
        })
          .catch((error) => {
          if (isDebug) {
            console.error('[StudioAuthBridge] Validation error:', error)
            if (config.features.showToasts) {
              toast.push({
                status: 'error',
                title: 'Auth Bridge Error',
                description: error.message
              })
            }
          }
        })
    }

    /**
     * Handle PostMessage events from embedded iframes
     * 
     * This handler listens for authentication status requests from iframes
     * and responds with the current auth state. It validates the origin
     * and message structure before responding.
     * 
     * @param event - The MessageEvent from the iframe
     */
    const handleMessage = (event: MessageEvent) => {
      // Cast to branded unknown type for safe validation
      const messageData = event.data as PostMessageDataUnknown
      
      if (config.features.enablePostMessage && isPostMessageAuthRequest(messageData)) {
        // Only respond to trusted origins
        if (!config.security.allowedOrigins.includes(event.origin)) {
          console.warn('[StudioAuthBridge] Ignoring message from untrusted origin:', event.origin)
          return
        }

        // Create validated response with correlation ID
        const response = PostMessageAuthResponseSchema.parse({
          type: 'staging-auth-status',
          authenticated: !!currentUser?.id,
          hasValidation: !!lastValidation,
          isValidating,
          correlationId: messageData.correlationId
        })

        // Send current auth status
        event.source?.postMessage(response, event.origin)

        if (isDebug) {
          console.log('[StudioAuthBridge] Sent auth status to iframe:', {
            origin: event.origin,
            authenticated: !!currentUser?.id,
            correlationId: messageData.correlationId
          })
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [currentUser, validateSession, lastValidation, isValidating, toast, config])

  // Render the wrapped layout
  return <>{props.renderDefault(props)}</>
}