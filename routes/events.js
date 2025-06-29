const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const {
  getAllEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsByOrganizer,
  getAllEventsAdmin,
  searchEvents
} = require('../controllers/eventController');

// Public routes
router.get('/', getAllEvents);
router.get('/search', searchEvents);
router.get('/:id', getEvent);

// Protected routes (require authentication)
router.post('/', authenticateToken, createEvent);
router.put('/:id', authenticateToken, updateEvent);
router.delete('/:id', authenticateToken, deleteEvent);
router.get('/organizer/:organizerId', authenticateToken, getEventsByOrganizer);

// Admin routes
router.get('/admin/all', authenticateToken, requireAdmin, getAllEventsAdmin);

module.exports = router; 