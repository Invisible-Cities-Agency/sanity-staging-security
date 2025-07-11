/**
 * @fileoverview Throttle utility for rate limiting function calls
 * @module staging-auth-bridge/utils/throttle
 */

/**
 * Generic function type with proper constraints
 */
type AnyFunction = (...args: any[]) => any
type AsyncFunction<T = any> = (...args: any[]) => Promise<T>

/**
 * Creates a throttled version of a function that limits how often it can be called
 * 
 * @param func - The function to throttle
 * @param delay - The minimum time between calls in milliseconds
 * @returns A throttled version of the function
 * 
 * @example
 * ```ts
 * const throttledValidate = throttle(validateSession, 2000)
 * // Multiple calls within 2 seconds will only execute once
 * throttledValidate() // Executes immediately
 * throttledValidate() // Ignored
 * throttledValidate() // Ignored
 * ```
 */
export function throttle<TFunc extends AnyFunction>(
  func: TFunc,
  delay: number
): (...args: Parameters<TFunc>) => ReturnType<TFunc> | undefined {
  let lastCall = 0
  let timeout: NodeJS.Timeout | null = null
  let lastArgs: Parameters<TFunc> | null = null
  let lastThis: ThisParameterType<TFunc> | null = null

  return function throttled(
    this: ThisParameterType<TFunc>,
    ...args: Parameters<TFunc>
  ): ReturnType<TFunc> | undefined {
    const now = Date.now()
    const timeSinceLastCall = now - lastCall

    // Store context and args for potential delayed call
    lastArgs = args
    lastThis = this

    // If enough time has passed, execute immediately
    if (timeSinceLastCall >= delay) {
      lastCall = now
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      return func.apply(this, args)
    }

    // Otherwise, schedule for later if not already scheduled
    if (!timeout) {
      const remainingTime = delay - timeSinceLastCall
      timeout = setTimeout(() => {
        lastCall = Date.now()
        timeout = null
        if (lastArgs && lastThis !== null) {
          func.apply(lastThis, lastArgs)
        }
      }, remainingTime)
    }

    return undefined
  }
}

/**
 * Creates a throttled async function that returns the same promise for calls within the delay window
 * 
 * @param func - The async function to throttle
 * @param delay - The minimum time between calls in milliseconds
 * @returns A throttled version of the async function
 * 
 * @example
 * ```ts
 * const throttledFetch = throttleAsync(fetchData, 1000)
 * const promise1 = throttledFetch() // Starts new request
 * const promise2 = throttledFetch() // Returns same promise as promise1
 * ```
 */
export function throttleAsync<TFunc extends AsyncFunction>(
  func: TFunc,
  delay: number
): (...args: Parameters<TFunc>) => Promise<Awaited<ReturnType<TFunc>>> {
  let lastCall = 0
  let currentPromise: Promise<Awaited<ReturnType<TFunc>>> | null = null

  return async function throttledAsync(
    this: ThisParameterType<TFunc>,
    ...args: Parameters<TFunc>
  ): Promise<Awaited<ReturnType<TFunc>>> {
    const now = Date.now()
    const timeSinceLastCall = now - lastCall

    // If we have a pending promise and within throttle window, return it
    if (currentPromise && timeSinceLastCall < delay) {
      return currentPromise
    }

    // Otherwise, create new promise
    lastCall = now
    currentPromise = func.apply(this, args) as Promise<Awaited<ReturnType<TFunc>>>
    
    // Clear the promise reference after it resolves
    const promiseRef = currentPromise
    promiseRef.finally(() => {
      // Only clear if this is still the current promise
      if (currentPromise === promiseRef) {
        setTimeout(() => {
          currentPromise = null
        }, delay)
      }
    })

    return currentPromise
  }
}

/**
 * Type-safe throttle overloads for common use cases
 */
export interface ThrottleOptions {
  leading?: boolean  // Execute on leading edge (default: true)
  trailing?: boolean // Execute on trailing edge (default: true)
}

/**
 * Advanced throttle with more control over execution timing
 */
export function throttleAdvanced<TFunc extends AnyFunction>(
  func: TFunc,
  delay: number,
  options: ThrottleOptions = {}
): (...args: Parameters<TFunc>) => ReturnType<TFunc> | undefined {
  const { leading = true, trailing = true } = options
  
  let lastCall = 0
  let timeout: NodeJS.Timeout | null = null
  let lastArgs: Parameters<TFunc> | null = null
  let lastThis: ThisParameterType<TFunc> | null = null
  let lastResult: ReturnType<TFunc> | undefined

  return function throttled(
    this: ThisParameterType<TFunc>,
    ...args: Parameters<TFunc>
  ): ReturnType<TFunc> | undefined {
    const now = Date.now()
    const timeSinceLastCall = now - lastCall

    // Store context and args
    lastArgs = args
    lastThis = this

    // Leading edge execution
    if (timeSinceLastCall >= delay && leading) {
      lastCall = now
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      lastResult = func.apply(this, args)
      return lastResult
    }

    // Schedule trailing edge execution
    if (!timeout && trailing) {
      const remainingTime = delay - timeSinceLastCall
      timeout = setTimeout(() => {
        lastCall = Date.now()
        timeout = null
        if (lastArgs && lastThis !== null) {
          lastResult = func.apply(lastThis, lastArgs)
        }
      }, remainingTime)
    }

    return lastResult
  }
}