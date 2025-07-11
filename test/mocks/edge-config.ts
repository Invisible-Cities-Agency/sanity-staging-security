// Mock for @vercel/edge-config
export const get = async (key: string) => {
  // Return mock values for testing
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
}

export const getAll = async () => {
  return {
    stagingUrl: 'https://staging.example.com',
    allowedOrigins: ['https://staging.example.com'],
    rateLimitMs: 60000,
    feature_autoValidation: true,
    feature_debugMode: false,
    feature_enablePostMessage: true,
    feature_showToasts: true,
  }
}

export const has = async (key: string) => {
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
}

export default { get, getAll, has }