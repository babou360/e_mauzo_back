'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('damages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      images: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false
      },
      buying_price: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      selling_price: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      quantity: {
        type: Sequelize.STRING,
        allowNull: false
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: true
      },
      attendant_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      business_id: {
        type: Sequelize.INTEGER,
        allowNull: false
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
    await queryInterface.dropTable('damages');
  }
};