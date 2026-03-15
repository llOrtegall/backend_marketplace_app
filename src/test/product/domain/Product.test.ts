import { describe, expect, it } from 'bun:test';
import { Product } from '../../../domain/product/Product';
import { Price } from '../../../domain/product/ProductValueObjects';
import { UnprocessableError } from '../../../shared/errors/AppError';
import {
  makeDeletedProduct,
  makeInactiveProduct,
  makeProduct,
} from '../../helpers/productFixtures';

describe('Product.create', () => {
  it("crea producto con status 'active' por defecto", () => {
    const product = Product.create({
      id: 'p-1',
      name: 'Mi Producto',
      description: 'Descripción suficientemente larga',
      price: 50,
      stock: 5,
      category: 'hogar',
      images: ['https://example.com/img.jpg'],
      sellerId: 'seller-1',
    });
    expect(product.status).toBe('active');
  });

  it('encapsula price y stock como value objects válidos', () => {
    const product = Product.create({
      id: 'p-1',
      name: 'Mi Producto',
      description: 'Descripción',
      price: 99.99,
      stock: 10,
      category: 'hogar',
      images: ['https://example.com/img.jpg'],
      sellerId: 'seller-1',
    });
    expect(product.price).toBe(99.99);
    expect(product.stock).toBe(10);
  });

  it('lanza UnprocessableError si el precio es inválido', () => {
    expect(() =>
      Product.create({
        id: 'p-1',
        name: 'Mi Producto',
        description: 'Descripción',
        price: -10,
        stock: 5,
        category: 'hogar',
        images: ['https://example.com/img.jpg'],
        sellerId: 'seller-1',
      }),
    ).toThrow(UnprocessableError);
  });
});

describe('Product.update', () => {
  it('actualiza solo los campos provistos (partial update)', () => {
    const product = makeProduct({ name: 'Original', price: Price.create(10) });

    const updated = product.update({ name: 'Nuevo Nombre' });

    expect(updated.name).toBe('Nuevo Nombre');
    expect(updated.price).toBe(10); // sin cambios
    expect(updated.description).toBe(product.description);
  });

  it('updatedAt cambia tras el update', () => {
    const product = makeProduct();

    const updated = product.update({ name: 'Actualizado' });

    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
      product.updatedAt.getTime(),
    );
  });

  it('lanza UnprocessableError si el nuevo precio es inválido', () => {
    const product = makeProduct();

    expect(() => product.update({ price: 0 })).toThrow(UnprocessableError);
  });

  it('lanza UnprocessableError si el nuevo stock es negativo', () => {
    const product = makeProduct();

    expect(() => product.update({ stock: -1 })).toThrow(UnprocessableError);
  });

  it('no muta el producto original', () => {
    const product = makeProduct({ name: 'Original' });

    product.update({ name: 'Nuevo' });

    expect(product.name).toBe('Original');
  });
});

describe('Product.softDelete', () => {
  it("cambia status a 'deleted' desde 'active'", () => {
    const product = makeProduct();

    const deleted = product.softDelete();

    expect(deleted.status).toBe('deleted');
  });

  it('popula deletedAt al hacer softDelete', () => {
    const product = makeProduct();

    const deleted = product.softDelete();

    expect(deleted.deletedAt).toBeInstanceOf(Date);
  });

  it("permite softDelete desde 'inactive'", () => {
    const product = makeInactiveProduct();

    const deleted = product.softDelete();

    expect(deleted.status).toBe('deleted');
  });

  it("lanza AppError PRODUCT_INVALID_TRANSITION desde 'deleted'", () => {
    const product = makeDeletedProduct();

    expect(() => product.softDelete()).toThrow(
      expect.objectContaining({
        code: 'PRODUCT_INVALID_TRANSITION',
        statusCode: 422,
      }),
    );
  });

  it('no muta el producto original', () => {
    const product = makeProduct();

    product.softDelete();

    expect(product.status).toBe('active');
  });
});

describe('Product.isOwnedBy', () => {
  it('retorna true cuando sellerId coincide', () => {
    const product = makeProduct({ sellerId: 'seller-1' });
    expect(product.isOwnedBy('seller-1')).toBe(true);
  });

  it('retorna false cuando sellerId no coincide', () => {
    const product = makeProduct({ sellerId: 'seller-1' });
    expect(product.isOwnedBy('seller-2')).toBe(false);
  });

  it('retorna false con string vacío', () => {
    const product = makeProduct({ sellerId: 'seller-1' });
    expect(product.isOwnedBy('')).toBe(false);
  });
});
