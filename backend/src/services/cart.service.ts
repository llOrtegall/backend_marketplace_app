import { ServiceError } from "../errors/service.error";
import { CartItem, Product } from "../models";

type AddCartItemInput = {
  productId?: string;
  quantity?: number;
};

export class CartService {
  private async formatCart(userId: string) {
    const cartItems = await CartItem.findAll({
      where: { userId },
      include: [{ model: Product, as: "product" }],
      order: [["createdAt", "DESC"]],
    });

    const items = cartItems.map((item) => {
      const product = (item as CartItem & { product?: Product }).product;
      const unitPrice = Number(product?.price ?? 0);
      const subtotal = unitPrice * item.quantity;

      return {
        id: item.id,
        quantity: item.quantity,
        product,
        subtotal: Number(subtotal.toFixed(2)),
      };
    });

    const total = Number(items.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2));

    return { items, total };
  }

  async getCart(userId: string) {
    const cart = await this.formatCart(userId);
    return { data: cart };
  }

  async addItem(userId: string, input: AddCartItemInput) {
    const { productId, quantity } = input;

    if (!productId) {
      throw new ServiceError(400, "productId is required");
    }

    const product = await Product.findByPk(productId);
    if (!product || !product.isActive) {
      throw new ServiceError(404, "Product not found");
    }

    const safeQuantity = Math.max(1, Number(quantity ?? 1));
    if (safeQuantity > product.stock) {
      throw new ServiceError(400, "Requested quantity exceeds available stock");
    }

    const existing = await CartItem.findOne({ where: { userId, productId } });

    if (existing) {
      const mergedQuantity = existing.quantity + safeQuantity;
      if (mergedQuantity > product.stock) {
        throw new ServiceError(400, "Requested quantity exceeds available stock");
      }

      existing.quantity = mergedQuantity;
      await existing.save();
    } else {
      await CartItem.create({ userId, productId, quantity: safeQuantity });
    }

    const cart = await this.formatCart(userId);
    return { data: cart };
  }

  async updateItem(userId: string, cartItemId: string, quantity?: number) {
    if (!quantity || Number(quantity) < 1) {
      throw new ServiceError(400, "quantity must be greater than 0");
    }

    const item = await CartItem.findByPk(cartItemId);
    if (!item || item.userId !== userId) {
      throw new ServiceError(404, "Cart item not found");
    }

    const product = await Product.findByPk(item.productId);
    if (!product) {
      throw new ServiceError(404, "Product not found");
    }

    if (Number(quantity) > product.stock) {
      throw new ServiceError(400, "Requested quantity exceeds available stock");
    }

    item.quantity = Number(quantity);
    await item.save();

    const cart = await this.formatCart(userId);
    return { data: cart };
  }

  async removeItem(userId: string, cartItemId: string) {
    const item = await CartItem.findByPk(cartItemId);

    if (!item || item.userId !== userId) {
      throw new ServiceError(404, "Cart item not found");
    }

    await item.destroy();
    const cart = await this.formatCart(userId);
    return { data: cart };
  }

  async clearCart(userId: string) {
    await CartItem.destroy({ where: { userId } });
    return { message: "Cart cleared" };
  }
}

export const cartService = new CartService();