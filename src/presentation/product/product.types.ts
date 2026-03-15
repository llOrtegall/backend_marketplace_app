import type { Product } from '../../domain/product/Product';

export interface ProductDTO {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  sellerId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function toProductDTO(product: Product): ProductDTO {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    category: product.category,
    images: product.images,
    sellerId: product.sellerId,
    status: product.status,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
