import { CartItem } from "./cart-item.model";
import { Order } from "./order.model";
import { OrderItem } from "./order-item.model";
import { Product } from "./product.model";
import { User } from "./user.model";

const initializeModelAssociations = () => {
  User.hasMany(Order, {
    foreignKey: "userId",
    as: "orders",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });

  Order.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });

  Order.hasMany(OrderItem, {
    foreignKey: "orderId",
    as: "items",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });

  OrderItem.belongsTo(Order, {
    foreignKey: "orderId",
    as: "order",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });

  Product.hasMany(OrderItem, {
    foreignKey: "productId",
    as: "orderItems",
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  });

  OrderItem.belongsTo(Product, {
    foreignKey: "productId",
    as: "product",
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  });

  User.hasMany(CartItem, {
    foreignKey: "userId",
    as: "cartItems",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });

  CartItem.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });

  Product.hasMany(CartItem, {
    foreignKey: "productId",
    as: "cartItems",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });

  CartItem.belongsTo(Product, {
    foreignKey: "productId",
    as: "product",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });
};

let modelsInitialized = false;

export const initModels = () => {
  if (modelsInitialized) {
    return;
  }

  initializeModelAssociations();
  modelsInitialized = true;
};

export { CartItem, Order, OrderItem, Product, User };
