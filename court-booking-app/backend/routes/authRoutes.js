const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const {
  firebaseSync,
  sendOTP,
  verifyOTP,
  getCurrentUser
} = require('../controllers/authController');

// @route   POST /api/auth/firebase-sync
// @desc    Sync Firebase user with backend database
// @access  Public (requires Firebase token)
router.post('/firebase-sync', firebaseSync);

// @route   POST /api/auth/send-otp
// @desc    Send OTP for admin login
// @access  Public
const sendOTPValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('name').trim().notEmpty().withMessage('Please provide a name')
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

router.post('/send-otp', sendOTPValidation, validate, sendOTP);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and login (admin only)
// @access  Public
const verifyOTPValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];

router.post('/verify-otp', verifyOTPValidation, validate, verifyOTP);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, getCurrentUser);

module.exports = router;
