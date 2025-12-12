'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('subscriptions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
       plan: {
      type: Sequelize.STRING,
      allowNull: false
    },
    userIds: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false
    },
    businessId: {
      type: Sequelize.STRING,
      allowNull: false
    },
    lastPaid: {
      type: Sequelize.DATE,
      allowNull: false,
      default: new Date()
    },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('subscriptions');
  }
};