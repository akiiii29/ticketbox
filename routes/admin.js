const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const {
  getSystemOverview,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllOrders,
  getRevenueStats
} = require('../controllers/adminController');

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// System overview
router.get('/overview', getSystemOverview);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Order management
router.get('/orders', getAllOrders);

// Revenue statistics
router.get('/revenue', getRevenueStats);

module.exports = router; 