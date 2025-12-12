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
    attendant_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      business_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      images: {
        type: DataTypes.ARRAY(DataTypes.STRING),
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
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null
      },
      sub_category: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      },
      measurement: {
        type: DataTypes.JSON,
        allowNull: false
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true
      },
      new_selling_price: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0.0
      },
      new_buying_price: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0.0
      },
      new_quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      size: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "active"
      },
      condition: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      min_stock: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      business_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ingridients: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      is_alcohol: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      brand: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      material: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dosage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      pack_size: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      animal_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      extra_attributes: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      expire_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'products'
  });
  return Product;
};