import { describe, it, expect } from 'vitest'
import { RoleUtils } from '../../src/utils/roles'

describe('RoleUtils', () => {
  describe('normalize', () => {
    it('should normalize common role variations', () => {
      expect(RoleUtils.normalize('admin')).toBe('administrator')
      expect(RoleUtils.normalize('Admin')).toBe('administrator')
      expect(RoleUtils.normalize('ADMIN')).toBe('administrator')
      expect(RoleUtils.normalize('administrator')).toBe('administrator')
    })

    it('should normalize developer role variations', () => {
      expect(RoleUtils.normalize('dev')).toBe('developer')
      expect(RoleUtils.normalize('Dev')).toBe('developer')
      expect(RoleUtils.normalize('developer')).toBe('developer')
    })

    it('should normalize contributor role variations', () => {
      expect(RoleUtils.normalize('contrib')).toBe('contributor')
      expect(RoleUtils.normalize('contributor')).toBe('contributor')
    })

    it('should lowercase unknown roles', () => {
      expect(RoleUtils.normalize('CustomRole')).toBe('customrole')
      expect(RoleUtils.normalize('UNKNOWN')).toBe('unknown')
    })

    it('should handle empty and invalid inputs', () => {
      expect(RoleUtils.normalize('')).toBe('')
      expect(RoleUtils.normalize('   ')).toBe('   ')
    })
  })

  describe('getHighestPriority', () => {
    it('should return administrator as highest priority', () => {
      expect(RoleUtils.getHighestPriority(['viewer', 'administrator', 'editor'])).toBe('administrator')
      expect(RoleUtils.getHighestPriority(['admin', 'viewer'])).toBe('administrator')
    })

    it('should return developer when no administrator', () => {
      expect(RoleUtils.getHighestPriority(['viewer', 'developer', 'editor'])).toBe('developer')
      expect(RoleUtils.getHighestPriority(['dev', 'contributor'])).toBe('developer')
    })

    it('should return editor when no admin or developer', () => {
      expect(RoleUtils.getHighestPriority(['viewer', 'editor', 'contributor'])).toBe('editor')
    })

    it('should handle empty array', () => {
      expect(RoleUtils.getHighestPriority([])).toBeUndefined()
    })

    it('should handle unknown roles', () => {
      expect(RoleUtils.getHighestPriority(['unknown', 'custom'])).toBe('unknown')
    })

    it('should normalize before comparing', () => {
      expect(RoleUtils.getHighestPriority(['admin', 'editor'])).toBe('administrator')
    })
  })

  describe('extractFromUser', () => {
    it('should extract roles from array of strings', () => {
      const user = {
        id: '123',
        roles: ['admin', 'editor']
      }
      expect(RoleUtils.extractFromUser(user)).toEqual(['administrator', 'editor'])
    })

    it('should extract roles from array of objects', () => {
      const user = {
        id: '123',
        roles: [
          { name: 'admin', title: 'Administrator' },
          { name: 'editor', title: 'Editor' }
        ]
      }
      expect(RoleUtils.extractFromUser(user)).toEqual(['administrator', 'editor'])
    })

    it('should handle comma-separated string roles', () => {
      const user = {
        id: '123',
        roles: 'admin, editor, viewer' as any
      }
      expect(RoleUtils.extractFromUser(user)).toEqual(['administrator', 'editor', 'viewer'])
    })

    it('should handle comma-separated string with extra spaces', () => {
      const user = {
        id: '123',
        roles: '  admin ,  editor  , viewer  ' as any
      }
      expect(RoleUtils.extractFromUser(user)).toEqual(['administrator', 'editor', 'viewer'])
    })

    it('should handle mixed array of strings and objects', () => {
      const user = {
        id: '123',
        roles: [
          'admin',
          { name: 'editor', title: 'Editor' },
          null,
          { name: 'viewer' },
          undefined
        ] as any
      }
      expect(RoleUtils.extractFromUser(user)).toEqual(['administrator', 'editor', 'viewer'])
    })

    it('should handle user with no roles', () => {
      const user = { id: '123' }
      expect(RoleUtils.extractFromUser(user as any)).toEqual([])
    })

    it('should handle user with null roles', () => {
      const user = { id: '123', roles: null }
      expect(RoleUtils.extractFromUser(user as any)).toEqual([])
    })

    it('should handle user with undefined roles', () => {
      const user = { id: '123', roles: undefined }
      expect(RoleUtils.extractFromUser(user as any)).toEqual([])
    })

    it('should handle empty roles array', () => {
      const user = { id: '123', roles: [] }
      expect(RoleUtils.extractFromUser(user)).toEqual([])
    })

    it('should filter out invalid role objects', () => {
      const user = {
        id: '123',
        roles: [
          { name: 'admin' },
          { title: 'Editor' }, // No name
          {}, // Empty object
          { name: '' }, // Empty name
          { name: null } // Null name
        ] as any
      }
      expect(RoleUtils.extractFromUser(user)).toEqual(['administrator'])
    })
  })

  describe('hasRole', () => {
    it('should check if user has specific role', () => {
      expect(RoleUtils.hasRole(['administrator', 'editor'], 'administrator')).toBe(true)
      expect(RoleUtils.hasRole(['administrator', 'editor'], 'viewer')).toBe(false)
    })

    it('should normalize role before checking', () => {
      expect(RoleUtils.hasRole(['administrator', 'editor'], 'admin')).toBe(true)
      expect(RoleUtils.hasRole(['developer'], 'dev')).toBe(true)
    })

    it('should handle empty arrays', () => {
      expect(RoleUtils.hasRole([], 'admin')).toBe(false)
    })
  })

  describe('hasAnyRole', () => {
    it('should check if user has any of the specified roles', () => {
      const userRoles = ['editor', 'viewer']
      expect(RoleUtils.hasAnyRole(userRoles, ['administrator', 'editor'])).toBe(true)
      expect(RoleUtils.hasAnyRole(userRoles, ['administrator', 'developer'])).toBe(false)
    })

    it('should normalize roles before checking', () => {
      const userRoles = ['administrator']
      expect(RoleUtils.hasAnyRole(userRoles, ['admin', 'editor'])).toBe(true)
    })

    it('should handle empty arrays', () => {
      expect(RoleUtils.hasAnyRole([], ['admin'])).toBe(false)
      expect(RoleUtils.hasAnyRole(['admin'], [])).toBe(false)
      expect(RoleUtils.hasAnyRole([], [])).toBe(false)
    })
  })
})