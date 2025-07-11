/**
 * @fileoverview Debug logging utilities
 * @module staging-auth-bridge/utils/debug
 * 
 * Provides centralized debug logging that respects the debug mode
 * configuration setting.
 */

// Cache debug mode state to avoid repeated config lookups
let debugMode: boolean | null = null
let configLoaded = false

// Check environment variable directly for immediate debug mode
const envDebugMode = process.env.NODE_ENV === 'development' || process.env.SANITY_STUDIO_DEBUG === 'true'

/**
 * Initialize debug mode from config
 */
async function initDebugMode(): Promise<void> {
  if (configLoaded) return
  
  try {
    // Lazy load config to avoid circular dependencies
    const { getConfig } = await import('../config')
    debugMode = getConfig().features.debugMode
    configLoaded = true
  } catch (error) {
    console.warn('[Debug] Failed to load config, using environment fallback:', error)
    debugMode = envDebugMode
    configLoaded = true
  }
}

// Start initialization but don't block
initDebugMode().catch(() => {
  debugMode = envDebugMode
  configLoaded = true
})

/**
 * Check if debug mode is enabled
 */
function isDebugEnabled(): boolean {
  // Use cached value if available, otherwise fall back to env
  return debugMode !== null ? debugMode : envDebugMode
}

/**
 * Debug logging utility
 * 
 * Provides a simple interface for debug logging that automatically
 * checks if debug mode is enabled before logging.
 */
export const Debug = {
  /**
   * Log a debug message if debug mode is enabled
   * 
   * @param component - Component name for context
   * @param message - Debug message
   * @param data - Optional data to log
   */
  log(component: string, message: string, data?: unknown): void {
    if (isDebugEnabled()) {
      const prefix = `[${component}]`
      if (data !== undefined) {
        console.log(prefix, message, data)
      } else {
        console.log(prefix, message)
      }
    }
  },
  
  /**
   * Log an error with debug context
   * 
   * @param component - Component name for context
   * @param message - Error message
   * @param error - Error object or data
   */
  error(component: string, message: string, error: unknown): void {
    if (isDebugEnabled()) {
      console.error(`[${component}]`, message, error)
    }
  },
  
  /**
   * Log a warning with debug context
   * 
   * @param component - Component name for context
   * @param message - Warning message
   * @param data - Optional data to log
   */
  warn(component: string, message: string, data?: unknown): void {
    if (isDebugEnabled()) {
      const prefix = `[${component}]`
      if (data !== undefined) {
        console.warn(prefix, message, data)
      } else {
        console.warn(prefix, message)
      }
    }
  },
  
  /**
   * Create a component-specific debug logger
   * 
   * @param component - Component name
   * @returns Object with log, error, and warn methods bound to the component
   */
  createLogger(component: string) {
    // Return a logger that checks debug mode at creation time
    const enabled = isDebugEnabled()
    
    return {
      log: enabled 
        ? (message: string, data?: unknown) => Debug.log(component, message, data)
        : () => {},
      error: enabled
        ? (message: string, error: unknown) => Debug.error(component, message, error)
        : () => {},
      warn: enabled
        ? (message: string, data?: unknown) => Debug.warn(component, message, data)
        : () => {},
    }
  },
} as const