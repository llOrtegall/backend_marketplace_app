import { randomUUID } from 'node:crypto';
import { Product } from '../../domain/product/Product';
import type { ProductRepository } from '../../domain/product/ProductRepository';

export interface CreateProductDTO {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  sellerId: string;
}

export class CreateProductUseCase {
  constructor(private readonly repo: ProductRepository) {}

  async execute(input: CreateProductDTO): Promise<Product> {
    const product = Product.create({ id: randomUUID(), ...input });
    await this.repo.save(product);
    return product;
  }
}
