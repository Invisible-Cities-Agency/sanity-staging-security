import React from 'react'
import { Card, Stack, Text, Inline } from '@sanity/ui'
import { InfoOutlineIcon } from '@sanity/icons'
import { StringInputProps } from 'sanity'

export function LoggingInfoInput(props: StringInputProps) {
  // Get the field name to determine which message to show
  const fieldName = props.schemaType.name
  
  if (fieldName === 'envInfo') {
    return (
      <Card padding={3} radius={2} tone="primary">
        <Stack space={2}>
          <Inline space={2}>
            <InfoOutlineIcon />
            <Text size={1} weight="medium">Environment Variables Required</Text>
          </Inline>
          <Text size={1} muted>
            Set these in your deployment environment:
            <br />• SANITY_STUDIO_LOGFLARE_API_KEY
            <br />• SANITY_STUDIO_LOGFLARE_SOURCE_ID
          </Text>
        </Stack>
      </Card>
    )
  }
  
  if (fieldName === 'info') {
    return (
      <Card padding={3} radius={2} tone="primary">
        <Stack space={2}>
          <Inline space={2}>
            <InfoOutlineIcon />
            <Text size={1} weight="medium">Automatic Configuration</Text>
          </Inline>
          <Text size={1} muted>
            Edge Console automatically detects your Vercel deployment environment. No additional configuration needed.
          </Text>
        </Stack>
      </Card>
    )
  }
  
  return null
}