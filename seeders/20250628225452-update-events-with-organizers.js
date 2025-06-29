'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Get the first organizer user
    const organizer = await queryInterface.sequelize.query(
      'SELECT id FROM "Users" WHERE role = \'organizer\' LIMIT 1;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (organizer.length > 0) {
      const organizerId = organizer[0].id;
      
      // Update all events that don't have an organizer
      await queryInterface.sequelize.query(
        'UPDATE "Events" SET "organizerId" = ? WHERE "organizerId" IS NULL',
        {
          replacements: [organizerId]
        }
      );
    }
  },

  async down (queryInterface, Sequelize) {
    // Remove organizer from all events
    await queryInterface.sequelize.query(
      'UPDATE "Events" SET "organizerId" = NULL'
    );
  }
}; 