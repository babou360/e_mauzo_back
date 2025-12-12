'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      attendant_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      business_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      images: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true
      },
      quantity: {
        type: Sequelize.FLOAT,
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
      category: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      sub_category: {
        type: Sequelize.STRING,
        allowNull: true
      },
      measurement: {
        type: Sequelize.JSON,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true
      },
      new_selling_price: {
        type: Sequelize.FLOAT,
        allowNull: true,
        default: 0.0
      },
      new_buying_price: {
        type: Sequelize.FLOAT,
        allowNull: true,
        default: 0.0
      },
      new_quantity: {
        type: Sequelize.INTEGER,
        allowNull: true,
        default: 0
      },
      size: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      color: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        default: "active"
      },
      condition: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      min_stock: {
        type: Sequelize.INTEGER,
        allowNull: true,
        default: 0
      },
      business_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ingridients: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },
      is_alcohol: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      brand: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      material: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      dosage: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      pack_size: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      animal_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      extra_attributes: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      expire_date: {
        type: Sequelize.DATE,
        allowNull: true,
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
    await queryInterface.dropTable('products');
  }
};