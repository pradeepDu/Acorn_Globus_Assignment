const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const PricingRule = require('../models/PricingRule');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/pricing-rules
// @desc    Get all pricing rules
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { active } = req.query;
    
    const query = {};
    if (active !== undefined) {
      query.active = active === 'true';
    }

    const rules = await PricingRule.find(query).sort({ priority: -1, name: 1 });

    res.status(200).json({
      success: true,
      count: rules.length,
      rules
    });
  } catch (error) {
    console.error('Get pricing rules error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/pricing-rules/:id
// @desc    Get pricing rule by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const rule = await PricingRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Pricing rule not found'
      });
    }

    res.status(200).json({
      success: true,
      rule
    });
  } catch (error) {
    console.error('Get pricing rule error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/pricing-rules
// @desc    Create new pricing rule (Admin only)
// @access  Private/Admin
router.post('/', [protect, admin, [
  body('name').trim().notEmpty().withMessage('Rule name is required'),
  body('type').isIn(['time-based', 'day-based', 'court-type', 'seasonal', 'custom']).withMessage('Invalid rule type'),
  body('multiplier').isFloat({ min: 0 }).withMessage('Multiplier must be a positive number')
]], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const rule = await PricingRule.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Pricing rule created successfully',
      rule
    });
  } catch (error) {
    console.error('Create pricing rule error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   PUT /api/pricing-rules/:id
// @desc    Update pricing rule (Admin only)
// @access  Private/Admin
router.put('/:id', [protect, admin], async (req, res) => {
  try {
    let rule = await PricingRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Pricing rule not found'
      });
    }

    rule = await PricingRule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Pricing rule updated successfully',
      rule
    });
  } catch (error) {
    console.error('Update pricing rule error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   DELETE /api/pricing-rules/:id
// @desc    Delete pricing rule (Admin only)
// @access  Private/Admin
router.delete('/:id', [protect, admin], async (req, res) => {
  try {
    const rule = await PricingRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Pricing rule not found'
      });
    }

    await PricingRule.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Pricing rule deleted successfully'
    });
  } catch (error) {
    console.error('Delete pricing rule error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   PUT /api/pricing-rules/:id/toggle
// @desc    Toggle pricing rule active status (Admin only)
// @access  Private/Admin
router.put('/:id/toggle', [protect, admin], async (req, res) => {
  try {
    const rule = await PricingRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Pricing rule not found'
      });
    }

    rule.active = !rule.active;
    await rule.save();

    res.status(200).json({
      success: true,
      message: `Pricing rule ${rule.active ? 'activated' : 'deactivated'} successfully`,
      rule
    });
  } catch (error) {
    console.error('Toggle pricing rule error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;
