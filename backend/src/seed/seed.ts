import { hash } from "bcryptjs";

import { sequelize } from "../config/database";
import { CartItem, Order, Product, User, initModels } from "../models";

const seed = async () => {
  try {
    initModels();
    await sequelize.authenticate();
    await sequelize.sync();

    const passwordHash = await hash("Secret123!", 10);

    const [admin] = await User.findOrCreate({
      where: { email: "admin@ecommerce.local" },
      defaults: {
        fullName: "Admin Ecommerce",
        email: "admin@ecommerce.local",
        password: passwordHash,
        role: "admin",
      },
    });

    const [customer] = await User.findOrCreate({
      where: { email: "customer@ecommerce.local" },
      defaults: {
        fullName: "Cliente Demo",
        email: "customer@ecommerce.local",
        password: passwordHash,
        role: "customer",
      },
    });

    const mockProducts = [
      {
        name: "Teclado Mecánico",
        description: "Teclado mecánico RGB switch blue",
        image: "products/seed-teclado-mecanico.jpg",
        price: "259000.00",
        stock: 25,
      },
      {
        name: "Mouse Gamer",
        description: "Mouse ergonómico 12000 DPI",
        image: "products/seed-mouse-gamer.jpg",
        price: "149000.00",
        stock: 40,
      },
      {
        name: "Audífonos Inalámbricos",
        description: "Cancelación de ruido y batería 30h",
        image: "products/seed-audifonos-inalambricos.jpg",
        price: "329000.00",
        stock: 18,
      },
    ];

    const products: Product[] = [];

    for (const mockProduct of mockProducts) {
      const [product] = await Product.findOrCreate({
        where: { name: mockProduct.name },
        defaults: {
          ...mockProduct,
          isActive: true,
        },
      });
      products.push(product);
    }

    const keyboard = products[0];
    const mouse = products[1];

    if (!keyboard || !mouse) {
      throw new Error("Seed products were not created correctly");
    }

    const [pendingOrder] = await Order.findOrCreate({
      where: {
        userId: customer.id,
        status: "pending",
      },
      defaults: {
        userId: customer.id,
        status: "pending",
        total: "408000.00",
      },
    });

    await CartItem.destroy({ where: { userId: customer.id } });

    await CartItem.bulkCreate([
      {
        userId: customer.id,
        productId: keyboard.id,
        quantity: 1,
      },
      {
        userId: customer.id,
        productId: mouse.id,
        quantity: 2,
      },
    ]);

    console.log("Seed completed successfully", {
      users: [admin.email, customer.email],
      products: products.map((product) => product.name),
      pendingOrderId: pendingOrder.id,
    });

    process.exit(0);
  } catch (error) {
    console.error("Seed failed", error);
    process.exit(1);
  }
};

void seed();
