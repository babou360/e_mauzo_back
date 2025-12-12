'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Buyer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Buyer.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false
      },
      business_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
  }, {
    sequelize,
    modelName: 'Buyer',
    tableName:'buyers'
  });
  return Buyer;
};