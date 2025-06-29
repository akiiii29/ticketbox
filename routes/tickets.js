const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getUserTickets,
  getTicket,
  getTicketsByOrder,
  validateTicket,
  cancelTicket
} = require('../controllers/ticketController');

// Public route for ticket validation (for entry)
router.get('/validate/:ticketNumber', validateTicket);

// Protected routes
router.use(authenticateToken);

// Get user's tickets
router.get('/my-tickets', getUserTickets);

// Get specific ticket
router.get('/:id', getTicket);

// Get tickets by order
router.get('/order/:orderId', getTicketsByOrder);

// Cancel ticket
router.delete('/:id', cancelTicket);

module.exports = router; 