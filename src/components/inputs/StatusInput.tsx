/**
 * @fileoverview Status Input Component for Settings
 * @module staging-auth-bridge/components/inputs/StatusInput
 * 
 * Custom input component that displays the staging auth status
 * in place of a regular input field.
 */

import React from 'react'
import { ObjectInputProps } from 'sanity'
import { StagingAuthSettingsStatus } from '../StagingAuthSettingsStatus'

/**
 * Status Input Component
 * 
 * Replaces the default object input with a status display component
 * for the statusInfo field in the settings schema.
 */
export function StatusInput(props: ObjectInputProps) {
  // Hide the default input UI and show our custom status component
  return <StagingAuthSettingsStatus />
}