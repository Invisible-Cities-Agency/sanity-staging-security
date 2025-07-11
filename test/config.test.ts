import { describe, it, expect, beforeEach } from 'vitest'
import { getConfig, resetConfig } from '../src/config'

describe('Configuration', () => {
  beforeEach(() => {
    resetConfig()
  })

  it('should return default configuration', () => {
    const config = getConfig()
    
    expect(config.urls.staging).toBe('https://staging.example.com')
    expect(config.security.tokenValidityDays).toBe(7)
    expect(config.features.autoValidation).toBe(true)
  })

  it('should have correct default allowed origins', () => {
    const config = getConfig()
    
    expect(config.security.allowedOrigins).toContain('https://staging.example.com')
    expect(config.security.allowedOrigins).toContain('https://localhost:3000')
  })

  it('should have correct logging defaults', () => {
    const config = getConfig()
    
    expect(config.logging.provider).toBe('console')
    expect(config.logging.level).toBe('info')
    expect(config.logging.flushInterval).toBe(1000)
  })
})