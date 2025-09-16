'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Business extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Business.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false
      },
      country: {
        type: DataTypes.STRING,
        allowNull: false
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false
      },
      district: {
        type: DataTypes.STRING,
        allowNull: true
      },
      ward: {
        type: DataTypes.STRING,
        allowNull: true
      },
      street: {
        type: DataTypes.STRING,
        allowNull: true
      },
      latlong: {
        type: DataTypes.STRING,
        allowNull: true
      },
      user_id: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "active"
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      pricing_category: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "basic"
      },
  }, {
    sequelize,
    modelName: 'Business',
    tableName: "businesses"
  });
  return Business;
};