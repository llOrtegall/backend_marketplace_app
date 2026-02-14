import { Sequelize } from "sequelize";

const databaseUrl = process.env.DATABASE_URL;
const schema = process.env.DATABASE_STORE_SCHEMA;

if (!databaseUrl || !schema) {
  throw new Error("DATABASE_URL and DATABASE_STORE_SCHEMA are required to initialize Sequelize");
}

export const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  schema: schema,
  logging: false,
});
