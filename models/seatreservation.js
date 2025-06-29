'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SeatReservation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      SeatReservation.belongsTo(models.Seat, { foreignKey: 'seatId' });
      SeatReservation.belongsTo(models.User, { foreignKey: 'userId' });
      SeatReservation.belongsTo(models.Order, { foreignKey: 'orderId' });
      
    }
  }
  SeatReservation.init({
    seatId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    orderId: DataTypes.INTEGER,
    status: DataTypes.STRING,
    expiresAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'SeatReservation',
  });
  return SeatReservation;
};