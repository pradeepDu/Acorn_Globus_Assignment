# Court Booking Platform

A full-stack court booking system for sports facilities with multi-resource bookings, dynamic pricing engine, and admin management.

## Features

- **Multi-Resource Booking**: Book court + equipment + coach in a single atomic transaction
- **Dynamic Pricing Engine**: Configurable pricing rules (peak hours, weekends, court type)
- **Email OTP Authentication**: JWT-based auth with SMTP email verification
- **Admin Dashboard**: Manage courts, equipment, coaches, pricing rules
- **Waitlist System**: Queue management with automatic notifications
- **Concurrent Booking Prevention**: Optimistic locking to prevent double bookings
- **Real-time Availability**: Polling-based availability updates

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Nodemailer (SMTP OTP)
- Express Validator

### Frontend
- React 19 + TypeScript
- Vite
- Shadcn UI
- React Router
- Axios
- TanStack Query (React Query)

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (Local installation or MongoDB Atlas account)
- SMTP Email Account (Gmail recommended)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd court-booking-app
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/court-booking
# Or use MongoDB Atlas: mongodb+srv://<username>:<password>@cluster.mongodb.net/court-booking

JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRE=7d

# Gmail SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=Court Booking <noreply@courtbooking.com>

OTP_EXPIRE_MINUTES=10
CLIENT_URL=http://localhost:5173
```

#### Setting up Gmail for SMTP:

1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account Settings → Security → App Passwords
3. Generate an "App Password" for "Mail"
4. Use this password in the `EMAIL_PASSWORD` field

#### MongoDB Setup Options:

**Option A: Local MongoDB**
```bash
# Windows (Install from mongodb.com)
# Start MongoDB service
net start MongoDB

# Or download MongoDB Community Server and run:
mongod --dbpath="C:\data\db"
```

**Option B: MongoDB Atlas (Cloud - Recommended)**
1. Create free account at mongodb.com/cloud/atlas
2. Create a cluster
3. Add your IP to whitelist (Network Access)
4. Get connection string and update MONGODB_URI

```bash
# Seed database with initial data
npm run seed

# Start backend server
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

## Seed Data

The seed script creates:

- **4 Courts**: 2 indoor (₹500/hr), 2 outdoor (₹300/hr)
- **5 Equipment Items**: Rackets, Shoes, Shuttlecocks
- **3 Coaches**: With different specialties and availability
- **5 Pricing Rules**: Peak hours, weekends, early bird, etc.
- **2 Users**: 
  - Admin: `admin@courtbooking.com`
  - Demo: `demo@courtbooking.com`

## API Documentation

### Authentication

- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP and login
- `GET /api/auth/me` - Get current user (Protected)

### Courts

- `GET /api/courts` - Get all courts
- `GET /api/courts/:id` - Get court by ID
- `GET /api/courts/:id/availability?date=YYYY-MM-DD` - Get available slots
- `POST /api/courts` - Create court (Admin)
- `PUT /api/courts/:id` - Update court (Admin)
- `DELETE /api/courts/:id` - Delete court (Admin)

### Equipment

- `GET /api/equipment` - Get all equipment
- `GET /api/equipment/:id` - Get equipment by ID
- `POST /api/equipment` - Create equipment (Admin)
- `PUT /api/equipment/:id` - Update equipment (Admin)
- `DELETE /api/equipment/:id` - Delete equipment (Admin)

### Coaches

- `GET /api/coaches` - Get all coaches
- `GET /api/coaches/:id` - Get coach by ID
- `POST /api/coaches` - Create coach (Admin)
- `PUT /api/coaches/:id` - Update coach (Admin)
- `DELETE /api/coaches/:id` - Delete coach (Admin)

### Bookings

- `POST /api/bookings/check-availability` - Check resource availability
- `POST /api/bookings/preview-price` - Preview booking price
- `POST /api/bookings` - Create booking (Protected)
- `GET /api/bookings` - Get user bookings (Protected)
- `GET /api/bookings/:id` - Get booking details (Protected)
- `PUT /api/bookings/:id` - Update booking (Protected)
- `PUT /api/bookings/:id/cancel` - Cancel booking (Protected)

### Pricing Rules

- `GET /api/pricing-rules` - Get all pricing rules
- `GET /api/pricing-rules/:id` - Get rule by ID
- `POST /api/pricing-rules` - Create rule (Admin)
- `PUT /api/pricing-rules/:id` - Update rule (Admin)
- `PUT /api/pricing-rules/:id/toggle` - Toggle rule active status (Admin)
- `DELETE /api/pricing-rules/:id` - Delete rule (Admin)

### Waitlist

- `POST /api/waitlist` - Join waitlist (Protected)
- `GET /api/waitlist` - Get user waitlist entries (Protected)
- `DELETE /api/waitlist/:id` - Leave waitlist (Protected)
- `POST /api/waitlist/notify-next` - Notify next in queue (Protected)

### Admin

- `GET /api/admin/dashboard` - Get dashboard stats (Admin)
- `GET /api/admin/bookings` - Get all bookings (Admin)
- `GET /api/admin/users` - Get all users (Admin)
- `PUT /api/admin/users/:id/role` - Update user role (Admin)
- `GET /api/admin/reports/revenue` - Get revenue report (Admin)

## Architecture & Design

### Database Schema Design

**Multi-Resource Booking Model**: Each booking references multiple resources (court, equipment array, coach) with atomic transaction support using MongoDB sessions.

**Availability Tracking**: Efficient time-based queries using indexed fields (startTime, endTime, status) to check conflicts across all resources.

**Optimistic Locking**: Version field in Booking schema prevents concurrent booking conflicts during high-traffic scenarios.

### Dynamic Pricing Engine

**Rule-Based System**: Pricing rules stored in database with conditions (time ranges, day of week, court type, date ranges).

**Priority-Based Evaluation**: Rules evaluated in priority order, with multipliers stacked for applicable rules.

**Real-time Calculation**: Price calculated on-demand based on active rules matching booking parameters.

**Admin Configurability**: No hardcoded pricing logic - all rules created/modified via admin panel.

### Concurrent Booking Strategy

**Atomic Transactions**: MongoDB sessions ensure all-or-nothing booking creation across multiple resources.

**Version-Based Locking**: Booking updates check version field to detect concurrent modifications.

**Availability Validation**: Pre-booking checks across all resources before transaction commit.

## Testing

### Manual Testing Workflow

1. **User Registration**:
   - Request OTP for new email
   - Verify OTP to create account

2. **Browse Resources**:
   - View available courts, equipment, coaches
   - Check court availability for specific date

3. **Create Booking**:
   - Select court + date/time
   - Add optional equipment and coach
   - Preview dynamic pricing
   - Confirm booking

4. **Admin Operations**:
   - Login as admin@courtbooking.com
   - Manage resources (CRUD operations)
   - Configure pricing rules
   - View dashboard and reports

5. **Concurrent Booking Test**:
   - Open two browser windows
   - Attempt to book same slot simultaneously
   - Verify only one booking succeeds

6. **Waitlist Flow**:
   - Book all slots for a specific time
   - Join waitlist as another user
   - Cancel original booking
   - Verify waitlist notification sent

## Project Structure

```
court-booking-app/
├── backend/
│   ├── config/           # Database configuration
│   ├── middleware/       # Auth and validation middleware
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic layer
│   ├── utils/           # Helper functions (email, JWT)
│   ├── seeders/         # Database seed scripts
│   └── server.js        # Express app entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Route-level pages
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API integration
│   │   ├── lib/         # Utilities and helpers
│   │   └── types/       # TypeScript interfaces
│   └── ...
└── README.md
```

## Assumptions Made

1. **Slot Duration**: Bookings are in 1-hour increments (6 AM - 10 PM)
2. **Currency**: Pricing in INR (₹)
3. **Email Verification**: OTP valid for 10 minutes
4. **Waitlist Expiry**: Waitlist entries expire 24 hours after desired date
5. **Equipment Availability**: Calculated dynamically based on overlapping bookings
6. **Coach Availability**: One coach can only handle one booking at a time
7. **Cancellation**: Users can cancel bookings, triggering waitlist notifications
8. **Payment**: Not implemented (assumed external payment gateway integration)
9. **Timezone**: All times in server timezone (can be extended to support multiple timezones)
10. **Booking Modifications**: Limited to reschedule date/time (resource changes require new booking)

## Future Enhancements

- Payment gateway integration (Razorpay/Stripe)
- WebSocket for real-time availability updates
- Push notifications (FCM)
- Mobile app (React Native)
- Booking packages and memberships
- Automated reminders (24hrs before booking)
- Customer reviews and ratings for coaches
- Court maintenance scheduling
- Analytics dashboard with charts
- Multi-tenancy (multiple facilities)

## License

MIT

## Contact

For questions or support, contact: support@courtbooking.com
