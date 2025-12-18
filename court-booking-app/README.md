# Court Booking Platform

A full-stack court booking system for sports facilities with multi-resource bookings, dynamic pricing engine, and admin management.

## Features

### Core Booking Features
- **Multi-Resource Booking**: Book court + equipment + coach in a single atomic transaction
- **Soft-Lock Reservation System**: Temporary slot reservation (5 min) when user starts booking to prevent conflicts
- **Smart Slot Management**: Automatic prevention of past time slot bookings
- **Dynamic Pricing Engine**: 7 pricing rule types (time-based, day-based, court-type, seasonal, festival, specific-date, custom) with priority-based evaluation and admin configurability
- **Festival & Special Date Pricing**: Apply special offers during festivals (Christmas, Diwali, New Year) or specific dates (Grand Opening Day, Anniversaries)
- **Multi-Hour Booking Support**: Book consecutive hours with per-hour dynamic pricing

### Waitlist & Queue Management
- **Intelligent Waitlist**: Users specify all preferences (equipment, coach, notes) when joining
- **Auto-Booking System**: First in queue automatically gets booked when slot opens
- **Position Tracking**: Real-time queue position updates
- **Email Notifications**: Automatic notifications on successful auto-booking

### Concurrency & Real-Time Updates
- **Reservation Locking**: Active bookings hold slots for 5 min (extends to 8 min on final step)
- **Optimistic Locking**: Version-based conflict detection for concurrent operations
- **Real-Time Polling**: 10-second updates on booking page, 15-second on admin panel
- **Visual Indicators**: Live slot status (Available, Holding, Reserved by Others, Past, Booked)

### Authentication & Security
- **Email OTP Authentication**: JWT-based auth with SMTP email verification
- **Role-Based Access**: Super admin system with user management
- **Phone Verification**: Contact verification for bookings and waitlist

### Admin Features
- **Comprehensive Dashboard**: Modular admin panel with 6 tabs (Courts, Equipment, Coaches, Pricing Rules, Bookings, Users)
- **Court Maintenance Mode**: Freeze courts for maintenance (no bookings allowed)
- **Equipment Management**: CRUD operations with type classification (racket, net, ball) and quantity tracking
- **Coach Management**: Full profile management with phone, email, specialization, and hourly rates
- **Advanced Pricing Rules**: Create 7 types of pricing rules including festival offers and specific-date promotions
- **Bookings Management**: View all bookings and waitlist with pagination (10 items/page)
- **User Management**: View registered users with booking counts and pagination
- **CRUD Operations**: Full create, read, update, delete, toggle active/inactive for all resources

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
- **Modular Component Architecture**: Feature-based organization with reusable, composable components

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
SUPER_ADMIN_EMAIL=your-email
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

Run `npm run seed` in backend directory to populate database with:

- **4 Courts**: 
  - Indoor Clay Court (₹800/hr)
  - Outdoor Grass Court (₹600/hr)
  - Indoor Synthetic Court (₹1000/hr)
  - Outdoor Hard Court (₹500/hr)
  - All set to active status (bookable)

- **8 Equipment Items**: 
  - Premium Racket (5 qty, ₹100/hr), Standard Racket (10 qty, ₹50/hr), Junior Racket (8 qty, ₹30/hr)
  - Net (4 qty, ₹50/hr), Professional Net (3 qty, ₹75/hr), Training Net (5 qty, ₹40/hr)
  - Practice Balls (20 qty, ₹20/hr), Ball (15 qty, ₹15/hr)
  - Types: racket, net, ball

- **4 Coaches**: 
  - Alex Johnson (Singles Specialist, ₹1500/hr), Maria Garcia (Doubles Expert, ₹1200/hr)
  - Ravi Kumar (Beginner Friendly, ₹1000/hr), Sophie Chen (Advanced Training, ₹1800/hr)
  - Each with name, email, phone, specialization, hourly rates, and availability

- **10 Pricing Rules** with priority-based evaluation:
  - **Time-based**: Peak Hours (6PM-9PM, +30%), Off-Peak (6AM-10AM, -20%)
  - **Day-based**: Weekend Special (Sat-Sun, +25%)
  - **Court-type**: Outdoor Premium (outdoor courts, +20%)
  - **Seasonal**: Summer Season (Jun-Aug, -15%)
  - **Festival**: Christmas Special (Dec 25, -40%), New Year Sale (Jan 1, -50%), Diwali Special (inactive, -30%)
  - **Specific-date**: Grand Opening Day (specific date, -60%)
  - **Custom**: Flexible conditions with custom logic

- **2 Users**: 
  - **Super Admin**: `your-email-in-env` (full system access)
  - **Demo User**: `demo@courtbooking.com or a valid email for getting actual OTP for reservations` (regular user)
  - Both use OTP `123456` in dev mode

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

### Reservations (Soft-Lock System)

- `POST /api/reservations` - Create temporary slot reservation (Protected)
- `PUT /api/reservations/:id/extend` - Extend reservation by 3 minutes (Protected)
- `DELETE /api/reservations/:id` - Release reservation (Protected)

### Admin

- `GET /api/admin/dashboard` - Get dashboard stats (Admin)
- `GET /api/admin/bookings` - Get all bookings (Admin)
- `GET /api/admin/waitlist` - Get all waitlist entries (Admin)
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

**Soft-Lock Reservation System**: 
- When user selects a slot → 5-minute temporary reservation created
- Other users see slot as "Reserved" and cannot select
- Reservation extends by 3 minutes when reaching final step (total 8 min max)
- Auto-releases on page close, going back to step 1, or timeout
- MongoDB TTL index automatically cleans up expired reservations

**Atomic Transactions**: MongoDB sessions ensure all-or-nothing booking creation across multiple resources.

**Version-Based Locking**: Booking updates check version field to detect concurrent modifications.

**Availability Validation**: 
- Pre-booking checks across all resources AND active reservations
- Prevents double-booking even if two users select slot simultaneously
- Time-slot validation prevents booking past times

## Quick Start Guide

### First-Time Setup

1. **Start MongoDB** (if using local):
   ```bash
   # Windows
   net start MongoDB
   
   # Mac/Linux
   sudo systemctl start mongod
   ```

2. **Configure Environment Variables**:
   - Copy `backend/.env.example` to `backend/.env`
   - Update MongoDB URI, JWT secret, and SMTP credentials
   - For Gmail SMTP: Enable 2FA and generate App Password

3. **Install & Seed Database**:
   ```bash
   # Backend
   cd backend
   npm install
   npm run seed    # Creates courts, equipment, coaches, admin user
   npm run dev     # Starts on http://localhost:5000
   
   # Frontend (in new terminal)
   cd frontend
   npm install
   npm run dev     # Starts on http://localhost:5173
   ```

4. **Login Credentials**:
   - **Super Admin**: `your-email` (OTP: `123456` in dev mode)
   - **Demo User**: `demo@courtbooking.com` (OTP: `123456` in dev mode)

### Testing Workflow

1. **User Registration & Booking**:
   - Navigate to http://localhost:5173
   - Enter email and request OTP (use `123456` in dev)
   - Browse courts → Select court → Choose date/time slot
   - Notice slot shows "Holding" (5-min reservation active)
   - Add equipment/coach (optional) → Enter phone → Confirm booking
   - View booking in dashboard

2. **Soft-Lock Reservation Test**:
   - Open two browser windows (different users or incognito)
   - Both select same court, same date
   - User A selects 2:00 PM slot → Slot reserves for User A
   - User B refreshes → Sees "Reserved" badge on 2:00 PM slot (cannot select)
   - User A completes booking → User B sees "Booked" (Join Waitlist appears)

3. **Waitlist & Auto-Booking Test**:
   - Book all slots for specific time (e.g., 3:00 PM)
   - Login as different user → Try to book same slot → Click "Join Waitlist"
   - Enter phone, select equipment/coach → Join waitlist (shows position #1)
   - Cancel original booking → Check email (waitlist user auto-booked)
   - Admin panel shows waitlist entry status: "converted"

4. **Past Slot Prevention Test**:
   - Select today's date
   - Notice past time slots are grayed out with "(Past)" label
   - Attempt to book past slot → Button disabled
   - System blocks booking past times even via API

5. **Admin Panel Operations**:
   - Login as `your-email` save it in env as 'SUPER_ADMIN_EMAIL'
   - Navigate to Admin Panel
   - **Courts Tab**: Create/edit courts, freeze for maintenance
   - **Equipment Tab**: Add equipment with type (racket/net/ball), set quantities and rates
   - **Coaches Tab**: Manage coach profiles with name, email, phone, specialization, and hourly rates
   - **Pricing Rules Tab**: Create/edit all 7 rule types (time-based, day-based, court-type, seasonal, festival, specific-date, custom)
     - Add festival offers (e.g., Christmas -40%, Diwali -30%)
     - Set specific date promotions (e.g., Grand Opening Day -60%)
     - Toggle active/inactive status, delete rules, edit conditions
   - **Bookings Tab**: View all bookings with pagination, auto-refreshes every 15s
   - **Users Tab**: View registered users with booking counts

6. **Multi-Hour Booking Test**:
   - Book 2:00 PM - 3:00 PM slot
   - Book 3:00 PM - 4:00 PM slot (consecutive)
   - Both bookings apply dynamic pricing independently
   - Each shows as separate booking in dashboard

7. **Court Maintenance Mode**:
   - Admin: Freeze a court (Maintenance mode)
   - User: Try to book that court → Shows "Court Under Maintenance"
   - Admin: Unfreeze court → Court bookable again

8. **Pagination Test**:
   - Create 10+ bookings
   - Dashboard shows 5 per page with Previous/Next buttons
   - Admin panel shows 10 per page for users/bookings/waitlist

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
│   │   ├── components/  # Shared React components (Navbar, ProtectedRoute, UI library)
│   │   ├── features/    # Feature-based modules (admin, booking) with components/hooks/utils
│   │   │   ├── admin/   # Admin panel with modular tabs (courts, equipment, coaches, pricing, bookings, users)
│   │   │   └── booking/ # Booking flow components
│   │   ├── pages/       # Route-level pages
│   │   ├── contexts/    # React Context providers (Auth, Booking)
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API integration
│   │   ├── lib/         # Utilities and helpers
│   │   └── types/       # TypeScript interfaces
│   └── ...
└── README.md
```

## Assumptions & Design Decisions

### Booking & Scheduling
1. **Slot Duration**: All bookings are in 1-hour increments (fixed time slots: 6 AM - 10 PM)
2. **Multi-Hour Bookings**: Users book consecutive 1-hour slots separately; each slot has dynamic pricing applied independently
3. **Same-Day Booking**: System prevents booking past time slots (e.g., cannot book 12 PM slot if current time is 12:30 PM on the same day)
4. **Booking Window**: Users can book up to 30 days in advance
5. **Cancellation Policy**: Users can cancel confirmed bookings anytime; cancellation triggers automatic waitlist processing

### Reservation & Locking System
6. **Reservation Duration**: Initial 5-minute hold when slot selected, extends by 3 minutes at final step (max 8 minutes total)
7. **Reservation Auto-Release**: Reservations released automatically on:
   - Browser close/refresh
   - User navigates back to step 1
   - Timeout (MongoDB TTL index cleanup)
   - Successful booking completion
8. **Concurrent User Handling**: Multiple users can browse simultaneously; only first to select gets the slot reservation

### Waitlist & Queue Management
9. **Waitlist Details Capture**: Users specify full booking requirements (equipment, coach, notes, phone) when joining waitlist
10. **Auto-Booking Priority**: First person in queue automatically gets booked when slot becomes available
11. **Waitlist Expiry**: Entries expire 24 hours after desired booking date
12. **Queue Position Updates**: Positions recalculate automatically when users withdraw or get auto-booked
13. **Notification Method**: Email notifications sent on auto-booking

### Resource Management
14. **Equipment Availability**: Dynamically calculated based on total quantity minus active bookings during requested time
15. **Coach Availability**: One coach can handle only one booking per time slot (no double-booking)
16. **Court Status**: Courts can be in maintenance mode (frozen), preventing all bookings until reactivated
17. **Equipment Quantity**: System tracks quantity per booking and validates availability before confirming

### Pricing & Currency
18. **Currency**: All pricing in Indian Rupees (₹)
19. **Dynamic Pricing**: Rules evaluated in priority order; multiple applicable rules stack their multipliers
20. **Pricing Components**: Total = Court Base Rate + Equipment Rate + Coach Rate, then multiplied by applicable rule modifiers
21. **Price Preview**: Users see final price before confirming booking

### Authentication & User Management
22. **OTP Validity**: OTP codes expire after 10 minutes
23. **Dev Mode OTP**: Fixed OTP `123456` works in development for testing (should be removed in production)
24. **Super Admin**: Single super admin account (`your-email`) with full system access
25. **User Roles**: Two roles only - `user` (default) and `admin` (super admin)
26. **Phone Requirement**: Phone number required for bookings and waitlist (for contact and record-keeping purposes)

### Data Management & Performance
27. **Pagination**: 
    - User dashboard: 5 bookings per page
    - Admin panels: 10 items per page (users, bookings, waitlist)
28. **Polling Intervals**: 
    - Booking page: 10-second refresh for real-time slot availability
    - Admin panel: 15-second refresh for bookings/waitlist updates
29. **Optimistic Locking**: Version field prevents race conditions during concurrent updates
30. **Atomic Transactions**: All multi-resource operations (booking creation, cancellation with waitlist processing) use MongoDB sessions

### System Limitations & Scope
31. **Payment Integration**: Not implemented (assumed to be integrated with external payment gateway like Razorpay/Stripe)
32. **Timezone Handling**: All times in server timezone (UTC/local); no multi-timezone support (can be extended)
33. **Booking Modifications**: Users cannot modify existing bookings; must cancel and rebook (prevents complex availability conflicts)
34. **Equipment Damage**: No damage tracking or deposit system (assumed handled separately)
35. **Refund Policy**: Not implemented (assumed business logic handled externally)

### Technical Assumptions
36. **Database**: MongoDB with replica set enabled (required for transactions)
37. **Email Service**: SMTP server available and configured (Gmail recommended for development)
38. **Node Version**: Node.js v18+ required for modern JavaScript features
39. **Browser Support**: Modern browsers with ES6+ support (Chrome, Firefox, Safari, Edge)
40. **Network**: Reliable internet connection for polling and real-time updates

## Known Limitations

1. **Single Timezone**: All times use server timezone (no multi-timezone support)
2. **No Booking Modification**: Users must cancel and rebook (cannot edit existing bookings)
3. **Fixed Slot Duration**: All bookings must be 1-hour slots (no 30-min or custom durations)
4. **Payment Gateway**: Not integrated (assumed external/offline payment processing)
5. **Refund System**: Not implemented (business logic assumed external)
6. **Single Facility**: No multi-facility/tenant support
7. **Image Uploads**: No file upload for courts/coaches (text-only descriptions)

## Future Enhancements

### Payment & Billing
- Razorpay/Stripe payment gateway integration
- Automated refund processing
- Invoice generation (PDF)
- Booking packages and memberships
- Discount codes and promotions

### Communication
- Enhanced email notifications with templates
- Automated email reminders (24hrs, 1hr before booking)
- Email notification preferences and settings

### User Experience
- Mobile app (React Native)
- WebSocket for real-time availability (no polling)
- Calendar view for bookings
- Google Calendar sync
- Booking modification without cancellation
- Favorite courts/coaches

### Business Features
- Customer reviews and ratings for coaches
- Court maintenance scheduling system
- Equipment damage tracking
- Loyalty points system
- Corporate booking management
- Tournament management module

### Analytics & Reporting
- Revenue analytics dashboard with charts
- Booking trends and peak hours analysis
- Coach performance metrics
- Equipment utilization reports
- User retention analytics

### Multi-Tenancy
- Multiple facilities support
- Facility-specific branding
- Cross-facility booking
- Centralized admin portal

