import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
  resolve: {
    alias: {
      '@vercel/edge-config': path.resolve(__dirname, './test/mocks/edge-config.ts')
    }
  }
})