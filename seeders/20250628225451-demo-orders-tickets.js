'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Get existing data
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM "Users" LIMIT 3;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const events = await queryInterface.sequelize.query(
      'SELECT id FROM "Events" LIMIT 2;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const seats = await queryInterface.sequelize.query(
      'SELECT id, price FROM "Seats" WHERE status = \'available\' LIMIT 10;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0 || events.length === 0 || seats.length === 0) {
      console.log('No users, events, or seats found. Skipping demo orders.');
      return;
    }

    // Create some seat reservations
    const reservations = [];
    for (let i = 0; i < 5; i++) {
      const seat = seats[i];
      const user = users[i % users.length];
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
      
      reservations.push({
        seatId: seat.id,
        userId: user.id,
        status: 'reserved',
        expiresAt: expiresAt,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Use raw SQL with ON CONFLICT to make seeder idempotent for reservations
    const createdReservations = [];
    for (const reservation of reservations) {
      const [result] = await queryInterface.sequelize.query(
        `INSERT INTO "SeatReservations" ("seatId", "userId", "status", "expiresAt", "createdAt", "updatedAt")
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT ("seatId", "userId") DO NOTHING
         RETURNING *`,
        {
          replacements: [
            reservation.seatId,
            reservation.userId,
            reservation.status,
            reservation.expiresAt,
            reservation.createdAt,
            reservation.updatedAt
          ]
        }
      );
      if (result && result.length > 0) {
        createdReservations.push(result[0]);
      }
    }

    // Create orders
    const orders = [];
    for (let i = 0; i < 3; i++) {
      const user = users[i];
      const event = events[i % events.length];
      const userReservations = createdReservations.filter(r => r.userId === user.id);
      
      if (userReservations.length > 0) {
        const totalAmount = userReservations.reduce((sum, res) => {
          const seat = seats.find(s => s.id === res.seatId);
          return sum + parseFloat(seat.price);
        }, 0);

        orders.push({
          userId: user.id,
          eventId: event.id,
          quantity: userReservations.length,
          totalAmount: totalAmount,
          status: i === 0 ? 'paid' : 'pending', // First order is paid
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Use raw SQL with ON CONFLICT to make seeder idempotent for orders
    const createdOrders = [];
    for (const order of orders) {
      const [result] = await queryInterface.sequelize.query(
        `INSERT INTO "Orders" ("userId", "eventId", "quantity", "totalAmount", "status", "createdAt", "updatedAt")
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT ("userId", "eventId") DO NOTHING
         RETURNING *`,
        {
          replacements: [
            order.userId,
            order.eventId,
            order.quantity,
            order.totalAmount,
            order.status,
            order.createdAt,
            order.updatedAt
          ]
        }
      );
      if (result && result.length > 0) {
        createdOrders.push(result[0]);
      }
    }

    // Update reservations with order IDs
    for (let i = 0; i < createdOrders.length; i++) {
      const order = createdOrders[i];
      const userReservations = createdReservations.filter(r => r.userId === order.userId);
      
      await queryInterface.sequelize.query(
        'UPDATE "SeatReservations" SET "orderId" = ?, "status" = ? WHERE id IN (?)',
        {
          replacements: [
            order.id,
            order.status === 'paid' ? 'confirmed' : 'reserved',
            userReservations.map(r => r.id)
          ]
        }
      );

      // Update seat status
      const seatIds = userReservations.map(r => r.seatId);
      await queryInterface.sequelize.query(
        'UPDATE "Seats" SET status = ? WHERE id IN (?)',
        {
          replacements: [
            order.status === 'paid' ? 'sold' : 'reserved',
            seatIds
          ]
        }
      );
    }

    // Generate tickets for paid orders
    const tickets = [];
    const paidOrders = createdOrders.filter(order => order.status === 'paid');
    
    for (const order of paidOrders) {
      const userReservations = createdReservations.filter(r => r.userId === order.userId);
      
      for (const reservation of userReservations) {
        const seat = seats.find(s => s.id === reservation.seatId);
        const ticketNumber = `TKT-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
        
        tickets.push({
          userId: order.userId,
          eventId: order.eventId,
          seatId: reservation.seatId,
          orderId: order.id,
          ticketNumber: ticketNumber,
          status: 'active',
          seatInfo: JSON.stringify({
            label: `Seat-${reservation.seatId}`,
            section: 'Demo',
            row: '1',
            number: reservation.seatId,
            price: seat.price
          }),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Use raw SQL with ON CONFLICT to make seeder idempotent for tickets
    if (tickets.length > 0) {
      for (const ticket of tickets) {
        await queryInterface.sequelize.query(
          `INSERT INTO "Tickets" ("userId", "eventId", "seatId", "orderId", "ticketNumber", "status", "seatInfo", "createdAt", "updatedAt")
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT ("ticketNumber") DO NOTHING`,
          {
            replacements: [
              ticket.userId,
              ticket.eventId,
              ticket.seatId,
              ticket.orderId,
              ticket.ticketNumber,
              ticket.status,
              ticket.seatInfo,
              ticket.createdAt,
              ticket.updatedAt
            ]
          }
        );
      }
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Tickets', null, {});
    await queryInterface.bulkDelete('SeatReservations', null, {});
    await queryInterface.bulkDelete('Orders', null, {});
  }
}; 