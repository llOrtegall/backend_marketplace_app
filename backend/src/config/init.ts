import { Product } from "../models/product.model"
import { Image } from "../models/images.model"
import { Order } from "../models/order.model"

import { sequelize } from "./database"

export function initDatabase() {
  try {
    sequelize.authenticate().then(async () => {
      console.log("Database connection has been established successfully.");

      await Product.sync();
      await Image.sync();
      await Order.sync();

    }).catch((error) => {
      console.error("Unable to connect to the database:", error);
      process.exit(1);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }

}