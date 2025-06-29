# TicketBox API

A comprehensive ticket booking API built with Node.js, Express, and PostgreSQL using Sequelize ORM.

## Features

- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **Event Management**: CRUD operations for events with categories and pricing
- **Seat Map Management**: Dynamic seat map creation with JSON layout parsing
- **Seat Reservation**: Real-time seat reservation system with expiry
- **Order Management**: Complete order lifecycle from reservation to payment
- **Ticket Generation**: Automatic ticket generation after payment confirmation
- **Ticket Validation**: Entry validation system for events

## Database Schema

### Core Entities
- **Users**: User accounts with authentication
- **Events**: Event information with details and pricing
- **SeatMaps**: Venue layouts with JSON configuration
- **Seats**: Individual seats with pricing and status
- **SeatReservations**: Temporary seat holds with expiry
- **Orders**: Purchase orders with payment status
- **Tickets**: Generated tickets after payment confirmation

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get specific event
- `GET /api/events/search` - Search events
- `POST /api/events` - Create event (admin)
- `PUT /api/events/:id` - Update event (admin)
- `DELETE /api/events/:id` - Delete event (admin)

### Seat Maps
- `GET /api/seatmaps/:id` - Get seat map
- `GET /api/seatmaps/event/:eventId` - Get seat maps for event
- `POST /api/seatmaps` - Create seat map (admin)
- `PUT /api/seatmaps/:id` - Update seat map (admin)
- `DELETE /api/seatmaps/:id` - Delete seat map (admin)

### Bookings
- `GET /api/bookings/available/:eventId` - Get available seats
- `GET /api/bookings/my-reservations` - Get user reservations
- `POST /api/bookings/reserve` - Reserve seats
- `DELETE /api/bookings/reservation/:id` - Cancel reservation

### Orders
- `GET /api/orders/my-orders` - Get user orders
- `GET /api/orders/:id` - Get specific order
- `POST /api/orders` - Create order from reservations
- `PUT /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Cancel order

### Tickets
- `GET /api/tickets/validate/:ticketNumber` - Validate ticket (public)
- `GET /api/tickets/my-tickets` - Get user tickets
- `GET /api/tickets/:id` - Get specific ticket
- `GET /api/tickets/order/:orderId` - Get tickets by order
- `DELETE /api/tickets/:id` - Cancel ticket

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ticketbox-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=ticketbox_db
   DB_USER=postgres
   DB_PASSWORD=your_password

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

4. **Database Setup**
   ```bash
   # Create database
   createdb ticketbox_db

   # Run migrations
   npx sequelize-cli db:migrate

   # Seed demo data
   npx sequelize-cli db:seed:all
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## Demo Data

The seeder creates:
- **3 Events**: Rock Concert, Classical Symphony, Comedy Night
- **5 Users**: john_doe, jane_smith, admin, music_lover, comedy_fan
- **Seat Maps**: Different layouts for each event type
- **Sample Orders**: Some paid, some pending
- **Generated Tickets**: For paid orders

### Demo User Credentials
- **Email**: john@example.com, **Password**: password123
- **Email**: jane@example.com, **Password**: password123
- **Email**: admin@ticketbox.com, **Password**: password123

## Seat Map Layout Format

The API supports flexible seat map layouts using JSON:

```json
{
  "sections": [
    {
      "name": "A",
      "rows": [
        {
          "name": "1",
          "seats": [
            { "number": 1, "price": 200 },
            { "number": 2, "price": 200 }
          ]
        }
      ]
    }
  ]
}
```

## Booking Flow

1. **Browse Events**: Get available events and seat maps
2. **Reserve Seats**: Temporarily hold seats (15-minute expiry)
3. **Create Order**: Convert reservations to orders
4. **Payment**: Update order status to 'paid'
5. **Generate Tickets**: Automatic ticket generation after payment
6. **Entry**: Validate tickets at event entry

## Development

### Running Tests
```bash
npm test
```

### Database Reset
```bash
# Reset and reseed
npx sequelize-cli db:drop
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

### API Documentation
The API includes comprehensive error handling and validation. All endpoints return JSON responses with appropriate HTTP status codes.

## License

ISC License 