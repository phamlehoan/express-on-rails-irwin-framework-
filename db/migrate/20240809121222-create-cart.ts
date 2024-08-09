import { QueryInterface, SequelizeStatic } from "sequelize";

export = {
  up: (queryInterface: QueryInterface, Sequelize: SequelizeStatic) => {
    return queryInterface.createTable("carts", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },

      userId: {
        type: Sequelize.INTEGER,
      },

      productId: {
        type: Sequelize.INTEGER,
      },

      quantity: {
        type: Sequelize.INTEGER,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  down: (queryInterface: QueryInterface, Sequelize: SequelizeStatic) => {
    return queryInterface.dropTable("carts");
  },
};
