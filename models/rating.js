'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Rating extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Rating.belongsTo(models.User, { foreignKey: 'userId' });
      Rating.belongsTo(models.Event, { foreignKey: 'eventId' });
      Rating.belongsTo(models.User, { foreignKey: 'organizerId', as: 'organizer' });
    }
  }
  Rating.init({
    userId: DataTypes.INTEGER,
    organizerId: DataTypes.INTEGER,
    eventId: DataTypes.INTEGER,
    score: DataTypes.INTEGER,
    comment: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Rating',
  });
  return Rating;
};