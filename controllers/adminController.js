const { User, Event, Order, Ticket, SeatReservation } = require('../models');
const { Op, Sequelize } = require('sequelize');

// Get system overview (admin only)
const getSystemOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalEvents,
      totalOrders,
      totalTickets,
      activeReservations
    ] = await Promise.all([
      User.count(),
      Event.count(),
      Order.count(),
      Ticket.count(),
      SeatReservation.count({
        where: {
          status: 'reserved',
          expiresAt: { [Op.gt]: new Date() }
        }
      })
    ]);

    // Get revenue statistics
    const revenueStats = await Order.findAll({
      where: { status: 'paid' },
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalRevenue'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalPaidOrders']
      ]
    });

    const totalRevenue = revenueStats[0]?.dataValues?.totalRevenue || 0;
    const totalPaidOrders = revenueStats[0]?.dataValues?.totalPaidOrders || 0;

    res.json({
      overview: {
        totalUsers,
        totalEvents,
        totalOrders,
        totalTickets,
        activeReservations,
        totalRevenue: parseFloat(totalRevenue),
        totalPaidOrders
      }
    });
  } catch (error) {
    console.error('Get system overview error:', error);
    res.status(500).json({ error: 'Failed to get system overview' });
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'createdAt'],
      include: [
        {
          model: Event,
          as: 'organizedEvents',
          attributes: ['id', 'title']
        },
        {
          model: Order,
          attributes: ['id', 'status', 'totalAmount']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

// Update user role (admin only)
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from removing their own admin role
    if (user.id === req.user.id && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot remove your own admin role' });
    }

    await user.update({ role });

    res.json({
      message: 'User role updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Get all orders (admin only)
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'email']
        },
        {
          model: Event,
          attributes: ['id', 'title', 'venue']
        },
        {
          model: SeatReservation,
          include: [
            {
              model: Seat,
              attributes: ['id', 'label', 'price']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
};

// Get revenue statistics (admin only)
const getRevenueStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const whereClause = { status: 'paid' };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: Event,
          attributes: ['id', 'title', 'category']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Group by date and category
    const revenueByDate = {};
    const revenueByCategory = {};

    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      const category = order.Event?.category || 'Unknown';

      // Revenue by date
      if (!revenueByDate[date]) {
        revenueByDate[date] = 0;
      }
      revenueByDate[date] += parseFloat(order.totalAmount);

      // Revenue by category
      if (!revenueByCategory[category]) {
        revenueByCategory[category] = 0;
      }
      revenueByCategory[category] += parseFloat(order.totalAmount);
    });

    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

    res.json({
      totalRevenue,
      totalOrders: orders.length,
      revenueByDate,
      revenueByCategory
    });
  } catch (error) {
    console.error('Get revenue stats error:', error);
    res.status(500).json({ error: 'Failed to get revenue statistics' });
  }
};

module.exports = {
  getSystemOverview,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllOrders,
  getRevenueStats
}; 