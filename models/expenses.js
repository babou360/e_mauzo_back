'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Expenses extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Expenses.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false
      },
      business_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
  }, {
    sequelize,
    modelName: 'Expense',
    tableName: 'expenses'
  });
  return Expenses;
};