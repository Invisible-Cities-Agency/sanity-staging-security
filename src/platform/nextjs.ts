/**
 * @fileoverview Next.js version compatibility layer
 * @module staging-auth-bridge/platform/nextjs
 * 
 * This module provides compatibility shims for different Next.js versions
 * (13, 14, 15) to ensure the plugin works across upgrades.
 */

/**
 * Next.js version detection
 */
export const NextJS = {
  /**
   * Get Next.js version from package
   */
  version: (): string => {
    try {
      // Try to get version from Next.js package
      const pkg = require('next/package.json')
      return pkg.version || '0.0.0'
    } catch {
      // Check if we're in a Next.js environment
      if (typeof window !== 'undefined' && window.__NEXT_DATA__) {
        return 'unknown'
      }
      return '0.0.0'
    }
  },

  /**
   * Get major version number
   */
  major: (): number => {
    const version = NextJS.version()
    return parseInt(version.split('.')[0], 10)
  },

  /**
   * Version checks
   */
  is13: () => NextJS.major() === 13,
  is14: () => NextJS.major() === 14,
  is15: () => NextJS.major() === 15,
  is13Plus: () => NextJS.major() >= 13,
  is14Plus: () => NextJS.major() >= 14,
  is15Plus: () => NextJS.major() >= 15,
}

/**
 * Router compatibility layer
 * Handles differences between Next.js router versions
 */
export const routerCompat = {
  /**
   * Get current pathname
   */
  getPathname: (): string => {
    if (typeof window === 'undefined') return ''

    // Next.js 13+ App Router
    if (NextJS.is13Plus()) {
      try {
        // @ts-ignore - Next may not be in scope
        const { usePathname } = require('next/navigation')
        return usePathname() || ''
      } catch {
        // Fallback to window location
      }
    }

    // Pages Router or fallback
    return window.location.pathname
  },

  /**
   * Get search params
   */
  getSearchParams: (): URLSearchParams => {
    if (typeof window === 'undefined') return new URLSearchParams()

    // Next.js 13+ App Router
    if (NextJS.is13Plus()) {
      try {
        // @ts-ignore - Next may not be in scope
        const { useSearchParams } = require('next/navigation')
        return useSearchParams() || new URLSearchParams()
      } catch {
        // Fallback to window location
      }
    }

    // Pages Router or fallback
    return new URLSearchParams(window.location.search)
  },

  /**
   * Navigate to URL (client-side)
   */
  push: (url: string): void => {
    if (typeof window === 'undefined') return

    // Next.js 13+ App Router
    if (NextJS.is13Plus()) {
      try {
        // @ts-ignore - Next may not be in scope
        const { useRouter } = require('next/navigation')
        const router = useRouter()
        router.push(url)
        return
      } catch {
        // Fallback to window navigation
      }
    }

    // Fallback
    window.location.href = url
  },
}

/**
 * Dynamic import compatibility
 * Handles differences in dynamic imports across Next.js versions
 */
export const dynamicCompat = {
  /**
   * Dynamic import with proper loading states
   */
  import: async <T = any>(
    loader: () => Promise<T>,
    options?: {
      loading?: () => React.ReactElement
      error?: (error: Error) => React.ReactElement
    }
  ): Promise<T> => {
    try {
      return await loader()
    } catch (error) {
      if (options?.error && error instanceof Error) {
        console.error('Dynamic import failed:', error)
        throw error
      }
      throw error
    }
  },
}

/**
 * Headers compatibility layer
 * Handles differences in headers API across Next.js versions
 */
export const headersCompat = {
  /**
   * Get request headers in a compatible way
   */
  getHeaders: (): Headers => {
    // Next.js 13+ with App Router
    if (NextJS.is13Plus()) {
      try {
        // @ts-ignore - Next may not be in scope
        const { headers } = require('next/headers')
        return headers()
      } catch {
        // Fallback
      }
    }

    // Return empty headers as fallback
    return new Headers()
  },

  /**
   * Get specific header value
   */
  get: (name: string): string | null => {
    const headers = headersCompat.getHeaders()
    return headers.get(name)
  },
}

/**
 * Cookies compatibility layer
 * Handles differences in cookies API across Next.js versions
 */
export const cookiesCompat = {
  /**
   * Get cookie value
   */
  get: async (name: string): Promise<string | undefined> => {
    // Server-side Next.js 13+
    if (typeof window === 'undefined' && NextJS.is13Plus()) {
      try {
        // @ts-ignore - Next may not be in scope
        const { cookies } = require('next/headers')
        const cookieStore = await cookies()
        return cookieStore.get(name)?.value
      } catch {
        // Fallback
      }
    }

    // Client-side fallback
    if (typeof document !== 'undefined') {
      const value = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${name}=`))
        ?.split('=')[1]
      return value
    }

    return undefined
  },

  /**
   * Set cookie value
   */
  set: async (
    name: string,
    value: string,
    options?: {
      maxAge?: number
      httpOnly?: boolean
      secure?: boolean
      sameSite?: 'lax' | 'strict' | 'none'
      path?: string
    }
  ): Promise<void> => {
    // Server-side Next.js 13+
    if (typeof window === 'undefined' && NextJS.is13Plus()) {
      try {
        // @ts-ignore - Next may not be in scope
        const { cookies } = require('next/headers')
        const cookieStore = await cookies()
        cookieStore.set(name, value, options)
        return
      } catch {
        // Fallback
      }
    }

    // Client-side fallback
    if (typeof document !== 'undefined') {
      let cookieString = `${name}=${value}`
      
      if (options?.maxAge) {
        cookieString += `; max-age=${options.maxAge}`
      }
      if (options?.path) {
        cookieString += `; path=${options.path}`
      }
      if (options?.secure) {
        cookieString += '; secure'
      }
      if (options?.sameSite) {
        cookieString += `; samesite=${options.sameSite}`
      }
      
      document.cookie = cookieString
    }
  },
}

/**
 * Metadata compatibility layer
 * Handles differences in metadata API across Next.js versions
 */
export const metadataCompat = {
  /**
   * Generate metadata object compatible with Next.js version
   */
  generate: (metadata: {
    title?: string
    description?: string
    openGraph?: {
      title?: string
      description?: string
      images?: string[]
    }
  }) => {
    // Next.js 13+ App Router metadata
    if (NextJS.is13Plus()) {
      return {
        title: metadata.title,
        description: metadata.description,
        openGraph: metadata.openGraph,
      }
    }

    // Pages Router Head component props
    return {
      title: metadata.title,
      meta: [
        metadata.description && {
          name: 'description',
          content: metadata.description,
        },
        metadata.openGraph?.title && {
          property: 'og:title',
          content: metadata.openGraph.title,
        },
        metadata.openGraph?.description && {
          property: 'og:description',
          content: metadata.openGraph.description,
        },
      ].filter(Boolean),
    }
  },
}

/**
 * Export Next.js compatibility utilities
 */
export const nextjs = {
  version: NextJS,
  router: routerCompat,
  dynamic: dynamicCompat,
  headers: headersCompat,
  cookies: cookiesCompat,
  metadata: metadataCompat,
}