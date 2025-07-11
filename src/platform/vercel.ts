/**
 * @fileoverview Vercel Edge Runtime optimizations
 * @module staging-auth-bridge/platform/vercel
 * 
 * This module provides Vercel-specific optimizations for Edge Runtime
 * and serverless functions.
 */

import type { Logger, LogContext } from '../types'
import { Platform } from './index'

/**
 * Vercel Edge Runtime detection
 */
export const isVercelEdge = () => {
  return process.env.VERCEL === '1' && typeof EdgeRuntime !== 'undefined'
}

/**
 * Vercel region detection
 */
export const getVercelRegion = () => {
  return process.env.VERCEL_REGION || 'unknown'
}

/**
 * Edge-compatible console logger
 * Uses console with structured logging for edge runtime environments
 */
export class EdgeConsoleLogger implements Logger {
  private context: LogContext

  constructor(context: LogContext) {
    this.context = {
      ...context,
      platform: 'vercel-edge',
      region: getVercelRegion(),
    }
  }

  private log(level: string, context: LogContext, message: string) {
    const logData = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...context,
    }

    // Vercel automatically captures console logs
    console.log(JSON.stringify(logData))
  }

  info(context: LogContext, message: string) {
    this.log('info', context, message)
  }

  error(context: LogContext, message: string) {
    this.log('error', context, message)
  }

  warn(context: LogContext, message: string) {
    this.log('warn', context, message)
  }

  debug(context: LogContext, message: string) {
    if (process.env.SANITY_STUDIO_DEBUG === 'true') {
      this.log('debug', context, message)
    }
  }

  async flush() {
    // No-op for Vercel - logs are automatically flushed
  }
}

/**
 * Vercel KV storage adapter for caching
 * Provides fast edge-native caching when available
 */
export const vercelCache = {
  /**
   * Get value from Vercel KV if available
   */
  get: async (key: string): Promise<string | null> => {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return null
    }

    try {
      const response = await fetch(
        `${process.env.KV_REST_API_URL}/get/${key}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
          },
        }
      )

      if (!response.ok) return null
      
      const data = await response.json()
      return data.result
    } catch {
      return null
    }
  },

  /**
   * Set value in Vercel KV if available
   */
  set: async (key: string, value: string, ttl?: number): Promise<void> => {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return
    }

    try {
      const body: any = {
        key,
        value,
      }
      
      if (ttl) {
        body.ex = ttl // Expiry in seconds
      }

      await fetch(
        `${process.env.KV_REST_API_URL}/set`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      )
    } catch {
      // Silently fail - caching is optional
    }
  },
}

/**
 * Vercel-optimized fetch with automatic retries and timeouts
 */
export async function vercelFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const maxRetries = 3
  const baseDelay = 1000
  
  // Add Vercel-specific headers
  const headers = {
    ...options.headers,
    'x-vercel-region': getVercelRegion(),
  }

  // Set appropriate timeout for Edge Runtime (max 25 seconds)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)

  try {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        })

        if (response.ok || response.status < 500) {
          return response
        }

        // Retry on 5xx errors
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, baseDelay * Math.pow(2, attempt))
          )
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout on Vercel Edge Runtime')
        }
        
        if (attempt === maxRetries - 1) {
          throw error
        }
      }
    }

    throw new Error('Max retries exceeded')
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Vercel Edge Config integration for feature flags and configuration
 * 
 * @remarks
 * To use Edge Config:
 * 1. Install Vercel CLI: `npm i -g vercel`
 * 2. Create Edge Config: `vercel edge-config create staging-auth-config`
 * 3. Link to project: `vercel env pull`
 * 4. Add items via dashboard or CLI
 */
export const edgeConfig = {
  /**
   * Check if Edge Config is available
   */
  isAvailable: () => !!process.env.EDGE_CONFIG,
  
  /**
   * Get feature flag from Edge Config
   */
  getFeatureFlag: async (flag: string): Promise<boolean> => {
    if (!process.env.EDGE_CONFIG) {
      return false
    }

    try {
      // Dynamic import with fallback - Edge Config is optional
      const edgeConfig = await import('@vercel/edge-config').catch(() => null)
      if (!edgeConfig) return false
      
      const value = await edgeConfig.get(flag)
      return value === true
    } catch (error) {
      console.warn('[EdgeConfig] Failed to get feature flag:', flag, error)
      return false
    }
  },

  /**
   * Get all feature flags
   */
  getAllFlags: async (): Promise<Record<string, boolean>> => {
    if (!process.env.EDGE_CONFIG) {
      return {}
    }

    try {
      // Dynamic import with fallback - Edge Config is optional
      const edgeConfig = await import('@vercel/edge-config').catch(() => null)
      if (!edgeConfig) return {}
      
      const config = await edgeConfig.getAll()
      const flags: Record<string, boolean> = {}
      
      for (const [key, value] of Object.entries(config || {})) {
        if (key.startsWith('feature_') && typeof value === 'boolean') {
          flags[key] = value
        }
      }
      
      return flags
    } catch (error) {
      console.warn('[EdgeConfig] Failed to get all flags:', error)
      return {}
    }
  },
  
  /**
   * Get configuration value with type safety
   */
  getConfig: async <T = unknown>(key: string, defaultValue: T): Promise<T> => {
    if (!process.env.EDGE_CONFIG) {
      return defaultValue
    }

    try {
      const edgeConfig = await import('@vercel/edge-config').catch(() => null)
      if (!edgeConfig) return defaultValue
      
      const value = await edgeConfig.get(key)
      return (value as T) ?? defaultValue
    } catch {
      return defaultValue
    }
  },
  
  /**
   * Get multiple configuration values
   */
  getMultiple: async (keys: string[]): Promise<Record<string, unknown>> => {
    if (!process.env.EDGE_CONFIG || keys.length === 0) {
      return {}
    }

    try {
      const edgeConfig = await import('@vercel/edge-config').catch(() => null)
      if (!edgeConfig) return {}
      
      const values: Record<string, unknown> = {}
      const allConfig = await edgeConfig.getAll()
      
      for (const key of keys) {
        if (key in allConfig) {
          values[key] = allConfig[key]
        }
      }
      
      return values
    } catch {
      return {}
    }
  },
}

/**
 * Export Vercel-specific utilities
 */
export const vercel = {
  isEdge: isVercelEdge,
  getRegion: getVercelRegion,
  Logger: EdgeConsoleLogger,
  cache: vercelCache,
  fetch: vercelFetch,
  edgeConfig,
}