import { Product } from "../models/product.model";
import type { ProductRepository } from "./repository/Product";
import { ServiceError } from "../errors/service.error";

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

  getProductById = async (id: string): Promise<Product | null> => {
    const product = await Product.findByPk(id, {
      attributes: { exclude: ['createdAt', 'updatedAt'] },
    });

    if (!product) {
      throw new ServiceError(404, "Product not found");
    }

    return product;
  }

  createProduct = async (data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> => {
    const newProduct = await Product.create(data);
    return newProduct;
  }

  updateProduct = async (id: string, data: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>): Promise<Product | null> => {
    const product = await Product.findByPk(id);

    if (!product) {
      throw new ServiceError(404, "Product not found");
    }

    await product.update(data);
    return product;
  }

  deactivateProduct = async (id: string): Promise<void> => {
    const product = await Product.findByPk(id);

    if (!product) {
      throw new ServiceError(404, "Product not found");
    }

    await product.update({ isActive: false });
  }

}

export const productsService = ProductsService.getInstance();
