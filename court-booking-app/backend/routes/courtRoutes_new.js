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

// Validation middleware for court creation
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
router.get('/', getCourts);
router.get('/:id', getCourtById);
router.get('/:id/availability', getCourtAvailability);
router.post('/', protect, admin, courtValidation, validate, createCourt);
router.put('/:id', protect, admin, updateCourt);
router.delete('/:id', protect, admin, deleteCourt);

module.exports = router;
