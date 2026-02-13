import { ServiceError } from "../errors/service.error";
import { Product } from "../models";

type UpsertProductInput = {
  name?: string;
  description?: string | null;
  price?: number | string;
  stock?: number;
  isActive?: boolean;
};

export class ProductsService {
  async listProducts() {
    const products = await Product.findAll({ order: [["createdAt", "DESC"]] });
    return { data: products };
  }

  async getProductById(productId: string) {
    const product = await Product.findByPk(productId);

    if (!product) {
      throw new ServiceError(404, "Product not found");
    }

    return { data: product };
  }

  async createProduct(input: UpsertProductInput) {
    const { name, description, price, stock, isActive } = input;

    if (!name || price === undefined) {
      throw new ServiceError(400, "name and price are required");
    }

    const product = await Product.create({
      name,
      description: description ?? null,
      price: String(price),
      stock: stock ?? 0,
      isActive: isActive ?? true,
    });

    return { data: product };
  }

  async updateProductById(productId: string, input: UpsertProductInput) {
    const product = await Product.findByPk(productId);
    if (!product) {
      throw new ServiceError(404, "Product not found");
    }

    const { name, description, price, stock, isActive } = input;

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = String(price);
    if (stock !== undefined) product.stock = stock;
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();
    return { data: product };
  }

  async deactivateProductById(productId: string) {
    const product = await Product.findByPk(productId);
    if (!product) {
      throw new ServiceError(404, "Product not found");
    }

    product.isActive = false;
    await product.save();

    return { message: "Product deactivated" };
  }
}

export const productsService = new ProductsService();