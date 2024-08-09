import sequelize from "@configs/database";
import { Sequelize } from "sequelize";
import { product } from "./product";
import { user } from "./user";

export interface CartAttributes {
  id: number;
  userId?: number;
  productId?: number;
  quantity?: number;
}

export interface CartInstance {
  id: number;
  createdAt: Date;
  updatedAt: Date;

  userId: number;
  productId: number;
  quantity: number;
}

export const cart = sequelize.define("cart", {
  userId: Sequelize.INTEGER,
  productId: Sequelize.INTEGER,
  quantity: Sequelize.INTEGER,
});

export const associate = () => {
  cart.belongsTo(product);
  cart.belongsTo(user);
};

export default { cart, associate };
