'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Stock extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Stock.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false
      },
    user_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      selling_price: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      buying_price: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
  }, {
    sequelize,
    tableName: "stocks",
    modelName: 'Stock',
  });
  return Stock;
};