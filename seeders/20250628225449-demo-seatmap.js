'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Get existing events first
    const events = await queryInterface.sequelize.query(
      'SELECT id, title FROM "Events" ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (events.length === 0) {
      console.log('No events found. Please run the events seeder first.');
      return;
    }

    // Create seat maps for each event
    const seatMaps = [];
    for (let i = 0; i < events.length; i++) {
      const eventId = events[i].id;
      
      // Different layout for each event
      let layoutJson;
      if (i === 0) { // Rock Concert - large venue
        layoutJson = {
          sections: [
            {
              name: "A",
              rows: [
                { name: "1", seats: Array.from({length: 20}, (_, j) => ({ number: j + 1, price: 200 })) },
                { name: "2", seats: Array.from({length: 20}, (_, j) => ({ number: j + 1, price: 180 })) },
                { name: "3", seats: Array.from({length: 20}, (_, j) => ({ number: j + 1, price: 160 })) }
              ]
            },
            {
              name: "B",
              rows: [
                { name: "1", seats: Array.from({length: 25}, (_, j) => ({ number: j + 1, price: 150 })) },
                { name: "2", seats: Array.from({length: 25}, (_, j) => ({ number: j + 1, price: 140 })) },
                { name: "3", seats: Array.from({length: 25}, (_, j) => ({ number: j + 1, price: 130 })) },
                { name: "4", seats: Array.from({length: 25}, (_, j) => ({ number: j + 1, price: 120 })) }
              ]
            },
            {
              name: "C",
              rows: [
                { name: "1", seats: Array.from({length: 30}, (_, j) => ({ number: j + 1, price: 100 })) },
                { name: "2", seats: Array.from({length: 30}, (_, j) => ({ number: j + 1, price: 90 })) },
                { name: "3", seats: Array.from({length: 30}, (_, j) => ({ number: j + 1, price: 80 })) },
                { name: "4", seats: Array.from({length: 30}, (_, j) => ({ number: j + 1, price: 70 })) },
                { name: "5", seats: Array.from({length: 30}, (_, j) => ({ number: j + 1, price: 60 })) }
              ]
            }
          ]
        };
      } else if (i === 1) { // Classical - intimate venue
        layoutJson = {
          sections: [
            {
              name: "Orchestra",
              rows: [
                { name: "A", seats: Array.from({length: 15}, (_, j) => ({ number: j + 1, price: 250 })) },
                { name: "B", seats: Array.from({length: 15}, (_, j) => ({ number: j + 1, price: 230 })) },
                { name: "C", seats: Array.from({length: 15}, (_, j) => ({ number: j + 1, price: 210 })) },
                { name: "D", seats: Array.from({length: 15}, (_, j) => ({ number: j + 1, price: 190 })) }
              ]
            },
            {
              name: "Balcony",
              rows: [
                { name: "1", seats: Array.from({length: 20}, (_, j) => ({ number: j + 1, price: 180 })) },
                { name: "2", seats: Array.from({length: 20}, (_, j) => ({ number: j + 1, price: 160 })) },
                { name: "3", seats: Array.from({length: 20}, (_, j) => ({ number: j + 1, price: 140 })) }
              ]
            }
          ]
        };
      } else { // Comedy - small venue
        layoutJson = {
          sections: [
            {
              name: "Main Floor",
              rows: [
                { name: "1", seats: Array.from({length: 10}, (_, j) => ({ number: j + 1, price: 100 })) },
                { name: "2", seats: Array.from({length: 10}, (_, j) => ({ number: j + 1, price: 90 })) },
                { name: "3", seats: Array.from({length: 10}, (_, j) => ({ number: j + 1, price: 80 })) }
              ]
            },
            {
              name: "VIP",
              rows: [
                { name: "1", seats: Array.from({length: 5}, (_, j) => ({ number: j + 1, price: 150 })) }
              ]
            }
          ]
        };
      }

      seatMaps.push({
        eventId: eventId,
        name: `Seat Map for ${events[i].title}`,
        layoutJson: JSON.stringify(layoutJson),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Use raw SQL with ON CONFLICT to make seeder idempotent for seat maps
    for (const seatMap of seatMaps) {
      await queryInterface.sequelize.query(
        `INSERT INTO "SeatMaps" ("eventId", "name", "layoutJson", "createdAt", "updatedAt")
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT ("eventId") DO NOTHING`,
        {
          replacements: [
            seatMap.eventId,
            seatMap.name,
            seatMap.layoutJson,
            seatMap.createdAt,
            seatMap.updatedAt
          ]
        }
      );
    }
    
    // Get the created seat maps with their IDs
    const insertedSeatMaps = await queryInterface.sequelize.query(
      'SELECT id, "layoutJson"::text as "layoutJson" FROM "SeatMaps" ORDER BY id DESC LIMIT :limit',
      { 
        replacements: { limit: seatMaps.length },
        type: Sequelize.QueryTypes.SELECT 
      }
    );

    // Create seats for each seat map
    const seats = [];
    for (const seatMap of insertedSeatMaps) {
      const layout = JSON.parse(seatMap.layoutJson);
      
      for (const section of layout.sections) {
        for (const row of section.rows) {
          for (const seat of row.seats) {
            seats.push({
              seatMapId: seatMap.id,
              label: `${section.name}${row.name}-${seat.number}`,
              section: section.name,
              row: row.name,
              number: seat.number,
              price: seat.price,
              status: 'available',
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      }
    }

    // Use raw SQL with ON CONFLICT to make seeder idempotent for seats
    if (seats.length > 0) {
      for (const seat of seats) {
        await queryInterface.sequelize.query(
          `INSERT INTO "Seats" ("seatMapId", "label", "section", "row", "number", "price", "status", "createdAt", "updatedAt")
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT ("label") DO NOTHING`,
          {
            replacements: [
              seat.seatMapId,
              seat.label,
              seat.section,
              seat.row,
              seat.number,
              seat.price,
              seat.status,
              seat.createdAt,
              seat.updatedAt
            ]
          }
        );
      }
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Seats', null, {});
    await queryInterface.bulkDelete('SeatMaps', null, {});
  }
};
