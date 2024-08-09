import sequelize from "@configs/database";
import { Sequelize } from "sequelize";
import { cart } from "./cart";
import { category } from "./category";
import { order } from "./order";
import { productOrder } from "./productOrder";
import { user } from "./user";

export interface ProductAttributes {
  id: number;
  name?: string;
  description?: string;
  price?: number;
  image?: string,
  categoryId?: number;
}

export interface ProductInstance {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  
  name: string;
  description: string;
  price: number;
  image: string,
  categoryId: number;
}

export const product = sequelize.define("product", {
  name: Sequelize.STRING,
  description: Sequelize.STRING,
  price: Sequelize.DECIMAL,
  image: Sequelize.BLOB,
  categoryId: Sequelize.INTEGER,
});

export const associate = () => {
  product.belongsTo(category, {
    foreignKey: "categoryId",
  });
  product.hasMany(cart);
  product.hasMany(productOrder);
  product.belongsToMany(order, {
    through: productOrder,
  });
  product.belongsToMany(user, {
    through: cart,
    as: "cartUsers",
  });
};

export default { product, associate };
