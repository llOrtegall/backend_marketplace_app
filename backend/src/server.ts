import { app } from "./app";
import { sequelize } from "./config/database";
import { initModels } from "./models";

const port = Number(process.env.PORT ?? 3000);

const startServer = async () => {
  try {
    initModels();
    await sequelize.authenticate();
    console.log("Database connection established");

    const schema = process.env.DATABASE_STORE_SCHEMA ?? "public";
    await sequelize.query(
      `ALTER TABLE "${schema}"."CartItems" DROP CONSTRAINT IF EXISTS "CartItems_userId_fkey";`,
    );
    await sequelize.query(
      `ALTER TABLE "${schema}"."Orders" DROP CONSTRAINT IF EXISTS "Orders_userId_fkey";`,
    );

    await sequelize.sync();
    console.log("Database models synchronized");

    app.listen(port, () => {
      console.log(`Backend running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database", error);
    process.exit(1);
  }
};

void startServer();
