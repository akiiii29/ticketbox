'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SeatMap extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      SeatMap.belongsTo(models.Event, { foreignKey: 'eventId' });
      SeatMap.hasMany(models.Seat, { foreignKey: 'seatMapId' });
      
    }
  }
  SeatMap.init({
    eventId: DataTypes.INTEGER,
    name: DataTypes.STRING,
    layoutJson: DataTypes.JSONB
  }, {
    sequelize,
    modelName: 'SeatMap',
  });
  return SeatMap;
};