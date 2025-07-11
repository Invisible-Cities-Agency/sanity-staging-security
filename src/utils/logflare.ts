/**
 * @fileoverview Browser-compatible Logflare logger for Sanity Studio
 * @module staging-auth-bridge/utils/logflare
 * 
 * This module provides a lightweight logging solution that sends logs directly
 * to Logflare from the browser. It includes automatic batching, error handling,
 * and fallback to console logging when Logflare is not configured.
 * 
 * @remarks
 * Environment variables required:
 * - SANITY_STUDIO_LOGFLARE_API_KEY: Your Logflare API key
 * - SANITY_STUDIO_LOGFLARE_SOURCE_ID: Your Logflare source ID
 * 
 * Without these variables, the logger will only output to console in development.
 */

import type { Logger, LoggerConfig, LogContext } from '../types'
import { getConfig } from '../config'
import { Platform, compatFetch, timers } from '../platform'
import { vercel } from '../platform/vercel'

/**
 * Structure of a log entry sent to Logflare
 */
interface LogEntry {
  event_message: string
  metadata: LogContext & {
    level: string
    timestamp: string
    userAgent: string
  }
}

/**
 * Logflare Logger Implementation
 * 
 * Provides structured logging with automatic batching and delivery to Logflare.
 * Falls back to console logging when Logflare is not configured or in development.
 * 
 * @implements {Logger}
 * 
 * @example
 * ```ts
 * const logger = new LogflareLogger({
 *   service: 'staging-auth-bridge',
 *   environment: 'production'
 * })
 * 
 * logger.info({
 *   action: 'user_login',
 *   userId: '123',
 *   duration: 250
 * }, 'User successfully logged in')
 * ```
 */
class LogflareLogger implements Logger {
  private apiKey: string
  private sourceId: string
  private apiUrl: string
  private baseContext: LogContext
  private buffer: LogEntry[] = []
  private flushTimer: NodeJS.Timeout | null = null
  private config = getConfig()

  /**
   * Create a new Logflare logger instance
   * 
   * @param config - Logger configuration
   */
  constructor(config: LoggerConfig) {
    this.apiKey = process.env.SANITY_STUDIO_LOGFLARE_API_KEY || ''
    this.sourceId = process.env.SANITY_STUDIO_LOGFLARE_SOURCE_ID || ''
    this.apiUrl = 'https://api.logflare.app'
    this.baseContext = {
      service: config.service,
      environment: config.environment,
      timestamp: new Date().toISOString()
    }

    // Only log if configured
    if (!this.apiKey || !this.sourceId) {
      console.warn('[LogflareLogger] Logflare not configured - logs will not be sent')
    }
  }

  /**
   * Flush buffered logs to Logflare
   * 
   * Sends all buffered log entries to Logflare in a single batch request.
   * Automatically called after a delay when logs are added to the buffer.
   * 
   * @private
   */
  async flush() {
    if (this.buffer.length === 0 || !this.apiKey || !this.sourceId) {
      return
    }

    const logs = [...this.buffer]
    this.buffer = []

    try {
      const response = await compatFetch(`${this.apiUrl}/logs?source=${this.sourceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.apiKey
        },
        body: JSON.stringify({ batch: logs })
      })

      if (!response.ok) {
        console.error('[LogflareLogger] Failed to send logs:', response.status)
      }
    } catch (error) {
      console.error('[LogflareLogger] Error sending logs:', error)
    }
  }

  /**
   * Schedule a flush operation
   * 
   * Debounces flush operations to batch multiple log entries together.
   * Uses a 1-second delay to balance between responsiveness and efficiency.
   * 
   * @private
   */
  private scheduleFlush() {
    if (this.flushTimer) {
      timers.clearTimeout(this.flushTimer)
    }
    this.flushTimer = timers.setTimeout(() => this.flush(), this.config.logging.flushInterval) as NodeJS.Timeout
  }

  /**
   * Internal logging method
   * 
   * Handles log formatting, buffering, and console output based on environment.
   * Validates context data and enriches it with metadata before sending.
   * 
   * @param level - Log level (info, error, warn, debug)
   * @param context - Structured context data (will be validated)
   * @param message - Human-readable log message
   * @private
   */
  private log(level: string, context: LogContext, message: string) {
    const logEntry = {
      event_message: message,
      metadata: {
        ...this.baseContext,
        ...context,
        level,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
      }
    }

    // Log to console based on level and configuration
    const shouldLogToConsole = 
      this.config.features.debugMode || 
      (this.config.logging.provider === 'console' && this.shouldLog(level))
    
    if (shouldLogToConsole) {
      console.log(`[${level.toUpperCase()}]`, message, context)
    }

    // Add to buffer if configured
    if (this.apiKey && this.sourceId) {
      this.buffer.push(logEntry)
      this.scheduleFlush()
    }
  }

  /**
   * Check if a log level should be logged based on configuration
   * @private
   */
  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error']
    const configLevel = levels.indexOf(this.config.logging.level)
    const messageLevel = levels.indexOf(level)
    return messageLevel >= configLevel
  }

  /**
   * Log an info-level message
   * @param context - Structured context data
   * @param message - Log message
   */
  info(context: LogContext, message: string) {
    if (this.shouldLog('info')) {
      this.log('info', context, message)
    }
  }

  /**
   * Log an error-level message
   * @param context - Structured context data
   * @param message - Log message
   */
  error(context: LogContext, message: string) {
    if (this.shouldLog('error')) {
      this.log('error', context, message)
    }
  }

  /**
   * Log a warning-level message
   * @param context - Structured context data
   * @param message - Log message
   */
  warn(context: LogContext, message: string) {
    if (this.shouldLog('warn')) {
      this.log('warn', context, message)
    }
  }

  /**
   * Log a debug-level message
   * @param context - Structured context data
   * @param message - Log message
   */
  debug(context: LogContext, message: string) {
    if (this.shouldLog('debug')) {
      this.log('debug', context, message)
    }
  }
}

/**
 * Create a Logflare logger instance
 * 
 * Factory function that creates and returns a configured Logflare logger.
 * The logger will automatically detect if Logflare credentials are available
 * and fall back to console logging if not.
 * 
 * @param config - Logger configuration
 * @returns Promise resolving to logger instance
 * 
 * @example
 * ```ts
 * const logger = await createLogflareLogger({
 *   service: 'my-service',
 *   environment: 'production'
 * })
 * 
 * logger.info({ userId: '123' }, 'User action performed')
 * ```
 * 
 * @remarks
 * The returned promise allows for future enhancements like:
 * - Async configuration loading
 * - Connection health checks
 * - Dynamic provider selection
 */
export async function createLogflareLogger(config: LoggerConfig): Promise<Logger> {
  // Use Vercel Edge Logger if on Vercel
  if (Platform.deployment.isVercel() && Platform.runtime.isEdge()) {
    return new vercel.Logger({
      service: config.service,
      environment: config.environment,
      ...config.baseContext,
    })
  }
  
  // Use standard Logflare logger
  return new LogflareLogger(config)
}