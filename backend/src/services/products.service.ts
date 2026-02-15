import { ServiceError } from "../errors/service.error";
import type { ProductInput } from "../schema/validateProduct";
import { Product } from "../models";

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

  async createProduct(data: ProductInput) {
    const { name, description, price, stock, isActive } = data;

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

  async updateProductById(productId: string, data: ProductInput) {
    const product = await Product.findByPk(productId);

    if (!product) {
      throw new ServiceError(404, "Product not found");
    }

    const { name, description, price, stock, isActive } = data;

    await product.update({
      name: name ?? product.name,
      description: description !== undefined ? description : product.description,
      price: price !== undefined ? String(price) : product.price,
      stock: stock !== undefined ? stock : product.stock,
      isActive: isActive !== undefined ? isActive : product.isActive,
    })

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