const Waitlist = require('../models/Waitlist');
const User = require('../models/User');
const { sendWaitlistNotification } = require('../utils/emailService');

/**
 * @desc    Join waitlist
 * @route   POST /api/waitlist
 * @access  Private
 */
exports.joinWaitlist = async (req, res) => {
  try {
    const { courtId, desiredDate, desiredStartTime, desiredEndTime, equipmentItems, coachId, phone, notes } = req.body;

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

    // Update user's phone number if provided and different
    if (phone && req.user.phone !== phone) {
      await User.findByIdAndUpdate(req.user.id, { phone: phone });
    }

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
      phone: phone,
      notes: notes || '',
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
};

/**
 * @desc    Get user's waitlist entries
 * @route   GET /api/waitlist
 * @access  Private
 */
exports.getUserWaitlist = async (req, res) => {
  try {
    const { status } = req.query;

    const query = { user: req.user.id };
    if (status) query.status = status;

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
};

/**
 * @desc    Remove from waitlist
 * @route   DELETE /api/waitlist/:id
 * @access  Private
 */
exports.removeFromWaitlist = async (req, res) => {
  try {
    const waitlistEntry = await Waitlist.findById(req.params.id);

    if (!waitlistEntry) {
      return res.status(404).json({
        success: false,
        message: 'Waitlist entry not found'
      });
    }

    // Check if user owns this waitlist entry (or is admin)
    if (waitlistEntry.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove this entry'
      });
    }

    await waitlistEntry.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Removed from waitlist successfully'
    });
  } catch (error) {
    console.error('Remove from waitlist error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Notify next person in waitlist
 * @route   POST /api/waitlist/notify-next
 * @access  Private
 */
exports.notifyNextInWaitlist = async (req, res) => {
  try {
    const { courtId, date, startTime, endTime } = req.body;

    // Find the next waiting person
    const nextEntry = await Waitlist.findOne({
      court: courtId,
      desiredDate: new Date(date),
      desiredStartTime: startTime,
      desiredEndTime: endTime,
      status: 'waiting'
    })
      .sort({ position: 1 })
      .populate('user', 'name email phone')
      .populate('court', 'name type');

    if (!nextEntry) {
      return res.status(404).json({
        success: false,
        message: 'No one in waitlist for this slot'
      });
    }

    // Send notification
    const emailResult = await sendWaitlistNotification(
      nextEntry.user.email,
      nextEntry.user.name,
      nextEntry.court.name,
      date,
      startTime,
      endTime
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send notification'
      });
    }

    // Update waitlist entry status
    nextEntry.status = 'notified';
    nextEntry.notifiedAt = new Date();
    await nextEntry.save();

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      waitlistEntry: nextEntry
    });
  } catch (error) {
    console.error('Notify waitlist error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
