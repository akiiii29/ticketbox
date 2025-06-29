'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Ticket extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Ticket.belongsTo(models.User, { foreignKey: 'userId' });
      Ticket.belongsTo(models.Event, { foreignKey: 'eventId' });
      Ticket.belongsTo(models.Seat, { foreignKey: 'seatId' });
      Ticket.belongsTo(models.Order, { foreignKey: 'orderId' });
    }
  }
  Ticket.init({
    userId: DataTypes.INTEGER,
    eventId: DataTypes.INTEGER,
    seatId: DataTypes.INTEGER,
    orderId: DataTypes.INTEGER,
    ticketNumber: DataTypes.STRING,
    status: DataTypes.STRING,
    seatInfo: DataTypes.JSONB,
    usedAt: DataTypes.DATE,
    cancelledAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Ticket',
  });
  return Ticket;
};