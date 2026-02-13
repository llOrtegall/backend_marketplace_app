import { Sequelize } from "sequelize";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to initialize Sequelize");
}

export const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres"
});
