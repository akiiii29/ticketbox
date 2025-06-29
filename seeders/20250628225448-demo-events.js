'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Create demo events without organizer initially
    const events = [
      {
        id: 1,
        title: 'Rock Concert 2024',
        description: 'An amazing rock concert featuring top artists',
        date: new Date('2024-12-15T19:00:00Z'),
        venue: 'Madison Square Garden',
        category: 'Concert',
        price: 150.00,
        organizerId: null, // Will be updated later
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        title: 'Classical Symphony',
        description: 'Beethoven Symphony No. 9 performed by the City Orchestra',
        date: new Date('2024-11-20T20:00:00Z'),
        venue: 'Carnegie Hall',
        category: 'Classical',
        price: 200.00,
        organizerId: null, // Will be updated later
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        title: 'Comedy Night',
        description: 'Stand-up comedy featuring famous comedians',
        date: new Date('2024-10-25T21:00:00Z'),
        venue: 'Comedy Club Downtown',
        category: 'Comedy',
        price: 75.00,
        organizerId: null, // Will be updated later
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Use raw SQL with ON CONFLICT to make seeder idempotent
    for (const event of events) {
      await queryInterface.sequelize.query(
        `INSERT INTO "Events" ("id", "title", "description", "date", "venue", "category", "price", "organizerId", "createdAt", "updatedAt")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT ("id") DO NOTHING`,
        {
          replacements: [
            event.id,
            event.title,
            event.description,
            event.date,
            event.venue,
            event.category,
            event.price,
            event.organizerId,
            event.createdAt,
            event.updatedAt
          ]
        }
      );
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Events', null, {});
  }
}; 