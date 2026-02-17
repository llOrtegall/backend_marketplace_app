import { Product } from "../models/product.model";
import type { ProductRepository } from "./repository/Product";

class ProductsService implements ProductRepository {
  private static instance: ProductsService;

  private constructor() { }

  public static getInstance(): ProductsService {
    if (!ProductsService.instance) {
      ProductsService.instance = new ProductsService();
    }
    return ProductsService.instance;
  }

  getAllProducts(): Promise<Product[]> {
    throw new Error("Method not implemented.");
  }
  getProductById(id: string): Promise<Product | null> {
    throw new Error("Method not implemented.");
  }

  createProduct = async (data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> => {
    throw new Error("Method not implemented.");
  }

  updateProduct(id: string, data: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>): Promise<Product | null> {
    throw new Error("Method not implemented.");
  }
  deactivateProduct(id: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

}

export const productsService = ProductsService.getInstance();

