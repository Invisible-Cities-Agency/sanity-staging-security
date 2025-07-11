/**
 * Type declarations for @vercel/edge-config
 * This is an optional dependency that may not be installed
 */
declare module '@vercel/edge-config' {
  export interface EdgeConfigClient {
    get<T = unknown>(key: string): Promise<T | undefined>
    getAll<T = Record<string, unknown>>(): Promise<T>
  }
  
  export function createClient(options: { connectionString: string }): EdgeConfigClient
  
  export const get: <T = unknown>(key: string) => Promise<T | undefined>
  export const getAll: <T = Record<string, unknown>>() => Promise<T>
}