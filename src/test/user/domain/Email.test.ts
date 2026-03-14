import { describe, expect, it } from 'bun:test';
import { Email } from '../../../domain/user/UserValueObjects';
import { ValidationError } from '../../../shared/errors/AppError';

describe('Email.create', () => {
  it('crea email válido', () => {
    const email = Email.create('user@example.com');
    expect(email.value).toBe('user@example.com');
  });

  it('normaliza a minúsculas', () => {
    const email = Email.create('User@EXAMPLE.COM');
    expect(email.value).toBe('user@example.com');
  });

  it('elimina espacios al inicio y fin', () => {
    const email = Email.create('  user@example.com  ');
    expect(email.value).toBe('user@example.com');
  });

  it('acepta email con subdominio', () => {
    const email = Email.create('user@mail.co.uk');
    expect(email.value).toBe('user@mail.co.uk');
  });

  it('acepta email con más de un punto en la parte local', () => {
    const email = Email.create('first.last.name@example.com');
    expect(email.value).toBe('first.last.name@example.com');
  });

  it('lanza ValidationError si no tiene @', () => {
    expect(() => Email.create('userexample.com')).toThrow(ValidationError);
  });

  it('lanza ValidationError si no tiene dominio', () => {
    expect(() => Email.create('user@')).toThrow(ValidationError);
  });

  it('lanza ValidationError si el string está vacío', () => {
    expect(() => Email.create('')).toThrow(ValidationError);
  });

  it('lanza ValidationError si tiene espacios internos', () => {
    expect(() => Email.create('user @example.com')).toThrow(ValidationError);
  });
});
