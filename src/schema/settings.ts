/**
 * @fileoverview Staging Auth Bridge Settings Schema
 * @module staging-auth-bridge/schema/settings
 * 
 * This module defines the settings schema for the staging auth bridge plugin
 * that integrates with Sanity's settings system.
 */

import { defineType, defineField } from 'sanity'
import { LockIcon } from '@sanity/icons'
import { StatusInput } from '../components/inputs/StatusInput'
import { LoggingInfoInput } from '../components/inputs/LoggingInfoInput'

/**
 * Staging Auth Bridge settings schema
 * 
 * This schema can be:
 * 1. Added to the main settings menu (default)
 * 2. Displayed as a standalone document
 * 3. Hidden entirely if using environment variables only
 */
export const stagingAuthSettings = defineType({
  name: 'stagingAuthSettings',
  title: 'Staging Access Settings',
  type: 'document',
  icon: LockIcon,
  fields: [
    // Document Title Field (hidden, provides default title)
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      hidden: true,
      initialValue: 'Staging Access Settings',
    }),
    // Status Section
    defineField({
      name: 'statusInfo',
      title: 'Access Status',
      type: 'object',
      components: {
        input: StatusInput,
      },
      fields: [
        defineField({
          name: 'placeholder',
          type: 'string',
          hidden: true,
        }),
      ],
    }),

    // Role Configuration
    defineField({
      name: 'roleAccess',
      title: 'Role-Based Staging Access',
      type: 'array',
      description: 'Control which Sanity Studio roles automatically receive access to view the staging website. Users with these roles will be granted a secure authentication token when they log into Sanity Studio.',
      initialValue: [
        { role: 'administrator', hasAccess: true, description: 'Full access to all content and settings' },
        { role: 'editor', hasAccess: true, description: 'Can create, edit, and publish content (Growth plans and above)' },
        { role: 'viewer', hasAccess: false, description: 'Read-only access to content' },
      ],
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'role',
              title: 'Role',
              type: 'string',
              validation: (Rule) => Rule.required(),
              options: {
                list: [
                  { title: 'Administrator', value: 'administrator' },
                  { title: 'Editor', value: 'editor' },
                  { title: 'Viewer', value: 'viewer' },
                  { title: 'Developer', value: 'developer' },
                ],
              },
            }),
            defineField({
              name: 'hasAccess',
              title: 'Has Staging Access',
              type: 'boolean',
              initialValue: false,
            }),
            defineField({
              name: 'description',
              title: 'Role Description',
              type: 'string',
              description: 'Brief description of what this role can do in Sanity Studio',
              placeholder: 'e.g., Can edit and publish all content types',
            }),
          ],
          preview: {
            select: {
              title: 'role',
              hasAccess: 'hasAccess',
            },
            prepare({ title, hasAccess }) {
              return {
                title: title || 'Unknown Role',
                subtitle: hasAccess ? '✓ Has staging access' : '○ No staging access',
              }
            },
          },
        },
      ],
    }),

    // Advanced Configuration
    defineField({
      name: 'advanced',
      title: 'Advanced Configuration',
      type: 'object',
      description: 'Override default settings and environment variables. Most installations should not need to modify these.',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        defineField({
          name: 'stagingUrl',
          title: 'Staging URL',
          type: 'url',
          description: 'The full URL of your staging website (e.g., https://staging.example.com). Leave empty to use the SANITY_STUDIO_STAGING_URL environment variable.',
          hidden: ({ document }: any) => !document?.advanced?.enableOverrides,
        }),
        defineField({
          name: 'cookieName',
          title: 'Authentication Cookie Name',
          type: 'string',
          description: 'The name of the cookie used to store authentication tokens. Default is "staging-auth". Only change this if you have a specific reason to avoid cookie conflicts.',
          hidden: ({ document }: any) => !document?.advanced?.enableOverrides,
        }),
        defineField({
          name: 'tokenValidityDays',
          title: 'Token Validity Period',
          type: 'number',
          description: 'Number of days before authentication tokens expire and users need to re-authenticate. Default is 7 days. Shorter periods are more secure but less convenient.',
          validation: (Rule) => Rule.min(1).max(365),
          hidden: ({ document }: any) => !document?.advanced?.enableOverrides,
        }),
        defineField({
          name: 'enableOverrides',
          title: 'Enable Configuration Overrides',
          type: 'boolean',
          description: 'When enabled, the settings above will override any environment variables. When disabled, environment variables take precedence. Enable this to manage configuration through the Studio interface.',
          initialValue: false,
        }),
      ],
    }),

    // Feature Flags
    defineField({
      name: 'features',
      title: 'Features & Behavior',
      type: 'object',
      description: 'Control how the staging authentication bridge behaves.',
      options: {
        collapsible: true,
        collapsed: false,
      },
      fields: [
        defineField({
          name: 'autoValidation',
          title: 'Automatic Session Validation',
          type: 'boolean',
          description: 'Automatically grant staging access when users log into Sanity Studio. When disabled, users must manually request access.',
          initialValue: true,
        }),
        defineField({
          name: 'showToasts',
          title: 'Show Status Notifications',
          type: 'boolean',
          description: 'Display toast notifications when staging access is granted or when authentication errors occur.',
          initialValue: true,
        }),
        defineField({
          name: 'enablePostMessage',
          title: 'Enable Preview iframe Communication',
          type: 'boolean',
          description: 'Allow the staging site to communicate with Sanity Studio when embedded in preview panels. Required for live preview functionality.',
          initialValue: true,
        }),
        defineField({
          name: 'debugMode',
          title: 'Debug Mode',
          type: 'boolean',
          description: 'Enable verbose console logging for troubleshooting authentication issues. Should be disabled in production.',
          initialValue: false,
        }),
      ],
    }),

    // Logging Configuration
    defineField({
      name: 'logging',
      title: 'Logging',
      type: 'object',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        defineField({
          name: 'provider',
          title: 'Logging Provider',
          type: 'string',
          description: 'Choose where authentication events and errors are logged',
          options: {
            list: [
              { title: 'Console (Development)', value: 'console' },
              { title: 'Logflare', value: 'logflare' },
              { title: 'Edge Console (Vercel)', value: 'edge-console' },
            ],
          },
          initialValue: 'console',
        }),
        
        // Logflare Configuration
        defineField({
          name: 'logflareConfig',
          title: 'Logflare Configuration',
          type: 'object',
          hidden: ({ parent }) => parent?.provider !== 'logflare',
          fields: [
            defineField({
              name: 'useEnv',
              title: 'Configuration Method',
              type: 'string',
              options: {
                list: [
                  { title: 'Use environment variables (recommended)', value: 'env' },
                  { title: 'Enter API credentials here', value: 'manual' },
                ],
                layout: 'radio',
              },
              initialValue: 'env',
            }),
            defineField({
              name: 'envInfo',
              title: ' ',
              type: 'string',
              readOnly: true,
              components: {
                input: LoggingInfoInput,
              },
              hidden: ({ parent }) => parent?.useEnv !== 'env',
            }),
            defineField({
              name: 'apiKey',
              title: 'API Key',
              type: 'string',
              description: 'Your Logflare API key',
              hidden: ({ parent }) => parent?.useEnv !== 'manual',
              validation: (Rule) => Rule.custom((value, context) => {
                const parent = context.parent as any
                if (parent?.useEnv === 'manual' && !value) {
                  return 'API key is required when entering credentials manually'
                }
                return true
              }),
            }),
            defineField({
              name: 'sourceId',
              title: 'Source ID',
              type: 'string',
              description: 'Your Logflare source UUID',
              hidden: ({ parent }) => parent?.useEnv !== 'manual',
              validation: (Rule) => Rule.custom((value, context) => {
                const parent = context.parent as any
                if (parent?.useEnv === 'manual' && !value) {
                  return 'Source ID is required when entering credentials manually'
                }
                return true
              }),
            }),
          ],
        }),
        
        // Edge Console Configuration
        defineField({
          name: 'edgeConsoleConfig',
          title: 'Edge Console Configuration',
          type: 'object',
          hidden: ({ parent }) => parent?.provider !== 'edge-console',
          fields: [
            defineField({
              name: 'info',
              title: ' ',
              type: 'string',
              readOnly: true,
              components: {
                input: LoggingInfoInput,
              },
            }),
          ],
        }),
        
        defineField({
          name: 'level',
          title: 'Log Level',
          type: 'string',
          description: 'Minimum severity level for log messages',
          options: {
            list: [
              { title: 'Debug (Most Verbose)', value: 'debug' },
              { title: 'Info (Default)', value: 'info' },
              { title: 'Warning', value: 'warn' },
              { title: 'Error (Least Verbose)', value: 'error' },
            ],
          },
          initialValue: 'info',
        }),
      ],
    }),
  ],

  // Singleton document - only one instance
  __experimental_formPreviewTitle: false,
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title || 'Staging Access Settings',
      }
    },
  },
})

/**
 * Helper to check if settings should be shown in main menu
 */
export function shouldShowInSettings(pluginOptions?: { hideFromSettings?: boolean }): boolean {
  return !pluginOptions?.hideFromSettings
}

/**
 * Create the settings list item for the structure builder
 */
export function createSettingsListItem(S: any, pluginOptions?: { hideFromSettings?: boolean }) {
  if (!shouldShowInSettings(pluginOptions)) {
    return null
  }

  return S.listItem()
    .title('Staging Access')
    .icon(LockIcon)
    .child(
      S.document()
        .schemaType('stagingAuthSettings')
        .documentId('stagingAuthSettings')
        .title('Staging Access Settings')
    )
}

/**
 * Settings type for use in other parts of the plugin
 */
export type StagingAuthSettingsDocument = {
  _id: 'stagingAuthSettings'
  _type: 'stagingAuthSettings'
  roleAccess?: Array<{
    role: string
    hasAccess: boolean
    description?: string
  }>
  advanced?: {
    enableOverrides?: boolean
    stagingUrl?: string
    cookieName?: string
    tokenValidityDays?: number
  }
  features?: {
    autoValidation?: boolean
    showToasts?: boolean
    enablePostMessage?: boolean
    debugMode?: boolean
  }
  logging?: {
    provider?: string
    level?: 'debug' | 'info' | 'warn' | 'error'
  }
}