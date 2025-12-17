const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { 
  createBooking, 
  cancelBooking, 
  getUserBookings, 
  getBookingById,
  updateBooking 
} = require('../services/bookingService');
const { previewPrice } = require('../services/pricingService');
const { checkMultiResourceAvailability } = require('../services/availabilityService');

// @route   POST /api/bookings/check-availability
// @desc    Check availability for booking
// @access  Public
router.post('/check-availability', async (req, res) => {
  try {
    const { courtId, coachId, equipmentItems, startTime, endTime } = req.body;

    const availability = await checkMultiResourceAvailability(
      courtId,
      coachId,
      equipmentItems,
      new Date(startTime),
      new Date(endTime)
    );

    res.status(200).json({
      success: true,
      ...availability
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/bookings/preview-price
// @desc    Preview booking price
// @access  Public
router.post('/preview-price', async (req, res) => {
  try {
    const { courtId, coachId, equipmentItems, startTime, endTime } = req.body;

    const pricingResult = await previewPrice(
      courtId,
      equipmentItems,
      coachId,
      startTime,
      endTime
    );

    if (!pricingResult.success) {
      return res.status(400).json(pricingResult);
    }

    res.status(200).json(pricingResult);
  } catch (error) {
    console.error('Preview price error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', protect, [
  body('courtId').notEmpty().withMessage('Court ID is required'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const result = await createBooking(req.user.id, req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/bookings
// @desc    Get user bookings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }

    const result = await getUserBookings(req.user.id, filters);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const result = await getBookingById(req.params.id, req.user.id, isAdmin);

    if (!result.success) {
      return res.status(result.message === 'Booking not found' ? 404 : 403).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   PUT /api/bookings/:id
// @desc    Update booking (reschedule)
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const result = await updateBooking(req.params.id, req.user.id, req.body, isAdmin);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const result = await cancelBooking(req.params.id, req.user.id, isAdmin);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;
