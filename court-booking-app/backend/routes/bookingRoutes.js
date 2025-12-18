const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { autoUpdateCompletedBookings } = require('../services/bookingStatusService');
const {
  checkAvailability,
  previewBookingPrice,
  createNewBooking,
  getUserBookingsList,
  getBooking,
  updateBookingDetails,
  cancelUserBooking
} = require('../controllers/bookingController');

// Routes
// @route   POST /api/bookings/check-availability
// @desc    Check availability for booking
// @access  Public
router.post('/check-availability', checkAvailability);

// @route   POST /api/bookings/preview-price
// @desc    Preview booking price
// @access  Public
router.post('/preview-price', previewBookingPrice);

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', protect, createNewBooking);

// @route   GET /api/bookings
// @desc    Get user bookings
// @access  Private
router.get('/', protect, autoUpdateCompletedBookings, getUserBookingsList);

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/:id', protect, getBooking);

// @route   PUT /api/bookings/:id
// @desc    Update booking (reschedule)
// @access  Private
router.put('/:id', protect, updateBookingDetails);

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.put('/:id/cancel', protect, cancelUserBooking);

module.exports = router;
