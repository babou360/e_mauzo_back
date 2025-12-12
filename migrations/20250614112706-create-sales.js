'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sales', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      business_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
      seller_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      products: {
        type: Sequelize.ARRAY(Sequelize.JSON),
        allowNull: false
      },
      total_price: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      discount: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      buyer_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      paid: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      payment_method: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        default:"active"
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('sales');
  }
};