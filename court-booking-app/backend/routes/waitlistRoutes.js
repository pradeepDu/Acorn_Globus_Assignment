const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { autoUpdateExpiredWaitlist } = require('../services/waitlistExpiryService');
const {
  joinWaitlist,
  getUserWaitlist,
  removeFromWaitlist,
  notifyNextInWaitlist
} = require('../controllers/waitlistController');

// Validation middleware
const waitlistValidation = [
  body('courtId').notEmpty().withMessage('Court ID is required'),
  body('desiredDate').isISO8601().withMessage('Valid date is required'),
  body('desiredStartTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid start time is required (HH:MM)'),
  body('desiredEndTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid end time is required (HH:MM)')
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Routes
// @route   POST /api/waitlist
// @desc    Join waitlist for a time slot
// @access  Private
router.post('/', protect, waitlistValidation, validate, joinWaitlist);

// @route   GET /api/waitlist
// @desc    Get user's waitlist entries
// @access  Private
router.get('/', protect, autoUpdateExpiredWaitlist, getUserWaitlist);

// @route   DELETE /api/waitlist/:id
// @desc    Remove from waitlist
// @access  Private
router.delete('/:id', protect, removeFromWaitlist);

// @route   POST /api/waitlist/notify-next
// @desc    Notify next person in waitlist (Admin only - called automatically)
// @access  Private
router.post('/notify-next', protect, notifyNextInWaitlist);

module.exports = router;
