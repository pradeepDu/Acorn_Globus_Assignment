const Reservation = require('../models/Reservation');
const { checkMultiResourceAvailability } = require('../services/availabilityService');

/**
 * @desc    Create a temporary reservation for a time slot
 * @route   POST /api/reservations
 * @access  Private
 */
exports.createReservation = async (req, res) => {
  try {
    const { courtId, startTime, endTime } = req.body;
    const userId = req.user.id;

    // Validate times
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start <= now) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reserve a time slot that has already passed'
      });
    }

    // Check if user already has an active reservation for this slot
    const existingReservation = await Reservation.findOne({
      user: userId,
      court: courtId,
      startTime: start,
      endTime: end,
      status: 'active',
      expiresAt: { $gt: now }
    });

    if (existingReservation) {
      return res.status(200).json({
        success: true,
        reservation: existingReservation,
        message: 'Reservation already exists'
      });
    }

    // Check availability (including other reservations)
    const availabilityCheck = await checkMultiResourceAvailability(
      courtId,
      null, // No coach check for reservation
      [],   // No equipment check for reservation
      start,
      end,
      userId // Pass userId to exclude user's own reservations
    );

    if (!availabilityCheck.available) {
      return res.status(400).json({
        success: false,
        message: availabilityCheck.message
      });
    }

    // Create reservation with 5-minute expiry
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    const reservation = new Reservation({
      user: userId,
      court: courtId,
      startTime: start,
      endTime: end,
      expiresAt: expiresAt,
      status: 'active'
    });

    await reservation.save();

    res.status(201).json({
      success: true,
      reservation: reservation,
      expiresIn: 300 // seconds
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Extend reservation expiry time
 * @route   PUT /api/reservations/:id/extend
 * @access  Private
 */
exports.extendReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Check if user owns this reservation
    if (reservation.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to extend this reservation'
      });
    }

    // Check if reservation is still active
    if (reservation.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Reservation is not active'
      });
    }

    // Check if reservation has expired
    if (reservation.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Reservation has already expired'
      });
    }

    // Extend by 5 more minutes
    const newExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    reservation.expiresAt = newExpiresAt;
    await reservation.save();

    res.status(200).json({
      success: true,
      reservation: reservation,
      expiresIn: 300
    });
  } catch (error) {
    console.error('Extend reservation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Cancel/release reservation
 * @route   DELETE /api/reservations/:id
 * @access  Private
 */
exports.cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Check if user owns this reservation
    if (reservation.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this reservation'
      });
    }

    // Mark as released
    reservation.status = 'released';
    await reservation.save();

    res.status(200).json({
      success: true,
      message: 'Reservation released successfully'
    });
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
