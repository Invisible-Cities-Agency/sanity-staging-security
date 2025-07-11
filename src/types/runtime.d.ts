/**
 * Type declarations for runtime globals
 */

// EdgeRuntime global (Vercel Edge Runtime)
declare const EdgeRuntime: string | undefined

// Next.js specific window properties
interface Window {
  __NEXT_DATA__?: {
    buildId: string
    page: string
    query: Record<string, string | string[]>
    assetPrefix?: string
    runtimeConfig?: Record<string, unknown>
    gssp?: boolean
    gip?: boolean
    locale?: string
    locales?: string[]
    defaultLocale?: string
    domainLocales?: Array<{
      domain: string
      defaultLocale: string
      locales?: string[]
    }>
    scriptLoader?: Array<{
      src: string
      strategy?: string
    }>
    isPreview?: boolean
    autoExport?: boolean
    dynamicIds?: string[]
    err?: {
      name?: string
      message?: string
      stack?: string
    }
  }
}