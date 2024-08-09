"use strict";
module.exports = {
    up: function (queryInterface, Sequelize) {
        return queryInterface.createTable('productOrders', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            productId: {
                type: Sequelize.INTEGER
            },
            orderId: {
                type: Sequelize.INTEGER
            },
            currentPrice: {
                type: Sequelize.DECIMAL
            },
            quantity: {
                type: Sequelize.INTEGER
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    down: function (queryInterface, Sequelize) {
        return queryInterface.dropTable('productOrders');
    }
};
