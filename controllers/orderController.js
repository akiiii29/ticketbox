const { Order, SeatReservation, Seat, Event, User } = require('../models');
const { Op } = require('sequelize');
const { generateTickets } = require('./ticketController');

// Create order from reservations
const createOrder = async (req, res) => {
  try {
    const { reservationIds } = req.body;
    const userId = req.user.id;

    if (!reservationIds || !Array.isArray(reservationIds) || reservationIds.length === 0) {
      return res.status(400).json({ error: 'Reservation IDs are required' });
    }

    // Get active reservations
    const reservations = await SeatReservation.findAll({
      where: {
        id: { [Op.in]: reservationIds },
        userId,
        status: 'reserved',
        expiresAt: { [Op.gt]: new Date() }
      },
      include: [
        {
          model: Seat,
          include: [{ model: SeatMap }]
        }
      ]
    });

    if (reservations.length !== reservationIds.length) {
      return res.status(400).json({ error: 'Some reservations are not valid or expired' });
    }

    // Group reservations by event
    const reservationsByEvent = {};
    reservations.forEach(reservation => {
      const eventId = reservation.Seat.SeatMap.eventId;
      if (!reservationsByEvent[eventId]) {
        reservationsByEvent[eventId] = [];
      }
      reservationsByEvent[eventId].push(reservation);
    });

    const orders = [];

    // Create orders for each event
    for (const [eventId, eventReservations] of Object.entries(reservationsByEvent)) {
      const totalAmount = eventReservations.reduce((sum, res) => sum + parseFloat(res.Seat.price), 0);

      const order = await Order.create({
        userId,
        eventId: parseInt(eventId),
        quantity: eventReservations.length,
        status: 'pending',
        totalAmount
      });

      // Update reservations with order ID
      await SeatReservation.update(
        { orderId: order.id },
        { where: { id: { [Op.in]: eventReservations.map(r => r.id) } } }
      );

      orders.push(order);
    }

    res.status(201).json({
      message: 'Orders created successfully',
      orders: orders.map(order => ({
        id: order.id,
        eventId: order.eventId,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
        status: order.status
      }))
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// Get user orders
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.findAll({
      where: { userId },
      include: [
        {
          model: Event,
          attributes: ['id', 'title', 'date', 'venue']
        },
        {
          model: SeatReservation,
          include: [
            {
              model: Seat,
              attributes: ['id', 'label', 'section', 'row', 'number', 'price']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
};

// Get order by ID
const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      where: { id, userId },
      include: [
        {
          model: Event,
          attributes: ['id', 'title', 'date', 'venue', 'description']
        },
        {
          model: SeatReservation,
          include: [
            {
              model: Seat,
              attributes: ['id', 'label', 'section', 'row', 'number', 'price']
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
};

// Update order status (for payment processing)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: SeatReservation,
          include: [{ model: Seat }]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order status
    await order.update({ status });

    // If order is paid, update seat status to sold and generate tickets
    if (status === 'paid') {
      const seatIds = order.SeatReservations.map(res => res.seatId);
      
      await Seat.update(
        { status: 'sold' },
        { where: { id: { [Op.in]: seatIds } } }
      );

      await SeatReservation.update(
        { status: 'confirmed' },
        { where: { orderId: order.id } }
      );

      // Generate tickets for the paid order
      try {
        const tickets = await generateTickets(order.id);
        console.log(`Generated ${tickets.length} tickets for order ${order.id}`);
      } catch (ticketError) {
        console.error('Failed to generate tickets:', ticketError);
        // Don't fail the order update if ticket generation fails
      }
    }

    res.json({
      message: 'Order status updated successfully',
      order: {
        id: order.id,
        status: order.status,
        eventId: order.eventId,
        quantity: order.quantity,
        totalAmount: order.totalAmount
      }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      where: { id, userId, status: 'pending' },
      include: [
        {
          model: SeatReservation,
          include: [{ model: Seat }]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or cannot be cancelled' });
    }

    // Update order status
    await order.update({ status: 'cancelled' });

    // Update seat reservations
    await SeatReservation.update(
      { status: 'cancelled' },
      { where: { orderId: order.id } }
    );

    // Update seat status back to available
    const seatIds = order.SeatReservations.map(res => res.seatId);
    await Seat.update(
      { status: 'available' },
      { where: { id: { [Op.in]: seatIds } } }
    );

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder
}; 