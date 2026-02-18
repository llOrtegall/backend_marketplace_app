import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from "sequelize";

import { sequelize } from "../config/database";

export class Image extends Model<InferAttributes<Image>, InferCreationAttributes<Image>> {
  declare id: CreationOptional<string>;
  declare productId: string;
  declare url: string;
  declare url2: string | null;
  declare url3: string | null;
  declare url4: string | null;
  declare url5: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Image.init({
  id: { type: DataTypes.STRING, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  productId: { type: DataTypes.STRING, allowNull: false },
  url: { type: DataTypes.STRING, allowNull: false },
  url2: { type: DataTypes.STRING, allowNull: true },
  url3: { type: DataTypes.STRING, allowNull: true },
  url4: { type: DataTypes.STRING, allowNull: true },
  url5: { type: DataTypes.STRING, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize,
});
