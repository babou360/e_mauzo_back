'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Measurement extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Measurement.init({
     swahili: {
        type: DataTypes.STRING,
        allowNull: false
      },
     english: {
        type: DataTypes.STRING,
        allowNull: false
      },
     images: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: []
      },
      short_form: {
        type: DataTypes.STRING,
        allowNull: false
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true
      },
  }, {
    sequelize,
    modelName: 'Measurement',
    tableName: "measurements"
  });
  return Measurement;
};