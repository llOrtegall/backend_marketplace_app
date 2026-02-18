import { ServiceError } from "../errors/service.error";
import type { ProductInput } from "../schema/validateProduct";
import { Product } from "../models";
import { getProductImageSignedUrl, uploadProductImageToR2 } from "../lib/r2";

type ProductPayload = Awaited<ReturnType<Product["toJSON"]>> & {
  imageUrl: string;
};

export class ProductsService {
  private async serializeProduct(product: Product): Promise<ProductPayload> {
    const imageUrl = await getProductImageSignedUrl(product.image);
    return {
      ...product.toJSON(),
      imageUrl,
    };
  }

  async listProducts() {
    const products = await Product.findAll({ order: [["createdAt", "DESC"]] });
    const serialized = await Promise.all(products.map((product) => this.serializeProduct(product)));
    return { data: serialized };
  }

  async getProductById(productId: string) {
    const product = await Product.findByPk(productId);

    if (!product) {
      throw new ServiceError(404, "Product not found");
    }

    return { data: await this.serializeProduct(product) };
  }

  async createProduct(data: ProductInput, imageFile: Express.Multer.File) {
    const { name, description, price, stock, isActive } = data;

    if (!name || price === undefined) {
      throw new ServiceError(400, "name and price are required");
    }

    const imageKey = await uploadProductImageToR2(imageFile);

    const product = await Product.create({
      name,
      description: description ?? null,
      image: imageKey,
      price: String(price),
      stock: stock ?? 0,
      isActive: isActive ?? true,
    });

    return { data: await this.serializeProduct(product) };
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

    return { data: await this.serializeProduct(product) };
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