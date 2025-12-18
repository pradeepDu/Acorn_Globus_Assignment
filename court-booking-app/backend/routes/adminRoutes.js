const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { autoUpdateCompletedBookings } = require('../services/bookingStatusService');
const {
  getDashboard,
  getAllBookings,
  getAllUsers,
  updateUserRole,
  getRevenueReport,
  getAllWaitlist
} = require('../controllers/adminController');

// Routes
// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private/Admin
router.get('/dashboard', protect, admin, getDashboard);

// @route   GET /api/admin/bookings
// @desc    Get all bookings (Admin only)
// @access  Private/Admin
router.get('/bookings', protect, admin, autoUpdateCompletedBookings, getAllBookings);

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', protect, admin, getAllUsers);

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private/Admin (super admin only for admin promotion)
router.put('/users/:id/role', protect, admin, updateUserRole);

// @route   GET /api/admin/reports/revenue
// @desc    Get revenue report
// @access  Private/Admin
router.get('/reports/revenue', protect, admin, getRevenueReport);

// @route   GET /api/admin/waitlist
// @desc    Get all waitlist entries (Admin only)
// @access  Private/Admin
router.get('/waitlist', protect, admin, getAllWaitlist);

module.exports = router;
