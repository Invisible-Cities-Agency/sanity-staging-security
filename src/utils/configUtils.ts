/**
 * Configuration utilities for deep cloning and merging
 */

import type { StagingAuthConfig } from '../types'

/**
 * Deep clone an object using the most appropriate method available
 */
export function deepClone<T>(obj: T): T {
  // Use native structuredClone if available (Node 17+, modern browsers)
  if (typeof structuredClone !== 'undefined') {
    return structuredClone(obj)
  }
  
  // Fallback to JSON parse/stringify for older environments
  // Note: This won't handle undefined, functions, symbols, etc.
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Deep merge configuration objects
 * Target object is not mutated - returns a new merged object
 */
export function mergeConfig(
  base: StagingAuthConfig,
  overrides: Partial<StagingAuthConfig>
): StagingAuthConfig {
  const result = deepClone(base)
  
  // Merge URLs
  if (overrides.urls) {
    if (overrides.urls.staging) {
      result.urls.staging = overrides.urls.staging
    }
    if (overrides.urls.development) {
      result.urls.development = overrides.urls.development
    }
    if (overrides.urls.apiEndpoints) {
      Object.assign(result.urls.apiEndpoints, overrides.urls.apiEndpoints)
    }
  }
  
  // Merge security settings
  if (overrides.security) {
    Object.assign(result.security, overrides.security)
    // Special handling for arrays
    if (overrides.security.allowedOrigins) {
      result.security.allowedOrigins = [...overrides.security.allowedOrigins]
    }
  }
  
  // Merge logging settings
  if (overrides.logging) {
    Object.assign(result.logging, overrides.logging)
  }
  
  // Merge feature flags
  if (overrides.features) {
    Object.assign(result.features, overrides.features)
  }
  
  return result
}

/**
 * Create an immutable configuration object
 */
export function createImmutableConfig(config: StagingAuthConfig): Readonly<StagingAuthConfig> {
  // Freeze the config and all nested objects
  const frozen = deepClone(config)
  deepFreeze(frozen)
  return frozen
}

/**
 * Recursively freeze an object to make it immutable
 */
function deepFreeze<T extends object>(obj: T): void {
  Object.freeze(obj)
  
  Object.getOwnPropertyNames(obj).forEach(prop => {
    const value = (obj as any)[prop]
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value)
    }
  })
}