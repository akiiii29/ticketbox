const { SeatMap, Seat, Event } = require('../models');

// Parse layout JSON and create seats
const parseLayoutAndCreateSeats = async (seatMapId, layoutJson) => {
  try {
    const seats = [];
    
    // Parse the layout JSON structure
    // Expected format: { sections: [{ name: "A", rows: [{ name: "1", seats: [{ number: 1, price: 100 }] }] }] }
    
    if (!layoutJson.sections || !Array.isArray(layoutJson.sections)) {
      throw new Error('Invalid layout format: sections array required');
    }

    for (const section of layoutJson.sections) {
      if (!section.rows || !Array.isArray(section.rows)) {
        continue;
      }

      for (const row of section.rows) {
        if (!row.seats || !Array.isArray(row.seats)) {
          continue;
        }

        for (const seat of row.seats) {
          seats.push({
            seatMapId,
            label: `${section.name}${row.name}-${seat.number}`,
            section: section.name,
            row: row.name,
            number: seat.number,
            price: seat.price || 0,
            status: 'available'
          });
        }
      }
    }

    // Bulk create seats
    if (seats.length > 0) {
      await Seat.bulkCreate(seats);
    }

    return seats.length;
  } catch (error) {
    console.error('Error parsing layout:', error);
    throw error;
  }
};

// Create seat map with layout
const createSeatMap = async (req, res) => {
  try {
    const { eventId, name, layoutJson } = req.body;

    // Validate event exists
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Create seat map
    const seatMap = await SeatMap.create({
      eventId,
      name,
      layoutJson
    });

    // Parse layout and create seats
    const seatsCreated = await parseLayoutAndCreateSeats(seatMap.id, layoutJson);

    res.status(201).json({
      message: 'Seat map created successfully',
      seatMap: {
        id: seatMap.id,
        eventId: seatMap.eventId,
        name: seatMap.name,
        seatsCreated
      }
    });
  } catch (error) {
    console.error('Create seat map error:', error);
    res.status(500).json({ error: 'Failed to create seat map' });
  }
};

// Get seat map by ID with seats
const getSeatMap = async (req, res) => {
  try {
    const { id } = req.params;

    const seatMap = await SeatMap.findByPk(id, {
      include: [
        {
          model: Seat,
          attributes: ['id', 'label', 'section', 'row', 'number', 'price', 'status']
        },
        {
          model: Event,
          attributes: ['id', 'title', 'date']
        }
      ]
    });

    if (!seatMap) {
      return res.status(404).json({ error: 'Seat map not found' });
    }

    res.json(seatMap);
  } catch (error) {
    console.error('Get seat map error:', error);
    res.status(500).json({ error: 'Failed to get seat map' });
  }
};

// Get all seat maps for an event
const getSeatMapsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const seatMaps = await SeatMap.findAll({
      where: { eventId },
      include: [
        {
          model: Seat,
          attributes: ['id', 'label', 'section', 'row', 'number', 'price', 'status']
        }
      ]
    });

    res.json(seatMaps);
  } catch (error) {
    console.error('Get seat maps error:', error);
    res.status(500).json({ error: 'Failed to get seat maps' });
  }
};

// Update seat map
const updateSeatMap = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, layoutJson } = req.body;

    const seatMap = await SeatMap.findByPk(id);
    if (!seatMap) {
      return res.status(404).json({ error: 'Seat map not found' });
    }

    // If layout is being updated, delete existing seats and recreate
    if (layoutJson) {
      await Seat.destroy({ where: { seatMapId: id } });
      await parseLayoutAndCreateSeats(id, layoutJson);
    }

    // Update seat map
    await seatMap.update({ name, layoutJson });

    res.json({
      message: 'Seat map updated successfully',
      seatMap
    });
  } catch (error) {
    console.error('Update seat map error:', error);
    res.status(500).json({ error: 'Failed to update seat map' });
  }
};

// Delete seat map
const deleteSeatMap = async (req, res) => {
  try {
    const { id } = req.params;

    const seatMap = await SeatMap.findByPk(id);
    if (!seatMap) {
      return res.status(404).json({ error: 'Seat map not found' });
    }

    // Delete associated seats first
    await Seat.destroy({ where: { seatMapId: id } });
    
    // Delete seat map
    await seatMap.destroy();

    res.json({ message: 'Seat map deleted successfully' });
  } catch (error) {
    console.error('Delete seat map error:', error);
    res.status(500).json({ error: 'Failed to delete seat map' });
  }
};

module.exports = {
  createSeatMap,
  getSeatMap,
  getSeatMapsByEvent,
  updateSeatMap,
  deleteSeatMap,
  parseLayoutAndCreateSeats
}; 