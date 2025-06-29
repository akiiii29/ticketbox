'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasMany(models.Event, { foreignKey: 'organizerId', as: 'organizedEvents' });
      User.hasMany(models.Order, { foreignKey: 'userId' });
      User.hasMany(models.Ticket, { foreignKey: 'userId' });
      User.hasMany(models.Favorite, { foreignKey: 'userId' });
      User.hasMany(models.Rating, { foreignKey: 'userId' });
      User.hasMany(models.SeatReservation, { foreignKey: 'userId' });
    }

    // Check if user is admin
    isAdmin() {
      return this.role === 'admin';
    }

    // Check if user is organizer
    isOrganizer() {
      return this.role === 'organizer' || this.role === 'admin';
    }
  }
  User.init({
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('user', 'organizer', 'admin'),
      defaultValue: 'user',
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};