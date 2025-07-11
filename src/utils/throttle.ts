/**
 * @fileoverview Throttle utility for rate limiting function calls
 * @module staging-auth-bridge/utils/throttle
 */

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
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let lastCall = 0
  let timeout: NodeJS.Timeout | null = null
  let lastArgs: Parameters<T> | null = null
  let lastThis: any = null

  return function throttled(this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
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
        if (lastArgs) {
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
export function throttleAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let lastCall = 0
  let currentPromise: Promise<ReturnType<T>> | null = null

  return async function throttledAsync(
    this: any,
    ...args: Parameters<T>
  ): Promise<ReturnType<T>> {
    const now = Date.now()
    const timeSinceLastCall = now - lastCall

    // If we have a pending promise and within throttle window, return it
    if (currentPromise && timeSinceLastCall < delay) {
      return currentPromise
    }

    // Otherwise, create new promise
    lastCall = now
    currentPromise = func.apply(this, args)
    
    // Clear the promise reference after it resolves
    currentPromise.finally(() => {
      // Only clear if this is still the current promise
      if (currentPromise === currentPromise) {
        setTimeout(() => {
          currentPromise = null
        }, delay)
      }
    })

    return currentPromise
  }
}