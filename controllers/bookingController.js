const { Seat, SeatReservation, User, Order, Event, SeatMap } = require('../models');
const { Op } = require('sequelize');

// Reserve seats
const reserveSeats = async (req, res) => {
  try {
    const { seatIds } = req.body;
    const userId = req.user.id;

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ error: 'Seat IDs are required' });
    }

    // Check if seats exist and are available
    const seats = await Seat.findAll({
      where: {
        id: { [Op.in]: seatIds },
        status: 'available'
      }
    });

    if (seats.length !== seatIds.length) {
      return res.status(400).json({ error: 'Some seats are not available' });
    }

    // Check if seats are already reserved
    const existingReservations = await SeatReservation.findAll({
      where: {
        seatId: { [Op.in]: seatIds },
        status: 'reserved',
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    if (existingReservations.length > 0) {
      return res.status(400).json({ error: 'Some seats are already reserved' });
    }

    // Create reservations (15 minutes expiry)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const reservations = seatIds.map(seatId => ({
      seatId,
      userId,
      status: 'reserved',
      expiresAt
    }));

    await SeatReservation.bulkCreate(reservations);

    // Update seat status to reserved
    await Seat.update(
      { status: 'reserved' },
      { where: { id: { [Op.in]: seatIds } } }
    );

    res.status(201).json({
      message: 'Seats reserved successfully',
      reservations: reservations.map(r => ({ seatId: r.seatId, expiresAt: r.expiresAt }))
    });
  } catch (error) {
    console.error('Reserve seats error:', error);
    res.status(500).json({ error: 'Failed to reserve seats' });
  }
};

// Get available seats for an event
const getAvailableSeats = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get seat map for the event
    const seatMap = await SeatMap.findOne({
      where: { eventId },
      include: [
        {
          model: Seat,
          where: {
            status: 'available'
          },
          include: [
            {
              model: SeatReservation,
              where: {
                status: 'reserved',
                expiresAt: { [Op.gt]: new Date() }
              },
              required: false
            }
          ]
        }
      ]
    });

    if (!seatMap) {
      return res.status(404).json({ error: 'Seat map not found for this event' });
    }

    // Filter out seats that have active reservations
    const availableSeats = seatMap.Seats.filter(seat => 
      seat.status === 'available' && (!seat.SeatReservations || seat.SeatReservations.length === 0)
    );

    res.json({
      eventId,
      seatMapId: seatMap.id,
      availableSeats: availableSeats.map(seat => ({
        id: seat.id,
        label: seat.label,
        section: seat.section,
        row: seat.row,
        number: seat.number,
        price: seat.price
      }))
    });
  } catch (error) {
    console.error('Get available seats error:', error);
    res.status(500).json({ error: 'Failed to get available seats' });
  }
};

// Cancel seat reservation
const cancelReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const userId = req.user.id;

    const reservation = await SeatReservation.findOne({
      where: {
        id: reservationId,
        userId,
        status: 'reserved'
      },
      include: [{ model: Seat }]
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Update reservation status
    await reservation.update({ status: 'cancelled' });

    // Update seat status back to available
    await reservation.Seat.update({ status: 'available' });

    res.json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({ error: 'Failed to cancel reservation' });
  }
};

// Get user's active reservations
const getUserReservations = async (req, res) => {
  try {
    const userId = req.user.id;

    const reservations = await SeatReservation.findAll({
      where: {
        userId,
        status: 'reserved',
        expiresAt: { [Op.gt]: new Date() }
      },
      include: [
        {
          model: Seat,
          include: [
            {
              model: SeatMap,
              include: [{ model: Event }]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(reservations);
  } catch (error) {
    console.error('Get user reservations error:', error);
    res.status(500).json({ error: 'Failed to get reservations' });
  }
};

// Clean up expired reservations (cron job or manual call)
const cleanupExpiredReservations = async () => {
  try {
    const expiredReservations = await SeatReservation.findAll({
      where: {
        status: 'reserved',
        expiresAt: { [Op.lt]: new Date() }
      },
      include: [{ model: Seat }]
    });

    for (const reservation of expiredReservations) {
      await reservation.update({ status: 'expired' });
      await reservation.Seat.update({ status: 'available' });
    }

    console.log(`Cleaned up ${expiredReservations.length} expired reservations`);
  } catch (error) {
    console.error('Cleanup expired reservations error:', error);
  }
};

module.exports = {
  reserveSeats,
  getAvailableSeats,
  cancelReservation,
  getUserReservations,
  cleanupExpiredReservations
}; 