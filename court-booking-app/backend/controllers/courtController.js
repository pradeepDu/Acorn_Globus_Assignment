const Court = require('../models/Court');
const { getAvailableSlots } = require('../services/availabilityService');

/**
 * @desc    Get all courts
 * @route   GET /api/courts
 * @access  Public
 */
exports.getCourts = async (req, res) => {
  try {
    const { type, status } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

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
};

/**
 * @desc    Get court by ID
 * @route   GET /api/courts/:id
 * @access  Public
 */
exports.getCourtById = async (req, res) => {
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
};

/**
 * @desc    Get available slots for a court on a specific date
 * @route   GET /api/courts/:id/availability
 * @access  Public (optional auth)
 */
exports.getCourtAvailability = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a date'
      });
    }

    // Extract userId from token if provided (optional authentication)
    let userId = null;
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const { verifyFirebaseToken } = require('../utils/firebaseAuth');
        const User = require('../models/User');
        
        // Try JWT first (admin OTP login), then fallback to Firebase
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.id ? decoded.id.toString() : null;
          if (process.env.NODE_ENV === 'development') {
            console.log('[Availability] JWT userId extracted:', userId);
          }
        } catch (jwtError) {
          // If JWT fails, try Firebase token
          const firebaseUser = await verifyFirebaseToken(token);
          const user = await User.findOne({ firebaseUid: firebaseUser.uid });
          if (user) {
            userId = user._id.toString();
            if (process.env.NODE_ENV === 'development') {
              console.log('[Availability] Firebase userId extracted:', userId);
            }
          }
        }
      } catch (err) {
        // If all token verification fails, continue without userId
        console.log('Token verification failed for availability check:', err.message);
      }
    }

    const slots = await getAvailableSlots(req.params.id, date, userId);

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
};

/**
 * @desc    Create a new court
 * @route   POST /api/courts
 * @access  Private/Admin
 */
exports.createCourt = async (req, res) => {
  try {
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
};

/**
 * @desc    Update a court
 * @route   PUT /api/courts/:id
 * @access  Private/Admin
 */
exports.updateCourt = async (req, res) => {
  try {
    const court = await Court.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!court) {
      return res.status(404).json({
        success: false,
        message: 'Court not found'
      });
    }

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
};

/**
 * @desc    Delete a court
 * @route   DELETE /api/courts/:id
 * @access  Private/Admin
 */
exports.deleteCourt = async (req, res) => {
  try {
    const court = await Court.findByIdAndDelete(req.params.id);

    if (!court) {
      return res.status(404).json({
        success: false,
        message: 'Court not found'
      });
    }

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
};
