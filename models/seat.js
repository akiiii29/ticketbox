'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Seat extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Seat.belongsTo(models.SeatMap, { foreignKey: 'seatMapId' });
      Seat.hasMany(models.SeatReservation, { foreignKey: 'seatId' });
      Seat.hasMany(models.Ticket, { foreignKey: 'seatId' });
      
    }
  }
  Seat.init({
    seatMapId: DataTypes.INTEGER,
    label: DataTypes.STRING,
    section: DataTypes.STRING,
    row: DataTypes.STRING,
    number: DataTypes.INTEGER,
    price: DataTypes.DECIMAL,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Seat',
  });
  return Seat;
};