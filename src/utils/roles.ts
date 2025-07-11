/**
 * Role management utilities for the Staging Auth Bridge
 */

import type { SanityUser } from '../types'

// Canonical role names and their aliases
const ROLE_ALIASES: Record<string, string[]> = {
  'administrator': ['admin'],
  'developer': ['dev'],
  'editor': [],
  'contributor': ['contrib'],
  'viewer': []
}

// Build reverse mapping for efficient lookups
const roleNameMap = new Map<string, string>()
for (const [canonical, aliases] of Object.entries(ROLE_ALIASES)) {
  roleNameMap.set(canonical.toLowerCase(), canonical)
  for (const alias of aliases) {
    roleNameMap.set(alias.toLowerCase(), canonical)
  }
}

// Role priority order (highest to lowest)
const ROLE_PRIORITY = ['administrator', 'developer', 'editor', 'contributor', 'viewer'] as const

/**
 * Role utilities for managing user roles
 */
export const RoleUtils = {
  /**
   * Normalize a role name to its canonical form
   */
  normalize(role: string): string {
    const normalized = role.toLowerCase()
    return roleNameMap.get(normalized) || normalized
  },
  
  /**
   * Get the highest priority role from a list
   */
  getHighestPriority(roles: string[]): string | undefined {
    const normalizedRoles = new Set(roles.map(role => RoleUtils.normalize(role)))
    
    for (const priorityRole of ROLE_PRIORITY) {
      if (normalizedRoles.has(priorityRole)) {
        return priorityRole
      }
    }
    
    return roles[0] ? RoleUtils.normalize(roles[0]) : undefined
  },
  
  /**
   * Extract roles from a Sanity user object
   * 
   * Handles various formats of role data including:
   * - Simple string array: ['admin', 'editor']
   * - Object array with name property: [{ name: 'admin' }]
   * - Object array with title property: [{ title: 'Administrator' }]
   * - Mixed formats
   */
  extractFromUser(user: SanityUser | null | undefined): string[] {
    if (!user?.roles) return []
    
    // Handle if roles is somehow a comma-separated string (for backwards compatibility)
    if (typeof user.roles === 'string') {
      const roles = user.roles.split(',').map((r: string) => r.trim())
      return roles.map((role: string) => RoleUtils.normalize(role))
    }
    
    // Ensure we have an array
    if (!Array.isArray(user.roles)) {
      return []
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
    return [...new Set(extractedRoles)]
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
  }
}