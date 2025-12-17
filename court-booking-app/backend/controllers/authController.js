const User = require('../models/User');
const { verifyFirebaseToken } = require('../utils/firebaseAuth');
const { generateOTP, sendOTPEmail } = require('../utils/emailService');
const { generateToken } = require('../utils/jwtUtils');

/**
 * @desc    Sync Firebase user with backend database
 * @route   POST /api/auth/firebase-sync
 * @access  Public (requires Firebase token)
 */
exports.firebaseSync = async (req, res) => {
  try {
    // Get Firebase token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify Firebase token using REST API
    const firebaseUser = await verifyFirebaseToken(idToken);
    const { uid, email, name, email_verified } = firebaseUser;

    // Find or create user in database
    let user = await User.findOne({ firebaseUid: uid });

    if (user) {
      // Update existing user info
      user.name = name;
      user.email = email;
      user.isVerified = email_verified;
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        email,
        name,
        firebaseUid: uid,
        isVerified: email_verified,
        role: 'user'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User synced successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Firebase sync error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Authentication failed'
    });
  }
};

/**
 * @desc    Send OTP for admin login
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
exports.sendOTP = async (req, res) => {
  try {
    const { email, name } = req.body;

    // Find user with matching email and name
    let user = await User.findOne({ email });

    // If user exists, verify name matches
    if (user) {
      if (user.name !== name) {
        return res.status(400).json({
          success: false,
          message: 'The name doesn\'t match our records.'
        });
      }
    } else {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email. Please use Google sign-in to register.'
      });
    }

    // Generate OTP (use fixed OTP in development mode)
    const otp = process.env.NODE_ENV === 'development' ? '123456' : generateOTP();
    const otpExpire = new Date(Date.now() + parseInt(process.env.OTP_EXPIRE_MINUTES || 10) * 60 * 1000);

    // Update user with OTP
    user.otp = otp;
    user.otpExpire = otpExpire;
    await user.save();

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
};

/**
 * @desc    Verify OTP and login (admin only)
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { email, name, otp } = req.body;

    // Find user with OTP fields
    const user = await User.findOne({ email }).select('+otp +otpExpire');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please request a new OTP.'
      });
    }

    // Verify name matches
    if (user.name !== name) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials. Please check your name and try again.'
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
        message: 'Invalid OTP. Please check and try again.'
      });
    }

    // Clear OTP fields
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
};

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
