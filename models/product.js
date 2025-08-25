'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Product.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      business_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      buying_price: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      selling_price: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false
      },
      measurement: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true
      },
      new_selling_price: {
        type: DataTypes.FLOAT,
        allowNull: true,
        default: 0.0
      },
      new_buying_price: {
        type: DataTypes.FLOAT,
        allowNull: true,
        default: 0.0
      },
      new_quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        default: 0
      },
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'products'
  });
  return Product;
};