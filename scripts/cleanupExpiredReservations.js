const { SeatReservation, Seat } = require('../models');
const { Op } = require('sequelize');

async function cleanupExpiredReservations() {
  try {
    console.log('Starting cleanup of expired reservations...');
    
    const expiredReservations = await SeatReservation.findAll({
      where: {
        status: 'reserved',
        expiresAt: { [Op.lt]: new Date() }
      },
      include: [{ model: Seat }]
    });

    console.log(`Found ${expiredReservations.length} expired reservations`);

    for (const reservation of expiredReservations) {
      // Update reservation status to expired
      await reservation.update({ status: 'expired' });
      
      // Update seat status back to available
      await reservation.Seat.update({ status: 'available' });
      
      console.log(`Cleaned up reservation ${reservation.id} for seat ${reservation.Seat.label}`);
    }

    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupExpiredReservations()
    .then(() => {
      console.log('Cleanup script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Cleanup script failed:', error);
      process.exit(1);
    });
}

module.exports = cleanupExpiredReservations; 