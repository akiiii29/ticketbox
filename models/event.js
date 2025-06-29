'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Event.belongsTo(models.User, { foreignKey: 'organizerId', as: 'organizer' });
      Event.hasMany(models.Order, { foreignKey: 'eventId' });
      Event.hasMany(models.Ticket, { foreignKey: 'eventId' });
      Event.hasMany(models.Favorite, { foreignKey: 'eventId' });
      Event.hasMany(models.Rating, { foreignKey: 'eventId' });
      Event.hasOne(models.SeatMap, { foreignKey: 'eventId' });  
    }
  }
  Event.init({
    
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    date: DataTypes.DATE,
    venue: DataTypes.STRING,
    category: DataTypes.STRING,
    price: DataTypes.DECIMAL,
    organizerId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Event',
  });
  return Event;
};