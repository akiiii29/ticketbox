const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder
} = require('../controllers/orderController');

// All routes require authentication
router.use(authenticateToken);

// Get user's orders
router.get('/my-orders', getUserOrders);

// Get specific order
router.get('/:id', getOrder);

// Create order from reservations
router.post('/', createOrder);

// Update order status (for payment processing)
router.put('/:id/status', updateOrderStatus);

// Cancel order
router.delete('/:id', cancelOrder);

module.exports = router; 