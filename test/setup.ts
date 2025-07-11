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

// Mock environment
process.env.NODE_ENV = 'test'