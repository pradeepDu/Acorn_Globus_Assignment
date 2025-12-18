const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getCourts,
  getCourtById,
  getCourtAvailability,
  createCourt,
  updateCourt,
  deleteCourt
} = require('../controllers/courtController');

// Validation middleware
const courtValidation = [
  body('name').trim().notEmpty().withMessage('Court name is required'),
  body('type').isIn(['indoor', 'outdoor']).withMessage('Type must be indoor or outdoor'),
  body('hourlyBaseRate').isFloat({ min: 0 }).withMessage('Hourly rate must be a positive number')
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
// @route   GET /api/courts
// @desc    Get all courts
// @access  Public
router.get('/', getCourts);

// @route   GET /api/courts/:id
// @desc    Get court by ID
// @access  Public
router.get('/:id', getCourtById);

// @route   GET /api/courts/:id/availability
// @desc    Get available slots for a court on a specific date
// @access  Public (but uses auth if available)
router.get('/:id/availability', getCourtAvailability);

// @route   POST /api/courts
// @desc    Create a new court (Admin only)
// @access  Private/Admin
router.post('/', protect, admin, courtValidation, validate, createCourt);

// @route   PUT /api/courts/:id
// @desc    Update court (Admin only)
// @access  Private/Admin
router.put('/:id', protect, admin, updateCourt);

// @route   DELETE /api/courts/:id
// @desc    Delete court (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, admin, deleteCourt);

module.exports = router;
