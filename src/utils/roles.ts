/**
 * @fileoverview Role management utilities
 * @module staging-auth-bridge/utils/roles
 * 
 * Centralizes all role-related logic including normalization,
 * priority handling, and extraction from user objects.
 */

import type { SanityUser } from '../types'

/**
 * Role name mappings for normalization
 * Maps various role name formats to canonical names
 */
const roleNameMappings: Record<string, string> = {
  'admin': 'administrator',
  'Admin': 'administrator',
  'ADMIN': 'administrator',
  'administrator': 'administrator',
  'Administrator': 'administrator',
  'ADMINISTRATOR': 'administrator',
  'dev': 'developer',
  'Dev': 'developer',
  'DEV': 'developer',
  'developer': 'developer',
  'Developer': 'developer',
  'DEVELOPER': 'developer',
  'editor': 'editor',
  'Editor': 'editor',
  'EDITOR': 'editor',
  'contrib': 'contributor',
  'Contrib': 'contributor',
  'CONTRIB': 'contributor',
  'contributor': 'contributor',
  'Contributor': 'contributor',
  'CONTRIBUTOR': 'contributor',
  'viewer': 'viewer',
  'Viewer': 'viewer',
  'VIEWER': 'viewer',
}

/**
 * Role priority order (highest to lowest)
 * Used for determining the most privileged role
 */
const rolePriority: string[] = [
  'administrator',
  'developer', 
  'editor',
  'contributor',
  'viewer'
]

/**
 * Role utilities for managing user roles
 */
export const RoleUtils = {
  /**
   * Normalize a role name to its canonical form
   * 
   * @param role - Role name to normalize
   * @returns Normalized role name
   * 
   * @example
   * ```ts
   * RoleUtils.normalize('admin') // 'administrator'
   * RoleUtils.normalize('Editor') // 'editor'
   * ```
   */
  normalize(role: string): string {
    return roleNameMappings[role] || role.toLowerCase()
  },
  
  /**
   * Get the highest priority role from a list
   * 
   * @param roles - List of role names (will be normalized)
   * @returns Highest priority role or undefined if no valid roles
   * 
   * @example
   * ```ts
   * RoleUtils.getHighestPriority(['editor', 'admin']) // 'administrator'
   * ```
   */
  getHighestPriority(roles: string[]): string | undefined {
    const normalizedRoles = roles.map(role => RoleUtils.normalize(role))
    
    for (const priorityRole of rolePriority) {
      if (normalizedRoles.includes(priorityRole)) {
        return priorityRole
      }
    }
    
    return normalizedRoles[0] // Return first role if none match priority list
  },
  
  /**
   * Extract roles from a Sanity user object
   * 
   * Handles various formats of role data including:
   * - Array of role objects with name property
   * - Array of role strings
   * - Comma-separated string (legacy format)
   * 
   * @param user - Sanity user object
   * @returns Array of normalized role names
   */
  extractFromUser(user: SanityUser): string[] {
    if (!user?.roles) return []
    
    
    // Handle if roles is mistakenly a comma-separated string
    if (typeof user.roles === 'string') {
      const roles = user.roles.split(',').map(r => r.trim())
      return roles.map(role => RoleUtils.normalize(role))
    }
    
    // Handle array of roles
    const extractedRoles: string[] = user.roles
      .map(role => {
        if (typeof role === 'string') {
          return role
        } else if (role && typeof role === 'object' && 'name' in role) {
          return role.name
        }
        return null
      })
      .filter((role): role is string => role !== null && role !== '')
      .map(role => RoleUtils.normalize(role))
    
    // Remove duplicates after normalization
    const uniqueRoles = [...new Set(extractedRoles)]
    
    
    return uniqueRoles
  },
  
  /**
   * Check if a user/roles array has a specific role
   * 
   * @param userOrRoles - Sanity user object or array of role strings
   * @param role - Role to check for (will be normalized)
   * @returns True if user has the role
   */
  hasRole(userOrRoles: SanityUser | string[], role: string): boolean {
    const userRoles = Array.isArray(userOrRoles) 
      ? userOrRoles.map(r => RoleUtils.normalize(r))
      : RoleUtils.extractFromUser(userOrRoles)
    const normalizedRole = RoleUtils.normalize(role)
    return userRoles.includes(normalizedRole)
  },
  
  /**
   * Check if a user/roles array has any of the specified roles
   * 
   * @param userOrRoles - Sanity user object or array of role strings
   * @param roles - Roles to check for (will be normalized)
   * @returns True if user has any of the roles
   */
  hasAnyRole(userOrRoles: SanityUser | string[], roles: string[]): boolean {
    const userRoles = Array.isArray(userOrRoles) 
      ? userOrRoles.map(r => RoleUtils.normalize(r))
      : RoleUtils.extractFromUser(userOrRoles)
    const normalizedRoles = roles.map(r => RoleUtils.normalize(r))
    return userRoles.some(userRole => normalizedRoles.includes(userRole))
  },
  
  
  /**
   * Get role name mappings (for configuration)
   */
  getMappings(): Readonly<Record<string, string>> {
    return roleNameMappings
  },
  
  /**
   * Get role priority list (for configuration)
   */
  getPriorityList(): ReadonlyArray<string> {
    return rolePriority
  },
} as const