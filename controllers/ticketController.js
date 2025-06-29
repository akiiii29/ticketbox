const { Ticket, Order, SeatReservation, Seat, Event, User } = require('../models');
const { Op } = require('sequelize');

// Generate tickets for paid orders
const generateTickets = async (orderId) => {
  try {
    const order = await Order.findOne({
      where: { 
        id: orderId, 
        status: 'paid' 
      },
      include: [
        {
          model: SeatReservation,
          where: { status: 'confirmed' },
          include: [
            {
              model: Seat,
              attributes: ['id', 'label', 'section', 'row', 'number', 'price']
            }
          ]
        },
        {
          model: Event,
          attributes: ['id', 'title', 'date', 'venue', 'description']
        }
      ]
    });

    if (!order) {
      throw new Error('Order not found or not paid');
    }

    const tickets = [];

    // Generate a ticket for each seat reservation
    for (const reservation of order.SeatReservations) {
      const ticket = await Ticket.create({
        userId: order.userId,
        eventId: order.eventId,
        seatId: reservation.seatId,
        orderId: order.id,
        ticketNumber: generateTicketNumber(),
        status: 'active',
        seatInfo: {
          label: reservation.Seat.label,
          section: reservation.Seat.section,
          row: reservation.Seat.row,
          number: reservation.Seat.number,
          price: reservation.Seat.price
        }
      });

      tickets.push(ticket);
    }

    return tickets;
  } catch (error) {
    console.error('Generate tickets error:', error);
    throw error;
  }
};

// Generate unique ticket number
const generateTicketNumber = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `TKT-${timestamp}-${random}`.toUpperCase();
};

// Get user tickets
const getUserTickets = async (req, res) => {
  try {
    const userId = req.user.id;

    const tickets = await Ticket.findAll({
      where: { userId, status: 'active' },
      include: [
        {
          model: Event,
          attributes: ['id', 'title', 'date', 'venue', 'description']
        },
        {
          model: Seat,
          attributes: ['id', 'label', 'section', 'row', 'number', 'price']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(tickets);
  } catch (error) {
    console.error('Get user tickets error:', error);
    res.status(500).json({ error: 'Failed to get tickets' });
  }
};

// Get ticket by ID
const getTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const ticket = await Ticket.findOne({
      where: { id, userId, status: 'active' },
      include: [
        {
          model: Event,
          attributes: ['id', 'title', 'date', 'venue', 'description']
        },
        {
          model: Seat,
          attributes: ['id', 'label', 'section', 'row', 'number', 'price']
        },
        {
          model: User,
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Failed to get ticket' });
  }
};

// Get tickets by order ID
const getTicketsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const tickets = await Ticket.findAll({
      where: { orderId, userId, status: 'active' },
      include: [
        {
          model: Event,
          attributes: ['id', 'title', 'date', 'venue', 'description']
        },
        {
          model: Seat,
          attributes: ['id', 'label', 'section', 'row', 'number', 'price']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'No tickets found for this order' });
    }

    res.json(tickets);
  } catch (error) {
    console.error('Get tickets by order error:', error);
    res.status(500).json({ error: 'Failed to get tickets' });
  }
};

// Validate ticket (for entry)
const validateTicket = async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    const ticket = await Ticket.findOne({
      where: { 
        ticketNumber, 
        status: 'active' 
      },
      include: [
        {
          model: Event,
          attributes: ['id', 'title', 'date', 'venue']
        },
        {
          model: Seat,
          attributes: ['id', 'label', 'section', 'row', 'number']
        },
        {
          model: User,
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Invalid ticket' });
    }

    // Check if event has passed
    const eventDate = new Date(ticket.Event.date);
    if (eventDate < new Date()) {
      return res.status(400).json({ error: 'Event has already passed' });
    }

    // Mark ticket as used
    await ticket.update({ 
      status: 'used',
      usedAt: new Date()
    });

    res.json({
      message: 'Ticket validated successfully',
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        event: ticket.Event,
        seat: ticket.Seat,
        user: ticket.User
      }
    });
  } catch (error) {
    console.error('Validate ticket error:', error);
    res.status(500).json({ error: 'Failed to validate ticket' });
  }
};

// Cancel ticket
const cancelTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const ticket = await Ticket.findOne({
      where: { id, userId, status: 'active' },
      include: [{ model: Event }]
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check if event is in the future
    const eventDate = new Date(ticket.Event.date);
    if (eventDate <= new Date()) {
      return res.status(400).json({ error: 'Cannot cancel ticket for past events' });
    }

    // Update ticket status
    await ticket.update({ 
      status: 'cancelled',
      cancelledAt: new Date()
    });

    res.json({ message: 'Ticket cancelled successfully' });
  } catch (error) {
    console.error('Cancel ticket error:', error);
    res.status(500).json({ error: 'Failed to cancel ticket' });
  }
};

module.exports = {
  generateTickets,
  getUserTickets,
  getTicket,
  getTicketsByOrder,
  validateTicket,
  cancelTicket
}; 