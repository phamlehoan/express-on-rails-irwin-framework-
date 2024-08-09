import sequelize from "@configs/database";
import { Sequelize } from "sequelize";
import { cart } from "./cart";
import { order } from "./order";
import { product } from "./product";

export enum Role {
  ADMIN = 0,
  USER = 1,
}

export interface UserAttributes {
  id: number;
  name?: string;
  avatarUrl?: string;
  email?: string;
  password?: string;
  role?: Role;
}

export interface UserInstance {
  id: number;
  createdAt: Date;
  updatedAt: Date;

  name: string;
  avatarUrl: string;
  email: string;
  password: string;
  role: Role;
}

export const user = sequelize.define("user", {
  name: Sequelize.STRING,
  avatarUrl: Sequelize.STRING,
  email: Sequelize.STRING,
  password: Sequelize.STRING,
  role: Sequelize.INTEGER,
});

export const associate = () => {
  user.hasMany(cart);
  user.belongsToMany(product, {
    through: cart,
    as: "cartProducts",
  });
  user.hasMany(order);
};

export default { user, associate };
