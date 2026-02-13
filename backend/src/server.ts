import { app } from "./app";
import { sequelize } from "./config/database";
import { initModels } from "./models";

const port = Number(process.env.PORT ?? 3000);

const startServer = async () => {
  try {
    initModels();
    await sequelize.authenticate();
    console.log("Database connection established");

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
