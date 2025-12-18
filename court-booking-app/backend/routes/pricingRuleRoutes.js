const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getPricingRules,
  getPricingRuleById,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  togglePricingRule
} = require('../controllers/pricingRuleController');

// Validation middleware
const pricingRuleValidation = [
  body('name').trim().notEmpty().withMessage('Rule name is required'),
  body('type').isIn(['time-based', 'day-based', 'court-type', 'seasonal', 'custom']).withMessage('Invalid rule type'),
  body('multiplier').isFloat({ min: 0 }).withMessage('Multiplier must be a positive number')
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
// @route   GET /api/pricing-rules
// @desc    Get all pricing rules
// @access  Public
router.get('/', getPricingRules);

// @route   GET /api/pricing-rules/:id
// @desc    Get pricing rule by ID
// @access  Public
router.get('/:id', getPricingRuleById);

// @route   POST /api/pricing-rules
// @desc    Create new pricing rule (Admin only)
// @access  Private/Admin
router.post('/', protect, admin, pricingRuleValidation, validate, createPricingRule);

// @route   PUT /api/pricing-rules/:id
// @desc    Update pricing rule (Admin only)
// @access  Private/Admin
router.put('/:id', protect, admin, updatePricingRule);

// @route   DELETE /api/pricing-rules/:id
// @desc    Delete pricing rule (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, admin, deletePricingRule);

// @route   PUT /api/pricing-rules/:id/toggle
// @desc    Toggle pricing rule active status (Admin only)
// @access  Private/Admin
router.put('/:id/toggle', protect, admin, togglePricingRule);

module.exports = router;
