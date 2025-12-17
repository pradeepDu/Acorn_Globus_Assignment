const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Waitlist = require('../models/Waitlist');
const { protect } = require('../middleware/authMiddleware');
const { sendWaitlistNotification } = require('../utils/emailService');

// @route   POST /api/waitlist
// @desc    Join waitlist
// @access  Private
router.post('/', protect, [
  body('courtId').notEmpty().withMessage('Court ID is required'),
  body('desiredDate').isISO8601().withMessage('Valid date is required'),
  body('desiredStartTime').notEmpty().withMessage('Start time is required'),
  body('desiredEndTime').notEmpty().withMessage('End time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { courtId, desiredDate, desiredStartTime, desiredEndTime, equipmentItems, coachId } = req.body;

    // Check if user already in waitlist for this slot
    const existing = await Waitlist.findOne({
      user: req.user.id,
      court: courtId,
      desiredDate: new Date(desiredDate),
      desiredStartTime,
      desiredEndTime,
      status: 'waiting'
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You are already in the waitlist for this slot'
      });
    }

    // Get current position (count + 1)
    const count = await Waitlist.countDocuments({
      court: courtId,
      desiredDate: new Date(desiredDate),
      desiredStartTime,
      desiredEndTime,
      status: 'waiting'
    });

    // Set expiration (24 hours from desired date)
    const desiredDateTime = new Date(desiredDate);
    const expiresAt = new Date(desiredDateTime.getTime() + 24 * 60 * 60 * 1000);

    const waitlistEntry = await Waitlist.create({
      user: req.user.id,
      court: courtId,
      desiredDate: new Date(desiredDate),
      desiredStartTime,
      desiredEndTime,
      equipment: equipmentItems || [],
      coach: coachId || null,
      position: count + 1,
      status: 'waiting',
      expiresAt
    });

    await waitlistEntry.populate([
      { path: 'court', select: 'name type' },
      { path: 'user', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Added to waitlist successfully',
      waitlistEntry
    });
  } catch (error) {
    console.error('Join waitlist error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/waitlist
// @desc    Get user's waitlist entries
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;

    const query = { user: req.user.id };
    if (status) query.status = status;
    else query.status = 'waiting'; // Default to waiting

    const waitlist = await Waitlist.find(query)
      .populate('court', 'name type')
      .populate('equipment.item', 'name type')
      .populate('coach', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: waitlist.length,
      waitlist
    });
  } catch (error) {
    console.error('Get waitlist error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   DELETE /api/waitlist/:id
// @desc    Leave waitlist
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const waitlistEntry = await Waitlist.findById(req.params.id);

    if (!waitlistEntry) {
      return res.status(404).json({
        success: false,
        message: 'Waitlist entry not found'
      });
    }

    // Check if user owns the entry
    if (waitlistEntry.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove this waitlist entry'
      });
    }

    await Waitlist.findByIdAndDelete(req.params.id);

    // Update positions for remaining entries
    await Waitlist.updateMany(
      {
        court: waitlistEntry.court,
        desiredDate: waitlistEntry.desiredDate,
        desiredStartTime: waitlistEntry.desiredStartTime,
        desiredEndTime: waitlistEntry.desiredEndTime,
        position: { $gt: waitlistEntry.position },
        status: 'waiting'
      },
      { $inc: { position: -1 } }
    );

    res.status(200).json({
      success: true,
      message: 'Removed from waitlist successfully'
    });
  } catch (error) {
    console.error('Leave waitlist error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/waitlist/notify-next
// @desc    Notify next person in waitlist (called when booking cancelled)
// @access  Private
router.post('/notify-next', protect, async (req, res) => {
  try {
    const { courtId, date, startTime, endTime } = req.body;

    // Find next person in waitlist
    const nextInLine = await Waitlist.findOne({
      court: courtId,
      desiredDate: new Date(date),
      desiredStartTime: startTime,
      desiredEndTime: endTime,
      status: 'waiting'
    })
      .sort({ position: 1 })
      .populate('user', 'name email')
      .populate('court', 'name type');

    if (!nextInLine) {
      return res.status(404).json({
        success: false,
        message: 'No one in waitlist for this slot'
      });
    }

    // Update status to notified
    nextInLine.status = 'notified';
    nextInLine.notifiedAt = new Date();
    await nextInLine.save();

    // Send notification email
    if (nextInLine.user.email) {
      await sendWaitlistNotification(nextInLine.user.email, {
        courtName: nextInLine.court.name,
        courtId: courtId,
        date: new Date(date).toLocaleDateString(),
        startTime: startTime,
        endTime: endTime
      });
    }

    res.status(200).json({
      success: true,
      message: 'Next person notified successfully',
      notifiedUser: {
        name: nextInLine.user.name,
        email: nextInLine.user.email
      }
    });
  } catch (error) {
    console.error('Notify waitlist error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;
