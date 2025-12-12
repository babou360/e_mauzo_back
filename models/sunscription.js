'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Sunscription extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Sunscription.init({
    plan: {
      type: DataTypes.STRING,
      allowNull: false
    },
    userIds: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false
    },
    businessId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastPaid: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: new Date()
    },
  }, {
    sequelize,
    modelName: 'Subscription',
    tableName: 'subscriptions'
  });
  return Sunscription;
};