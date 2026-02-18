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

  getAllProducts = async (): Promise<Product[]> => {
    const products = await Product.findAll({
      attributes: { exclude: ['createdAt', 'updatedAt'] },
    });

    return products;
  }

  getProductById(id: string): Promise<Product | null> {
    throw new Error("Method not implemented.");
  }

  createProduct = async (data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> => {
    //firts step upload image to R2 servicer in Cloduflare

    const newProduct = await Product.create(data);
    return newProduct;
  }

  updateProduct(id: string, data: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>): Promise<Product | null> {
    throw new Error("Method not implemented.");
  }

  deactivateProduct(id: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

}

export const productsService = ProductsService.getInstance();

