import { CartItem } from "./cart-item.model";
import { Order } from "./order.model";
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

export { CartItem, Order, Product, User };
