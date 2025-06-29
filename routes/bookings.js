const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  reserveSeats,
  getAvailableSeats,
  cancelReservation,
  getUserReservations
} = require('../controllers/bookingController');

// All routes require authentication
router.use(authenticateToken);

// Get available seats for an event
router.get('/available/:eventId', getAvailableSeats);

// Get user's active reservations
router.get('/my-reservations', getUserReservations);

// Reserve seats
router.post('/reserve', reserveSeats);

// Cancel reservation
router.delete('/reservation/:reservationId', cancelReservation);

module.exports = router; 