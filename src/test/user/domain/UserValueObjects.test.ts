import { describe, expect, it } from 'bun:test';
import {
  ROLE_HIERARCHY,
  canManageRole,
  hasHigherOrEqualRole,
  type UserRole,
} from '../../../domain/user/UserValueObjects';

describe('ROLE_HIERARCHY', () => {
  it('superadmin tiene el nivel más alto', () => {
    expect(ROLE_HIERARCHY.superadmin).toBeGreaterThan(ROLE_HIERARCHY.admin);
    expect(ROLE_HIERARCHY.superadmin).toBeGreaterThan(ROLE_HIERARCHY.user);
  });

  it('admin tiene nivel mayor que user', () => {
    expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.user);
  });
});

describe('canManageRole', () => {
  const cases: [UserRole, UserRole, boolean][] = [
    ['superadmin', 'admin', true],
    ['superadmin', 'user', true],
    ['admin', 'user', true],
    ['admin', 'admin', false], // mismo nivel — no puede
    ['admin', 'superadmin', false],
    ['user', 'user', false],
    ['user', 'admin', false],
    ['user', 'superadmin', false],
  ];

  for (const [actor, target, expected] of cases) {
    it(`${actor} ${expected ? 'puede' : 'no puede'} gestionar ${target}`, () => {
      expect(canManageRole(actor, target)).toBe(expected);
    });
  }
});

describe('hasHigherOrEqualRole', () => {
  const cases: [UserRole, UserRole, boolean][] = [
    ['superadmin', 'superadmin', true],
    ['superadmin', 'admin', true],
    ['admin', 'admin', true],
    ['admin', 'user', true],
    ['user', 'user', true],
    ['user', 'admin', false],
    ['user', 'superadmin', false],
    ['admin', 'superadmin', false],
  ];

  for (const [actor, target, expected] of cases) {
    it(`${actor} ${expected ? 'tiene' : 'no tiene'} rol >= ${target}`, () => {
      expect(hasHigherOrEqualRole(actor, target)).toBe(expected);
    });
  }
});
