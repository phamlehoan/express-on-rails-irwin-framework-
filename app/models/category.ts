import sequelize from "@configs/database";
import { Sequelize } from "sequelize";
import { product } from "./product";

export interface CategoryAttributes {
  id: number;
  name?: string;
  description?: string;
  image?: string,
}

export interface CategoryInstance {
  id: number;
  createdAt: Date;
  updatedAt: Date;

  name: string;
  description: string;
  image: string,
}

export const category = sequelize.define("category", {
  name: Sequelize.STRING,
  description: Sequelize.STRING,
  image: Sequelize.BLOB,
});

export const associate = () => {
  category.hasMany(product, {
    foreignKey: "categoryId",
  });
};

export default { category, associate };
