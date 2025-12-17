const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Court = require('../models/Court');
const Equipment = require('../models/Equipment');
const Coach = require('../models/Coach');

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private/Admin
router.get('/dashboard', [protect, admin], async (req, res) => {
  try {
    // Get counts
    const totalBookings = await Booking.countDocuments();
    const activeBookings = await Booking.countDocuments({ status: 'confirmed' });
    const totalUsers = await User.countDocuments();
    const totalCourts = await Court.countDocuments();
    const totalEquipment = await Equipment.countDocuments();
    const totalCoaches = await Coach.countDocuments();

    // Get revenue (sum of all confirmed bookings)
    const revenueData = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$pricing.finalTotal' } } }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    // Get recent bookings
    const recentBookings = await Booking.find()
      .populate('user', 'name email')
      .populate('court', 'name type')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get upcoming bookings
    const upcomingBookings = await Booking.find({
      status: 'confirmed',
      startTime: { $gte: new Date() }
    })
      .populate('user', 'name email')
      .populate('court', 'name type')
      .sort({ startTime: 1 })
      .limit(10);

    res.status(200).json({
      success: true,
      stats: {
        totalBookings,
        activeBookings,
        totalUsers,
        totalCourts,
        totalEquipment,
        totalCoaches,
        totalRevenue: Math.round(totalRevenue * 100) / 100
      },
      recentBookings,
      upcomingBookings
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/admin/bookings
// @desc    Get all bookings (Admin view)
// @access  Private/Admin
router.get('/bookings', [protect, admin], async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('court', 'name type')
      .populate('equipment.item', 'name type')
      .populate('coach', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with booking counts
// @access  Private/Admin
router.get('/users', [protect, admin], async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-otp -otpExpire')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get booking count for each user
    const usersWithBookings = await Promise.all(
      users.map(async (user) => {
        const bookingCount = await Booking.countDocuments({ user: user._id });
        return {
          ...user,
          bookingCount
        };
      })
    );

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users: usersWithBookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role (Super Admin only can create admins)
// @access  Private/Admin
router.put('/users/:id/role', [protect, admin], async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Only super admin can promote users to admin
    if (role === 'admin' && req.user.email !== process.env.SUPER_ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can create other admins'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-otp -otpExpire');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/admin/reports/revenue
// @desc    Get revenue report
// @access  Private/Admin
router.get('/reports/revenue', [protect, admin], async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const matchQuery = {
      status: { $in: ['confirmed', 'completed'] }
    };

    if (startDate && endDate) {
      matchQuery.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let groupFormat;
    switch (groupBy) {
      case 'month':
        groupFormat = { year: { $year: '$startTime' }, month: { $month: '$startTime' } };
        break;
      case 'week':
        groupFormat = { year: { $year: '$startTime' }, week: { $week: '$startTime' } };
        break;
      default: // day
        groupFormat = { 
          year: { $year: '$startTime' }, 
          month: { $month: '$startTime' }, 
          day: { $dayOfMonth: '$startTime' } 
        };
    }

    const revenueData = await Booking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: groupFormat,
          totalRevenue: { $sum: '$pricing.finalTotal' },
          bookingCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    console.error('Get revenue report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/admin/waitlist
// @desc    Get all waitlist entries (Admin view)
// @access  Private/Admin
router.get('/waitlist', [protect, admin], async (req, res) => {
  try {
    const Waitlist = require('../models/Waitlist');
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const waitlist = await Waitlist.find(query)
      .populate('user', 'name email phone')
      .populate('court', 'name type')
      .populate('equipment.item', 'name type')
      .populate('coach', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Waitlist.countDocuments(query);

    res.status(200).json({
      success: true,
      waitlist,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get all waitlist error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;
