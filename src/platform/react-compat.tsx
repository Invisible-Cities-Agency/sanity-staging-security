/**
 * @fileoverview React 18/19 compatibility wrapper
 * @module staging-auth-bridge/platform/react-compat
 * 
 * This module provides compatibility between React 18 and React 19,
 * handling new features gracefully with fallbacks.
 */

import React, { useState, useCallback } from 'react'
import { Platform } from './index'

/**
 * React version-specific hooks and utilities
 */
export const ReactCompat = {
  /**
   * Use React 18's startTransition if available
   */
  useTransition: (): [boolean, (callback: () => void) => void] => {
    // Always use fallback implementation to avoid conditional hooks
    const [isPending, setIsPending] = useState(false)
    const startTransition = useCallback((callback: () => void) => {
      setIsPending(true)
      // Use setTimeout to defer the update
      setTimeout(() => {
        callback()
        setIsPending(false)
      }, 0)
    }, [])

    return [isPending, startTransition]
  },

  /**
   * Use React 18's useDeferredValue if available
   */
  useDeferredValue: <T,>(value: T): T => {
    // Always use fallback to avoid conditional hooks
    return value
  },

  /**
   * Use React 18's useId if available
   */
  useId: (): string => {
    // Always use fallback implementation to avoid conditional hooks
    const [id] = useState(() => `id-${Math.random().toString(36).substr(2, 9)}`)
    return id
  },

  /**
   * Use React 19's use() hook if available (experimental)
   */
  use: <T,>(promise: Promise<T>): T => {
    // Check if React 19+ and use is available
    if (Platform.react.isV19()) {
      try {
        // @ts-ignore - use may not be in React types
        return React.use(promise)
      } catch {
        // Fallback if not available
      }
    }

    // Fallback - throw to nearest Suspense boundary
    throw promise
  },
}

/**
 * Compatibility wrapper for components that use new React features
 */
export function withReactCompat<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function CompatWrapper(props: P) {
    // Add any necessary compatibility shims here
    return <Component {...props} />
  }
}

/**
 * Error boundary with React 18/19 compatibility
 */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class CompatErrorBoundary extends React.Component<
  {
    children: React.ReactNode
    fallback?: (error: Error) => React.ReactElement
  },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[StagingAuthBridge] Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error)
      }
      
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h2>Something went wrong</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error.toString()}
          </details>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Suspense wrapper with fallback for older React versions
 */
export function CompatSuspense({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback: React.ReactElement 
}) {
  // Use React.Suspense if available (React 16.6+)
  if (React.Suspense) {
    return <React.Suspense fallback={fallback}>{children}</React.Suspense>
  }

  // Fallback - just render children without suspense
  return <>{children}</>
}

/**
 * Lazy loading with compatibility
 */
export function compatLazy<T extends React.ComponentType<any>>(
  loader: () => Promise<{ default: T }>
): T {
  // Use React.lazy if available
  if (React.lazy) {
    return React.lazy(loader) as any
  }

  // Fallback - return a component that loads synchronously
  let Component: T | null = null
  let error: Error | null = null

  // Start loading immediately
  loader()
    .then(module => { Component = module.default })
    .catch(err => { error = err })

  return ((props: any) => {
    if (error) throw error
    if (!Component) throw loader() // Trigger suspense
    return <Component {...props} />
  }) as any
}

/**
 * Hook for handling React 18 concurrent features
 */
export function useConcurrentFeatures() {
  const [isPending, startTransition] = ReactCompat.useTransition()
  const id = ReactCompat.useId()

  return {
    isPending,
    startTransition,
    id,
    isReact18: Platform.react.isV18(),
    isReact19: Platform.react.isV19(),
  }
}