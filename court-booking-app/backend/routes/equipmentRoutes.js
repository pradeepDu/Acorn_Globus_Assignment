const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Equipment = require('../models/Equipment');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/equipment
// @desc    Get all equipment
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { type, status } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    else query.status = 'available'; // Default to available equipment

    const equipment = await Equipment.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: equipment.length,
      equipment
    });
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/equipment/:id
// @desc    Get equipment by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    res.status(200).json({
      success: true,
      equipment
    });
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/equipment
// @desc    Create new equipment (Admin only)
// @access  Private/Admin
router.post('/', [protect, admin, [
  body('name').trim().notEmpty().withMessage('Equipment name is required'),
  body('type').isIn(['racket', 'shoes', 'other']).withMessage('Type must be racket, shoes, or other'),
  body('totalQuantity').isInt({ min: 0 }).withMessage('Total quantity must be a positive number'),
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

    const equipment = await Equipment.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Equipment created successfully',
      equipment
    });
  } catch (error) {
    console.error('Create equipment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   PUT /api/equipment/:id
// @desc    Update equipment (Admin only)
// @access  Private/Admin
router.put('/:id', [protect, admin], async (req, res) => {
  try {
    let equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Equipment updated successfully',
      equipment
    });
  } catch (error) {
    console.error('Update equipment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   DELETE /api/equipment/:id
// @desc    Delete equipment (Admin only)
// @access  Private/Admin
router.delete('/:id', [protect, admin], async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    await Equipment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Equipment deleted successfully'
    });
  } catch (error) {
    console.error('Delete equipment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;
