const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Coach = require('../models/Coach');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/coaches
// @desc    Get all coaches
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = {};
    if (status) query.status = status;
    else query.status = 'active'; // Default to active coaches

    const coaches = await Coach.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: coaches.length,
      coaches
    });
  } catch (error) {
    console.error('Get coaches error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/coaches/:id
// @desc    Get coach by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const coach = await Coach.findById(req.params.id);

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    res.status(200).json({
      success: true,
      coach
    });
  } catch (error) {
    console.error('Get coach error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/coaches
// @desc    Create new coach (Admin only)
// @access  Private/Admin
router.post('/', [protect, admin, [
  body('name').trim().notEmpty().withMessage('Coach name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('hourlyRate').isFloat({ min: 0 }).withMessage('Hourly rate must be a positive number')
]], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const coach = await Coach.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Coach created successfully',
      coach
    });
  } catch (error) {
    console.error('Create coach error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   PUT /api/coaches/:id
// @desc    Update coach (Admin only)
// @access  Private/Admin
router.put('/:id', [protect, admin], async (req, res) => {
  try {
    let coach = await Coach.findById(req.params.id);

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    coach = await Coach.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Coach updated successfully',
      coach
    });
  } catch (error) {
    console.error('Update coach error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   DELETE /api/coaches/:id
// @desc    Delete coach (Admin only)
// @access  Private/Admin
router.delete('/:id', [protect, admin], async (req, res) => {
  try {
    const coach = await Coach.findById(req.params.id);

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    await Coach.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Coach deleted successfully'
    });
  } catch (error) {
    console.error('Delete coach error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;
