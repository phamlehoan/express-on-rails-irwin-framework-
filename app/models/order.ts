import sequelize from "@configs/database";
import { Sequelize } from "sequelize";
import { product } from "./product";
import { productOrder } from "./productOrder";
import { user } from "./user";

export enum OrderStatus {
  CANCELED = 0,
  PENDING = 1,
  APPROVED = 2,
}

export interface OrderAttributes {
  id: number;
  createdAt?: Date;
  userId?: number;
  address?: string;
  phoneNumber?: string;
  receiverName?: string;
  status?: OrderStatus;
}

export interface OrderInstance {
  id: number;
  createdAt: Date;
  updatedAt: Date;

  userId: number;
  address: string;
  phoneNumber: string;
  receiverName: string;
  status: OrderStatus;
}

export const order = sequelize.define("order", {
  userId: Sequelize.INTEGER,
  address: Sequelize.STRING,
  phoneNumber: Sequelize.STRING,
  receiverName: Sequelize.STRING,
  status: Sequelize.INTEGER,
});

export const associate = () => {
  order.belongsTo(user);
  order.hasMany(productOrder);
  order.belongsToMany(product, {
    through: productOrder,
  });
};

export default {
  order,
  associate,
};
