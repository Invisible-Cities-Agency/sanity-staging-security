import { vi } from 'vitest'

// Mock Sanity modules
vi.mock('sanity', () => ({
  definePlugin: vi.fn((config) => config),
  defineType: vi.fn((config) => config),
  defineField: vi.fn((config) => config),
  useCurrentUser: vi.fn(() => null),
}))

vi.mock('@sanity/ui', () => ({
  useToast: vi.fn(() => ({ push: vi.fn() })),
  Card: 'div',
  Stack: 'div',
  Text: 'span',
  Code: 'code',
  Badge: 'span',
  Grid: 'div',
  Box: 'div',
  Spinner: 'div',
}))

// Mock @vercel/edge-config
vi.mock('@vercel/edge-config', () => ({
  default: {
    get: vi.fn(async (key: string) => {
      const mockValues: Record<string, any> = {
        stagingUrl: 'https://staging.example.com',
        allowedOrigins: ['https://staging.example.com'],
        rateLimitMs: 60000,
        feature_autoValidation: true,
        feature_debugMode: false,
        feature_enablePostMessage: true,
        feature_showToasts: true,
      }
      return mockValues[key]
    }),
    getAll: vi.fn(async () => ({
      stagingUrl: 'https://staging.example.com',
      allowedOrigins: ['https://staging.example.com'],
      rateLimitMs: 60000,
      feature_autoValidation: true,
      feature_debugMode: false,
      feature_enablePostMessage: true,
      feature_showToasts: true,
    })),
    has: vi.fn(async (key: string) => {
      const mockKeys = [
        'stagingUrl',
        'allowedOrigins', 
        'rateLimitMs',
        'feature_autoValidation',
        'feature_debugMode',
        'feature_enablePostMessage',
        'feature_showToasts',
      ]
      return mockKeys.includes(key)
    })
  },
  get: vi.fn(),
  getAll: vi.fn(),
  has: vi.fn()
}))

// Mock environment
process.env.NODE_ENV = 'development' // Changed from 'test' to satisfy schema validation