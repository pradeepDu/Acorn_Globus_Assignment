const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createReservation,
  extendReservation,
  cancelReservation
} = require('../controllers/reservationController');

// Routes
// @route   POST /api/reservations
// @desc    Create temporary reservation (5 minutes)
// @access  Private
router.post('/', protect, createReservation);

// @route   PUT /api/reservations/:id/extend
// @desc    Extend reservation by 5 minutes
// @access  Private
router.put('/:id/extend', protect, extendReservation);

// @route   DELETE /api/reservations/:id
// @desc    Cancel/release reservation
// @access  Private
router.delete('/:id', protect, cancelReservation);

module.exports = router;
