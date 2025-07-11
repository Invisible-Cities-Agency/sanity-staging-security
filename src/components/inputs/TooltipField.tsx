/**
 * @fileoverview Tooltip Field Component
 * @module staging-auth-bridge/components/inputs/TooltipField
 * 
 * A wrapper component that adds a tooltip icon with additional help text
 * next to field labels in Sanity Studio forms.
 */

import React from 'react'
import { Box, Flex, Text, Tooltip } from '@sanity/ui'
import { InfoOutlineIcon } from '@sanity/icons'

interface TooltipFieldProps {
  title: string
  description?: string
  helpText: string
  children: React.ReactNode
}

/**
 * TooltipField Component
 * 
 * Wraps a Sanity field with a label that includes a tooltip icon
 * for additional context and help information.
 */
export function TooltipField({ title, description, helpText, children }: TooltipFieldProps) {
  return (
    <Box>
      <Flex align="center" gap={2} marginBottom={2}>
        <Text size={1} weight="semibold">
          {title}
        </Text>
        <Tooltip
          content={
            <Box padding={2} style={{ maxWidth: 300 }}>
              <Text size={1}>{helpText}</Text>
            </Box>
          }
          placement="top"
          portal
        >
          <Text size={1} muted>
            <InfoOutlineIcon />
          </Text>
        </Tooltip>
      </Flex>
      {description && (
        <Box marginBottom={3}>
          <Text size={1} muted>
            {description}
          </Text>
        </Box>
      )}
      {children}
    </Box>
  )
}