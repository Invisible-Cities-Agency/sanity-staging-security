/**
 * @fileoverview Staging Auth Bridge Plugin for Sanity Studio
 * @module staging-auth-bridge
 * 
 * This plugin connects Sanity Studio authentication with
 * and the NextJS staging environment. It automatically validates user sessions
 * when they log into Sanity and grants them access to the staging site based
 * on their Sanity roles.
 * 
 * @example
 * ```typescript
 * // In your sanity.config.ts
 * import { stagingAuthBridge } from '@invisiblecities/sanity-staging-auth-bridge'
 * 
 * export default defineConfig({
 *   // ... other config
 *   plugins: [
 *     stagingAuthBridge()
 *   ]
 * })
 * ```
 * 
 * @remarks
 * This plugin requires the following environment variables:
 * - SANITY_STUDIO_LOGFLARE_API_KEY (optional): For production logging
 * - SANITY_STUDIO_LOGFLARE_SOURCE_ID (optional): For production logging
 * 
 * The plugin will work without these variables but logging will be limited
 * to console output in development mode.
 * 
 * @see {@link https://github.com/invisiblecities/sanity-staging-auth-bridge} for full documentation
 */

import { definePlugin } from 'sanity'
import { StudioAuthBridge } from './StudioAuthBridge'
import { stagingAuthSettings } from './schema/settings'

/**
 * Plugin configuration options
 */
export interface StagingAuthBridgeOptions {
  /**
   * Hide the settings from the main settings menu
   * @default false
   */
  hideFromSettings?: boolean
}

/**
 * Staging Auth Bridge plugin definition
 * 
 * This plugin wraps the Sanity Studio layout component to provide automatic
 * session validation when users log in. It also enables PostMessage communication
 * with embedded iframes for auth status queries.
 * 
 * @param options - Plugin configuration options
 * @public
 * 
 * @example
 * ```ts
 * // Show in settings menu (default)
 * plugins: [
 *   stagingAuthBridge()
 * ]
 * 
 * // Hide from settings menu
 * plugins: [
 *   stagingAuthBridge({ hideFromSettings: true })
 * ]
 * ```
 */
export const stagingAuthBridge = definePlugin<StagingAuthBridgeOptions | void>((options = {}) => ({
  name: 'staging-auth-bridge',
  
  // Add schema types
  schema: {
    types: [stagingAuthSettings],
  },
  
  
  // Add studio components
  studio: {
    components: {
      layout: StudioAuthBridge,
    },
  },
  
  // Store options for use in structure builder
  __internal: {
    hideFromSettings: options.hideFromSettings || false,
  },
}))

/**
 * Export helper for structure builder integration
 */
export { createSettingsListItem } from './schema/settings'

/**
 * Export types for consumers
 */
export type { StagingAuthSettingsDocument } from './schema/settings'
export type { StagingAuthConfig } from './types'

/**
 * Export utilities for advanced usage
 */
export { getConfig } from './config'
export { normalizeRoleName, getHighestPriorityRole } from './config'