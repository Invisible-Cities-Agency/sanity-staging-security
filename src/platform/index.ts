/**
 * @fileoverview Platform compatibility and optimization layer
 * @module staging-auth-bridge/platform
 * 
 * This module provides platform-specific optimizations and compatibility
 * shims for various deployment targets including Vercel, Netlify, and
 * different Node.js versions.
 */


/**
 * Platform detection and feature support
 */
export const Platform = {
  /**
   * Deployment platform detection
   */
  deployment: {
    isVercel: () => process.env.VERCEL === '1',
    isNetlify: () => process.env.NETLIFY === 'true',
    isCloudflare: () => typeof globalThis !== 'undefined' && 'caches' in globalThis,
    isLocal: () => !process.env.VERCEL && !process.env.NETLIFY && process.env.NODE_ENV === 'development',
  },

  /**
   * Runtime environment detection
   */
  runtime: {
    isEdge: () => typeof EdgeRuntime !== 'undefined',
    isBrowser: () => typeof window !== 'undefined',
    isNode: () => typeof process !== 'undefined' && process.versions?.node,
  },

  /**
   * Node.js version checks
   */
  node: {
    version: () => process.versions?.node || '0.0.0',
    major: () => {
      const version = process.versions?.node || '0.0.0'
      return parseInt(version.split('.')[0] || '0', 10)
    },
    isV20Plus: () => Platform.node.major() >= 20,
    isV21Plus: () => Platform.node.major() >= 21,
    isV22Plus: () => Platform.node.major() >= 22,
  },

  /**
   * React version detection
   */
  react: {
    version: () => {
      try {
        // @ts-ignore - React may not be in scope
        return React.version || '0.0.0'
      } catch {
        return '0.0.0'
      }
    },
    major: () => {
      const version = Platform.react.version()
      return parseInt(version.split('.')[0] || '0', 10)
    },
    isV18: () => Platform.react.major() === 18,
    isV19: () => Platform.react.major() === 19,
  },
}

/**
 * Compatibility layer for fetch API
 * Provides consistent fetch behavior across platforms
 */
export const compatFetch = (() => {
  // Vercel Edge Runtime optimization
  if (Platform.deployment.isVercel() && Platform.runtime.isEdge()) {
    return globalThis.fetch.bind(globalThis)
  }
  
  // Standard fetch
  return globalThis.fetch?.bind(globalThis) || fetch
})()

/**
 * Compatibility layer for timers
 * Handles differences in timer implementations
 */
export const timers = {
  setTimeout: (handler: Function, timeout?: number) => {
    if (Platform.runtime.isEdge()) {
      // Edge runtime doesn't support passing args to setTimeout
      return globalThis.setTimeout(() => handler(), timeout)
    }
    return globalThis.setTimeout(handler, timeout)
  },
  
  clearTimeout: (id: any) => {
    return globalThis.clearTimeout(id)
  },
  
  setInterval: (handler: Function, timeout?: number) => {
    if (Platform.runtime.isEdge()) {
      return globalThis.setInterval(() => handler(), timeout)
    }
    return globalThis.setInterval(handler, timeout)
  },
  
  clearInterval: (id: any) => {
    return globalThis.clearInterval(id)
  },
}

/**
 * Compatibility layer for crypto
 * Provides consistent crypto API across platforms
 */
export const crypto = (() => {
  // Browser and modern Node
  if (globalThis.crypto) {
    return globalThis.crypto
  }
  
  // Older Node versions
  if (Platform.runtime.isNode() && !Platform.node.isV20Plus()) {
    try {
      const nodeCrypto = require('crypto')
      return {
        randomUUID: () => nodeCrypto.randomUUID(),
        getRandomValues: (arr: Uint8Array) => nodeCrypto.randomFillSync(arr),
      }
    } catch {
      // Fallback
    }
  }
  
  // Fallback implementation
  return {
    randomUUID: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    },
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    },
  }
})()

/**
 * Performance optimization utilities
 */
export const performance = {
  /**
   * Debounce function optimized for platform
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: any
    
    return (...args: Parameters<T>) => {
      timers.clearTimeout(timeout)
      timeout = timers.setTimeout(() => func(...args), wait)
    }
  },

  /**
   * Throttle function optimized for platform
   */
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle = false
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        timers.setTimeout(() => inThrottle = false, limit)
      }
    }
  },
}

/**
 * Platform-specific fetch options
 */
export function getFetchOptions(): RequestInit {
  const baseOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  }

  // Vercel-specific optimizations
  if (Platform.deployment.isVercel()) {
    return {
      ...baseOptions,
      // Vercel edge functions have a 25 second timeout
      signal: AbortSignal.timeout(20000),
    }
  }

  // Netlify-specific optimizations
  if (Platform.deployment.isNetlify()) {
    return {
      ...baseOptions,
      // Netlify functions have a 10 second default timeout
      signal: AbortSignal.timeout(8000),
    }
  }

  // Default options
  return baseOptions
}

/**
 * React 18/19 compatibility hooks
 */
export const reactCompat = {
  /**
   * Use startTransition if available (React 18+)
   */
  startTransition: (callback: () => void) => {
    try {
      // @ts-ignore - React may not have startTransition
      if (React.startTransition) {
        // @ts-ignore
        React.startTransition(callback)
      } else {
        callback()
      }
    } catch {
      callback()
    }
  },

  /**
   * Deferred value fallback (non-hook version)
   */
  useDeferredValue: <T>(value: T): T => {
    // Simple fallback - just return the value
    // This is a utility function, not a React hook
    return value
  },
}

/**
 * Export platform utilities for other modules
 */
export { Platform as PlatformUtils }