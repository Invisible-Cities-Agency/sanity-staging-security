/**
 * @fileoverview Debug logging utilities
 * @module staging-auth-bridge/utils/debug
 * 
 * Provides centralized debug logging that respects the debug mode
 * configuration setting.
 */

import { getConfig } from '../config'

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
    if (getConfig().features.debugMode) {
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
    if (getConfig().features.debugMode) {
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
    if (getConfig().features.debugMode) {
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
    return {
      log: (message: string, data?: unknown) => Debug.log(component, message, data),
      error: (message: string, error: unknown) => Debug.error(component, message, error),
      warn: (message: string, data?: unknown) => Debug.warn(component, message, data),
    }
  },
} as const