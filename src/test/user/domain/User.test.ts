import { describe, expect, it } from 'bun:test';
import { User } from '../../../domain/user/User';
import {
  makeAdmin,
  makeBannedUser,
  makeInactiveUser,
  makeSuperadmin,
  makeUser,
} from '../../helpers/userFixtures';

describe('User.create', () => {
  it("crea usuario con role 'user' por defecto", () => {
    const user = User.create({
      id: 'u-1',
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashed',
    });
    expect(user.role).toBe('user');
  });

  it("crea usuario con status 'active' siempre", () => {
    const user = User.create({
      id: 'u-1',
      name: 'John',
      email: 'john@example.com',
      passwordHash: 'hashed',
    });
    expect(user.status).toBe('active');
  });

  it('trimea espacios del nombre', () => {
    const user = User.create({
      id: 'u-1',
      name: '  John Doe  ',
      email: 'john@example.com',
      passwordHash: 'hashed',
    });
    expect(user.name).toBe('John Doe');
  });

  it("permite especificar role 'admin' en creación", () => {
    const user = User.create({
      id: 'u-1',
      name: 'Admin',
      email: 'admin@example.com',
      passwordHash: 'hashed',
      role: 'admin',
    });
    expect(user.role).toBe('admin');
  });
});

describe('User.promote', () => {
  it('superadmin promueve user a admin', () => {
    const actor = makeSuperadmin();
    const target = makeUser({ id: 'user-2' });

    const promoted = target.promote(actor);

    expect(promoted.role).toBe('admin');
    expect(promoted.id).toBe(target.id);
  });

  it('updatedAt cambia tras la promoción', () => {
    const actor = makeSuperadmin();
    const target = makeUser({ id: 'user-2' });

    const promoted = target.promote(actor);

    expect(promoted.updatedAt.getTime()).toBeGreaterThanOrEqual(
      target.updatedAt.getTime(),
    );
  });

  it('lanza AppError USER_FORBIDDEN cuando admin intenta promover', () => {
    const actor = makeAdmin();
    const target = makeUser({ id: 'user-2' });

    expect(() => target.promote(actor)).toThrow(
      expect.objectContaining({ code: 'USER_FORBIDDEN', statusCode: 403 }),
    );
  });

  it('lanza AppError USER_ALREADY_ADMIN cuando el target ya es admin', () => {
    const actor = makeSuperadmin();
    const target = makeAdmin({ id: 'admin-2' });

    expect(() => target.promote(actor)).toThrow(
      expect.objectContaining({ code: 'USER_ALREADY_ADMIN', statusCode: 422 }),
    );
  });

  it('no muta el target original', () => {
    const actor = makeSuperadmin();
    const target = makeUser({ id: 'user-2' });

    target.promote(actor);

    expect(target.role).toBe('user');
  });
});

describe('User.updateStatus', () => {
  it("superadmin cambia status de user a 'inactive'", () => {
    const actor = makeSuperadmin();
    const target = makeUser({ id: 'user-2' });

    const updated = target.updateStatus('inactive', actor);

    expect(updated.status).toBe('inactive');
  });

  it('superadmin puede banear a un admin', () => {
    const actor = makeSuperadmin();
    const target = makeAdmin({ id: 'admin-2' });

    const updated = target.updateStatus('banned', actor);

    expect(updated.status).toBe('banned');
  });

  it('admin puede cambiar status de un user', () => {
    const actor = makeAdmin();
    const target = makeUser({ id: 'user-2' });

    const updated = target.updateStatus('inactive', actor);

    expect(updated.status).toBe('inactive');
  });

  it('lanza AppError USER_FORBIDDEN cuando admin intenta cambiar status de otro admin', () => {
    const actor = makeAdmin({ id: 'admin-1' });
    const target = makeAdmin({ id: 'admin-2' });

    expect(() => target.updateStatus('banned', actor)).toThrow(
      expect.objectContaining({ code: 'USER_FORBIDDEN', statusCode: 403 }),
    );
  });

  it('lanza AppError USER_FORBIDDEN cuando user intenta cambiar status de cualquier otro', () => {
    const actor = makeUser({ id: 'user-1' });
    const target = makeUser({ id: 'user-2' });

    expect(() => target.updateStatus('inactive', actor)).toThrow(
      expect.objectContaining({ code: 'USER_FORBIDDEN', statusCode: 403 }),
    );
  });

  it('lanza AppError USER_STATUS_UNCHANGED si el status ya es el mismo', () => {
    const actor = makeSuperadmin();
    const target = makeUser({ id: 'user-2', status: 'inactive' });

    expect(() => target.updateStatus('inactive', actor)).toThrow(
      expect.objectContaining({
        code: 'USER_STATUS_UNCHANGED',
        statusCode: 422,
      }),
    );
  });

  it('no muta el target original', () => {
    const actor = makeSuperadmin();
    const target = makeUser({ id: 'user-2' });

    target.updateStatus('inactive', actor);

    expect(target.status).toBe('active');
  });
});

describe('User.isActive', () => {
  it("retorna true cuando status es 'active'", () => {
    expect(makeUser().isActive()).toBe(true);
  });

  it("retorna false cuando status es 'inactive'", () => {
    expect(makeInactiveUser().isActive()).toBe(false);
  });

  it("retorna false cuando status es 'banned'", () => {
    expect(makeBannedUser().isActive()).toBe(false);
  });
});
