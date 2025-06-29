const { Event, SeatMap, Seat, User, Order } = require('../models');
const { Op } = require('sequelize');

// Get all events
const getAllEvents = async (req, res) => {
  try {
    console.log('Starting getAllEvents function');
    
    const events = await Event.findAll({
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'username', 'email']
        },
        {
          model: SeatMap,
          as: 'SeatMap',
          include: [
            {
              model: Seat,
              attributes: ['id', 'status']
            }
          ]
        }
      ],
      order: [['date', 'ASC']]
    });

    console.log(`Found ${events.length} events`);

    // Add seat availability info
    const eventsWithAvailability = events.map(event => {
      let totalSeats = 0;
      let availableSeats = 0;
      if (event.SeatMap && event.SeatMap.Seats) {
        totalSeats = event.SeatMap.Seats.length;
        availableSeats = event.SeatMap.Seats.filter(seat => seat.status === 'available').length;
      }
      return {
        ...event.toJSON(),
        seatAvailability: {
          total: totalSeats,
          available: availableSeats,
          sold: totalSeats - availableSeats
        }
      };
    });

    console.log('Successfully processed events with availability');
    res.json(eventsWithAvailability);
  } catch (error) {
    console.error('Get all events error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ error: 'Failed to get events' });
  }
};

// Get event by ID
const getEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'username', 'email']
        },
        {
          model: SeatMap,
          as: 'SeatMap',
          include: [
            {
              model: Seat,
              attributes: ['id', 'label', 'section', 'row', 'number', 'price', 'status']
            }
          ]
        }
      ]
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to get event' });
  }
};

// Create event (requires organizer or admin role)
const createEvent = async (req, res) => {
  try {
    const { title, description, date, venue, category, price } = req.body;
    const organizerId = req.user.id; // Get organizer from authenticated user

    // Check if user can create events (organizer or admin)
    if (!req.user.isOrganizer()) {
      return res.status(403).json({ error: 'Organizer or admin role required to create events' });
    }

    const event = await Event.create({
      title,
      description,
      date,
      venue,
      category,
      price,
      organizerId
    });

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

// Update event (organizer can update their own events, admin can update any event)
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Admin can update any event, organizer can only update their own
    if (!req.user.isAdmin() && event.organizerId !== userId) {
      return res.status(403).json({ error: 'Only the organizer or admin can update this event' });
    }

    await event.update(updateData);

    res.json({
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

// Delete event (organizer can delete their own events, admin can delete any event)
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Admin can delete any event, organizer can only delete their own
    if (!req.user.isAdmin() && event.organizerId !== userId) {
      return res.status(403).json({ error: 'Only the organizer or admin can delete this event' });
    }

    await event.destroy();

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

// Get events by organizer (admin can view any organizer's events)
const getEventsByOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const userId = req.user.id;

    // Admin can view any organizer's events, users can only see their own
    if (!req.user.isAdmin() && organizerId != userId) {
      return res.status(403).json({ error: 'You can only view your own events' });
    }

    const events = await Event.findAll({
      where: { organizerId },
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'username', 'email']
        },
        {
          model: SeatMap,
          as: 'SeatMap',
          include: [
            {
              model: Seat,
              attributes: ['id', 'status']
            }
          ]
        }
      ],
      order: [['date', 'ASC']]
    });

    res.json(events);
  } catch (error) {
    console.error('Get events by organizer error:', error);
    res.status(500).json({ error: 'Failed to get organizer events' });
  }
};

// Admin: Get all events with detailed information
const getAllEventsAdmin = async (req, res) => {
  try {
    const events = await Event.findAll({
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'username', 'email', 'role']
        },
        {
          model: SeatMap,
          as: 'SeatMap',
          include: [
            {
              model: Seat,
              attributes: ['id', 'status']
            }
          ]
        },
        {
          model: Order,
          attributes: ['id', 'status', 'totalAmount']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(events);
  } catch (error) {
    console.error('Get all events admin error:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
};

// Search events
const searchEvents = async (req, res) => {
  try {
    const { q, category, dateFrom, dateTo } = req.query;
    const whereClause = {};

    if (q) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
        { venue: { [Op.iLike]: `%${q}%` } }
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) whereClause.date[Op.gte] = new Date(dateFrom);
      if (dateTo) whereClause.date[Op.lte] = new Date(dateTo);
    }

    const events = await Event.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'username', 'email']
        },
        {
          model: SeatMap,
          as: 'SeatMap',
          include: [
            {
              model: Seat,
              attributes: ['id', 'status']
            }
          ]
        }
      ],
      order: [['date', 'ASC']]
    });

    res.json(events);
  } catch (error) {
    console.error('Search events error:', error);
    res.status(500).json({ error: 'Failed to search events' });
  }
};

module.exports = {
  getAllEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsByOrganizer,
  getAllEventsAdmin,
  searchEvents
}; 