import sequelize from "@configs/database";
import { Sequelize } from "sequelize";
import { order } from "./order";
import { product } from "./product";

export interface ProductOrderAttributes {
  id: number;
  productId?: number;
  orderId?: number;
  currentPrice?: number;
  quantity?: number;
}

export interface ProductOrderInstance {
  id: number;
  createdAt: Date;
  updatedAt: Date;

  productId: number;
  orderId: number;
  currentPrice: number;
  quantity: number;
}

export const productOrder = sequelize.define("productOrder", {
  productId: Sequelize.INTEGER,
  orderId: Sequelize.INTEGER,
  currentPrice: Sequelize.DECIMAL,
  quantity: Sequelize.INTEGER,
});

export const associate = () => {
  productOrder.belongsTo(product);
  productOrder.belongsTo(order);
};

export default {
  productOrder,
  associate,
};
