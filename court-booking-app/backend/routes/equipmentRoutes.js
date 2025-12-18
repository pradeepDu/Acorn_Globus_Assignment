const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment
} = require('../controllers/equipmentController');

// Validation middleware
const equipmentValidation = [
  body('name').trim().notEmpty().withMessage('Equipment name is required'),
  body('type').isIn(['racket', 'ball', 'net', 'shoes', 'other']).withMessage('Type must be racket, ball, net, shoes, or other'),
  body('totalQuantity').optional().isInt({ min: 0 }).withMessage('Total quantity must be a positive number'),
  body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be a positive number'),
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
  // Map quantity to totalQuantity if provided
  if (req.body.quantity && !req.body.totalQuantity) {
    req.body.totalQuantity = req.body.quantity;
  }
  next();
};

// Routes
// @route   GET /api/equipment
// @desc    Get all equipment
// @access  Public
router.get('/', getEquipment);

// @route   GET /api/equipment/:id
// @desc    Get equipment by ID
// @access  Public
router.get('/:id', getEquipmentById);

// @route   POST /api/equipment
// @desc    Create new equipment (Admin only)
// @access  Private/Admin
router.post('/', protect, admin, equipmentValidation, validate, createEquipment);

// @route   PUT /api/equipment/:id
// @desc    Update equipment (Admin only)
// @access  Private/Admin
router.put('/:id', protect, admin, updateEquipment);

// @route   DELETE /api/equipment/:id
// @desc    Delete equipment (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, admin, deleteEquipment);

module.exports = router;
