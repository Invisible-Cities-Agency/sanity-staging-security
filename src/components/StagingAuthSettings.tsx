/**
 * @fileoverview Staging Auth Settings Component
 * @module staging-auth-bridge/components/StagingAuthSettings
 * 
 * This component provides a UI for managing staging auth bridge settings
 * within the Sanity Studio settings panel.
 */

import React from 'react'
import { Card, Stack, Text, Code, Badge, Grid, Box } from '@sanity/ui'
import { getConfig } from '../config'

/**
 * Staging Auth Settings Component
 * 
 * Displays current configuration and status for the staging auth bridge.
 * This component is designed to be used in the Studio settings panel.
 * 
 * @returns Settings UI component
 */
export function StagingAuthSettings() {
  const config = getConfig()
  const hasLogflare = !!process.env.SANITY_STUDIO_LOGFLARE_API_KEY

  return (
    <Stack space={4}>
      <Card padding={4} radius={2} shadow={1}>
        <Stack space={3}>
          <Text size={2} weight="semibold">Staging Auth Bridge Status</Text>
          
          <Grid columns={[1, 2]} gap={3}>
            <Box>
              <Text size={1} muted>Environment</Text>
              <Code size={1}>{process.env.NODE_ENV || 'development'}</Code>
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
          </Grid>
        </Stack>
      </Card>

      <Card padding={4} radius={2} shadow={1}>
        <Stack space={3}>
          <Text size={2} weight="semibold">Features</Text>
          
          <Stack space={2}>
            <FeatureToggle 
              label="Auto Validation" 
              enabled={config.features.autoValidation}
              description="Automatically validate sessions when users log in"
            />
            <FeatureToggle 
              label="PostMessage Support" 
              enabled={config.features.enablePostMessage}
              description="Enable communication with embedded preview iframes"
            />
            <FeatureToggle 
              label="Toast Notifications" 
              enabled={config.features.showToasts}
              description="Show authentication status notifications"
            />
          </Stack>
        </Stack>
      </Card>

      <Card padding={4} radius={2} shadow={1} tone="transparent">
        <Stack space={2}>
          <Text size={1} muted>
            Note: Most settings are configured via environment variables. 
            See the documentation for details.
          </Text>
          <Code size={1}>
            SANITY_STUDIO_STAGING_URL, SANITY_STUDIO_DEBUG, etc.
          </Code>
        </Stack>
      </Card>
    </Stack>
  )
}

/**
 * Feature Toggle Display Component
 * @internal
 */
function FeatureToggle({ 
  label, 
  enabled, 
  description 
}: { 
  label: string
  enabled: boolean
  description: string 
}) {
  return (
    <Box>
      <Stack space={1}>
        <Text size={1}>
          <Badge tone={enabled ? 'positive' : 'default'} size={0} radius={2}>
            {enabled ? '✓' : '○'}
          </Badge>
          {' '}{label}
        </Text>
        <Text size={1} muted style={{ paddingLeft: '1.5rem' }}>
          {description}
        </Text>
      </Stack>
    </Box>
  )
}