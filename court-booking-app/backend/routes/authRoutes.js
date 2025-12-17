const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateOTP, sendOTPEmail } = require('../utils/emailService');
const { generateToken } = require('../utils/jwtUtils');

// @route   POST /api/auth/send-otp
// @desc    Send OTP to email
// @access  Public
router.post('/send-otp', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('name').trim().notEmpty().withMessage('Please provide a name')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, name } = req.body;

    // Generate OTP (use fixed OTP in development mode)
    const otp = process.env.NODE_ENV === 'development' ? '123456' : generateOTP();
    const otpExpire = new Date(Date.now() + parseInt(process.env.OTP_EXPIRE_MINUTES || 10) * 60 * 1000);

    // Find or create user
    let user = await User.findOne({ email });

    if (user) {
      // Update existing user with new OTP
      user.otp = otp;
      user.otpExpire = otpExpire;
      if (!user.name) user.name = name;
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        email,
        name,
        otp,
        otpExpire,
        isVerified: false
      });
    }

    // Send OTP via email (skip in development mode)
    let emailResult = { success: true };
    if (process.env.NODE_ENV !== 'development') {
      emailResult = await sendOTPEmail(email, otp, name);
    }

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.'
      });
    }

    res.status(200).json({
      success: true,
      message: process.env.NODE_ENV === 'development' 
        ? 'Development mode: Use OTP 123456' 
        : 'OTP sent successfully to your email',
      email: email,
      ...(process.env.NODE_ENV === 'development' && { devOTP: otp })
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and login
// @access  Public
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, otp } = req.body;

    // Find user with OTP fields
    const user = await User.findOne({ email }).select('+otp +otpExpire');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please request a new OTP.'
      });
    }

    // Check if OTP exists
    if (!user.otp || !user.otpExpire) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new OTP.'
      });
    }

    // Check if OTP expired
    if (user.otpExpire < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    // Verify OTP
    const isOTPValid = await user.compareOTP(otp);

    if (!isOTPValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', require('../middleware/authMiddleware').protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-otp -otpExpire');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;
