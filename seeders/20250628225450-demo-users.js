'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = [
      {
        username: 'admin',
        email: 'admin@ticketbox.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'organizer1',
        email: 'organizer1@example.com',
        password: hashedPassword,
        role: 'organizer',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'organizer2',
        email: 'organizer2@example.com',
        password: hashedPassword,
        role: 'organizer',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'john_doe',
        email: 'john@example.com',
        password: hashedPassword,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        password: hashedPassword,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'music_lover',
        email: 'music@example.com',
        password: hashedPassword,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'comedy_fan',
        email: 'comedy@example.com',
        password: hashedPassword,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Use findOrCreate to make seeder idempotent
    for (const user of users) {
      await queryInterface.sequelize.query(
        `INSERT INTO "Users" ("username", "email", "password", "role", "createdAt", "updatedAt")
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT ("username") DO NOTHING`,
        {
          replacements: [
            user.username,
            user.email,
            user.password,
            user.role,
            user.createdAt,
            user.updatedAt
          ]
        }
      );
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
}; 