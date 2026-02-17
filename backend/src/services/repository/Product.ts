import type { Product } from "../../models/product.model";

export interface ProductRepository {
  getAllProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | null>;
  createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product>;
  updateProduct(id: string, data: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>): Promise<Product | null>;
  deactivateProduct(id: string): Promise<void>;
}