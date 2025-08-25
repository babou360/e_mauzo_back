'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MS_CAT extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  MS_CAT.init({
    name: {
        type: DataTypes.JSON,
        allowNull: false
      },
      examples: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false
      },
  }, {
    sequelize,
    modelName: 'MS_CAT',
    tableName: "ms_cats"
  });
  return MS_CAT;
};