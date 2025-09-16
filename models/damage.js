'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Damage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Damage.init({
     product_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
     name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      images: {
        type: DataTypes.ARRAY(DataTypes.STRING),
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
      quantity: {
        type: DataTypes.STRING,
        allowNull: false
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: true
      },
      attendant_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      business_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
  }, {
    sequelize,
    tableName: 'damages',
    modelName: 'Damage',
  });
  return Damage;
};