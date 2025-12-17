const { 
  createBooking, 
  cancelBooking, 
  getUserBookings, 
  getBookingById,
  updateBooking 
} = require('../services/bookingService');
const { previewPrice } = require('../services/pricingService');
const { checkMultiResourceAvailability } = require('../services/availabilityService');

/**
 * @desc    Check availability for booking
 * @route   POST /api/bookings/check-availability
 * @access  Public
 */
exports.checkAvailability = async (req, res) => {
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
};

/**
 * @desc    Preview booking price
 * @route   POST /api/bookings/preview-price
 * @access  Public
 */
exports.previewBookingPrice = async (req, res) => {
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
};

/**
 * @desc    Create a new booking
 * @route   POST /api/bookings
 * @access  Private
 */
exports.createNewBooking = async (req, res) => {
  try {
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
};

/**
 * @desc    Get user bookings
 * @route   GET /api/bookings
 * @access  Private
 */
exports.getUserBookingsList = async (req, res) => {
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
};

/**
 * @desc    Get booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private
 */
exports.getBooking = async (req, res) => {
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
};

/**
 * @desc    Update booking
 * @route   PUT /api/bookings/:id
 * @access  Private
 */
exports.updateBookingDetails = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const result = await updateBooking(req.params.id, req.user.id, req.body, isAdmin);

    if (!result.success) {
      return res.status(result.message === 'Booking not found' ? 404 : 400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Cancel booking
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private
 */
exports.cancelUserBooking = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const result = await cancelBooking(req.params.id, req.user.id, isAdmin);

    if (!result.success) {
      return res.status(result.message === 'Booking not found' ? 404 : 400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
