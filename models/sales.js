'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Sales extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Sales.init({
    seller_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    business_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    products: {
      type: DataTypes.ARRAY(DataTypes.JSON),
      allowNull: false
    },
    total_price: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    discount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    buyer_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
  }, {
    sequelize,
    modelName: 'Sales',
    tableName: "sales"
  });
  return Sales;
};