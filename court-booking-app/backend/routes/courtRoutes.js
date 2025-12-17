const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Court = require('../models/Court');
const { protect, admin } = require('../middleware/authMiddleware');
const { getAvailableSlots } = require('../services/availabilityService');

// @route   GET /api/courts
// @desc    Get all courts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { type, status } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    // Show all courts including maintenance for browsing

    const courts = await Court.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: courts.length,
      courts
    });
  } catch (error) {
    console.error('Get courts error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/courts/:id
// @desc    Get court by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);

    if (!court) {
      return res.status(404).json({
        success: false,
        message: 'Court not found'
      });
    }

    res.status(200).json({
      success: true,
      court
    });
  } catch (error) {
    console.error('Get court error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/courts/:id/availability
// @desc    Get available slots for a court on a specific date
// @access  Public
router.get('/:id/availability', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a date'
      });
    }

    const slots = await getAvailableSlots(req.params.id, date);

    res.status(200).json({
      success: true,
      courtId: req.params.id,
      date,
      slots
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/courts
// @desc    Create a new court (Admin only)
// @access  Private/Admin
router.post('/', [protect, admin, [
  body('name').trim().notEmpty().withMessage('Court name is required'),
  body('type').isIn(['indoor', 'outdoor']).withMessage('Type must be indoor or outdoor'),
  body('hourlyBaseRate').isFloat({ min: 0 }).withMessage('Hourly rate must be a positive number')
]], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const court = await Court.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Court created successfully',
      court
    });
  } catch (error) {
    console.error('Create court error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   PUT /api/courts/:id
// @desc    Update court (Admin only)
// @access  Private/Admin
router.put('/:id', [protect, admin], async (req, res) => {
  try {
    let court = await Court.findById(req.params.id);

    if (!court) {
      return res.status(404).json({
        success: false,
        message: 'Court not found'
      });
    }

    court = await Court.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Court updated successfully',
      court
    });
  } catch (error) {
    console.error('Update court error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   DELETE /api/courts/:id
// @desc    Delete court (Admin only)
// @access  Private/Admin
router.delete('/:id', [protect, admin], async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);

    if (!court) {
      return res.status(404).json({
        success: false,
        message: 'Court not found'
      });
    }

    await Court.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Court deleted successfully'
    });
  } catch (error) {
    console.error('Delete court error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;
