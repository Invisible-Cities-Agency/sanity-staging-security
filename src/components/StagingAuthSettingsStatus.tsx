/**
 * @fileoverview Staging Auth Settings Status Component
 * @module staging-auth-bridge/components/StagingAuthSettingsStatus
 * 
 * This component displays the current status and configuration of the
 * staging auth bridge within the settings document.
 */

import React, { useEffect, useState } from 'react'
import { Card, Stack, Text, Code, Badge, Grid, Box, Spinner } from '@sanity/ui'
import { getConfig } from '../config'
import { Platform } from '../platform'
import { useCurrentUser } from 'sanity'
import { useStudioAuth } from '../hooks/useStudioAuth'

/**
 * Staging Auth Settings Status Component
 * 
 * Displays real-time status information about the staging auth bridge
 * configuration and current user's access status.
 */
export function StagingAuthSettingsStatus() {
  const config = getConfig()
  const currentUser = useCurrentUser()
  const { lastValidation, isValidating, validateSession } = useStudioAuth()
  const [isChecking, setIsChecking] = useState(false)

  // Environment status
  const hasLogflare = !!process.env.SANITY_STUDIO_LOGFLARE_API_KEY
  const environment = process.env.NODE_ENV || 'development'
  const platform = Platform.deployment.isVercel() ? 'Vercel' : 
                  Platform.deployment.isNetlify() ? 'Netlify' : 
                  Platform.deployment.isLocal() ? 'Local' : 'Unknown'

  const handleCheckAccess = async () => {
    setIsChecking(true)
    try {
      await validateSession()
    } catch (error) {
      console.error('Failed to validate session:', error)
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <Stack space={4}>
      {/* Current User Status */}
      <Card padding={4} radius={2} shadow={1}>
        <Stack space={3}>
          <Text size={2} weight="semibold">Your Access Status</Text>
          
          {currentUser ? (
            <Grid columns={[1, 2]} gap={3}>
              <Box>
                <Text size={1} muted>Logged in as</Text>
                <Text size={2}>{currentUser.name || currentUser.email || 'Unknown'}</Text>
              </Box>
              
              <Box>
                <Text size={1} muted>Staging Access</Text>
                {isValidating || isChecking ? (
                  <Spinner />
                ) : lastValidation ? (
                  <Badge 
                    tone={lastValidation.authorized ? 'positive' : 'caution'} 
                    size={1}
                  >
                    {lastValidation.authorized ? `✓ Authorized (${lastValidation.role})` : '○ Not Authorized'}
                  </Badge>
                ) : (
                  <Badge tone="default" size={1} onClick={handleCheckAccess} style={{ cursor: 'pointer' }}>
                    Click to check
                  </Badge>
                )}
              </Box>
            </Grid>
          ) : (
            <Text size={1} muted>Not logged in</Text>
          )}
        </Stack>
      </Card>

      {/* Configuration Status */}
      <Card padding={4} radius={2} shadow={1}>
        <Stack space={3}>
          <Text size={2} weight="semibold">Configuration Status</Text>
          
          <Grid columns={[1, 2, 2]} gap={3}>
            <Box>
              <Text size={1} muted>Environment</Text>
              <Code size={1}>{environment}</Code>
            </Box>
            
            <Box>
              <Text size={1} muted>Platform</Text>
              <Code size={1}>{platform}</Code>
            </Box>
            
            <Box>
              <Text size={1} muted>Staging URL</Text>
              <Code size={1}>{config.urls.staging}</Code>
            </Box>
            
            <Box>
              <Text size={1} muted>Logging Provider</Text>
              <Badge tone={hasLogflare ? 'positive' : 'caution'} size={1}>
                {config.logging.provider}
              </Badge>
            </Box>
            
            <Box>
              <Text size={1} muted>Debug Mode</Text>
              <Badge tone={config.features.debugMode ? 'primary' : 'default'} size={1}>
                {config.features.debugMode ? 'Enabled' : 'Disabled'}
              </Badge>
            </Box>
            
            <Box>
              <Text size={1} muted>Node Version</Text>
              <Code size={1}>{Platform.node.version()}</Code>
            </Box>
          </Grid>
        </Stack>
      </Card>

      {/* Environment Variables */}
      <Card padding={4} radius={2} shadow={1} tone="transparent">
        <Stack space={3}>
          <Text size={2} weight="semibold">Environment Variables</Text>
          
          <Stack space={2}>
            <EnvironmentVar 
              name="SANITY_STUDIO_LOGFLARE_API_KEY" 
              value={process.env.SANITY_STUDIO_LOGFLARE_API_KEY}
              isSecret
            />
            <EnvironmentVar 
              name="SANITY_STUDIO_LOGFLARE_SOURCE_ID" 
              value={process.env.SANITY_STUDIO_LOGFLARE_SOURCE_ID}
            />
            <EnvironmentVar 
              name="SANITY_STUDIO_STAGING_URL" 
              value={process.env.SANITY_STUDIO_STAGING_URL}
            />
            <EnvironmentVar 
              name="SANITY_STUDIO_DEBUG" 
              value={process.env.SANITY_STUDIO_DEBUG}
            />
          </Stack>
          
          <Text size={1} muted style={{ marginTop: 8 }}>
            Environment variables can be set in your .env file or deployment platform.
          </Text>
        </Stack>
      </Card>
    </Stack>
  )
}

/**
 * Environment Variable Display Component
 * @internal
 */
function EnvironmentVar({ 
  name, 
  value,
  isSecret = false 
}: { 
  name: string
  value?: string
  isSecret?: boolean
}) {
  const displayValue = value 
    ? isSecret 
      ? '••••••••' 
      : value.length > 30 
        ? value.substring(0, 30) + '...' 
        : value
    : 'Not set'

  return (
    <Box>
      <Stack space={1}>
        <Code size={1}>{name}</Code>
        <Text size={1} muted style={{ paddingLeft: '1rem' }}>
          {displayValue}
          {value && !isSecret && value.length > 30 && (
            <Text size={1} muted> (truncated)</Text>
          )}
        </Text>
      </Stack>
    </Box>
  )
}