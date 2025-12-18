require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL || 'http://localhost:5173',
    ...(process.env.NODE_ENV === 'production' ? [
      /\.vercel\.app$/,  // Allow all Vercel preview and production deployments
    ] : [])
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/courts', require('./routes/courtRoutes'));
app.use('/api/equipment', require('./routes/equipmentRoutes'));
app.use('/api/coaches', require('./routes/coachRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/pricing-rules', require('./routes/pricingRuleRoutes'));
app.use('/api/waitlist', require('./routes/waitlistRoutes'));
app.use('/api/reservations', require('./routes/reservationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Court Booking API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
