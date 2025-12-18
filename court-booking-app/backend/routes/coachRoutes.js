const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getCoaches,
  getCoachById,
  createCoach,
  updateCoach,
  deleteCoach
} = require('../controllers/coachController');

// Validation middleware
const coachValidation = [
  body('name').trim().notEmpty().withMessage('Coach name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('hourlyRate').isFloat({ min: 0 }).withMessage('Hourly rate must be a positive number')
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
// @route   GET /api/coaches
// @desc    Get all coaches
// @access  Public
router.get('/', getCoaches);

// @route   GET /api/coaches/:id
// @desc    Get coach by ID
// @access  Public
router.get('/:id', getCoachById);

// @route   POST /api/coaches
// @desc    Create new coach (Admin only)
// @access  Private/Admin
router.post('/', protect, admin, coachValidation, validate, createCoach);

// @route   PUT /api/coaches/:id
// @desc    Update coach (Admin only)
// @access  Private/Admin
router.put('/:id', protect, admin, updateCoach);

// @route   DELETE /api/coaches/:id
// @desc    Delete coach (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, admin, deleteCoach);

module.exports = router;
