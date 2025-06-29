const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createSeatMap,
  getSeatMap,
  getSeatMapsByEvent,
  updateSeatMap,
  deleteSeatMap
} = require('../controllers/seatMapController');

// Public routes
router.get('/event/:eventId', getSeatMapsByEvent);
router.get('/:id', getSeatMap);

// Protected routes (admin only)
router.post('/', authenticateToken, createSeatMap);
router.put('/:id', authenticateToken, updateSeatMap);
router.delete('/:id', authenticateToken, deleteSeatMap);

module.exports = router; 