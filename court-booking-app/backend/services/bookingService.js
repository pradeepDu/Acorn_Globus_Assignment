const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const { calculatePrice } = require('./pricingService');
const { checkMultiResourceAvailability } = require('./availabilityService');
const { sendBookingConfirmation } = require('../utils/emailService');

// Create a new booking with atomic transaction
const createBooking = async (userId, bookingData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { courtId, equipmentItems, coachId, startTime, endTime, notes, phone } = bookingData;

    // Step 1: Check availability of all resources
    const availabilityCheck = await checkMultiResourceAvailability(
      courtId,
      coachId,
      equipmentItems,
      new Date(startTime),
      new Date(endTime)
    );

    if (!availabilityCheck.available) {
      throw new Error(availabilityCheck.message);
    }

    // Step 2: Calculate pricing
    const pricingResult = await calculatePrice(
      courtId,
      equipmentItems,
      coachId,
      startTime,
      endTime
    );

    if (!pricingResult.success) {
      throw new Error(pricingResult.message);
    }

    // Step 3: Update user phone if provided
    if (phone) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(
        userId,
        { phone: phone },
        { session }
      );
    }

    // Step 4: Create booking
    const booking = new Booking({
      user: userId,
      court: courtId,
      equipment: equipmentItems || [],
      coach: coachId || null,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration: pricingResult.pricing.duration,
      pricing: pricingResult.pricing,
      status: 'confirmed',
      phone: phone || '',
      notes: notes || '',
      version: 0
    });

    await booking.save({ session });

    // Step 5: Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Populate booking details
    await booking.populate([
      { path: 'court', select: 'name type' },
      { path: 'equipment.item', select: 'name type' },
      { path: 'coach', select: 'name email' },
      { path: 'user', select: 'name email' }
    ]);

    // Send confirmation email (async, don't wait)
    if (booking.user.email) {
      const court = await Court.findById(courtId);
      sendBookingConfirmation(booking.user.email, {
        courtName: court?.name || 'Court',
        date: new Date(startTime).toLocaleDateString(),
        startTime: new Date(startTime).toLocaleTimeString(),
        endTime: new Date(endTime).toLocaleTimeString(),
        coach: booking.coach?.name || null,
        equipment: equipmentItems?.map(e => e.name).join(', ') || null,
        totalAmount: pricingResult.pricing.finalTotal
      }).catch(err => console.error('Email send failed:', err));
    }

    return {
      success: true,
      booking
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return {
      success: false,
      message: error.message
    };
  }
};

// Cancel a booking
const cancelBooking = async (bookingId, userId, isAdmin = false) => {
  try {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check if user owns the booking or is admin
    if (!isAdmin && booking.user.toString() !== userId.toString()) {
      throw new Error('Not authorized to cancel this booking');
    }

    // Check if booking can be cancelled (not already cancelled or completed)
    if (booking.status === 'cancelled') {
      throw new Error('Booking is already cancelled');
    }

    if (booking.status === 'completed') {
      throw new Error('Cannot cancel a completed booking');
    }

    booking.status = 'cancelled';
    await booking.save();

    // Process waitlist for this slot
    await processWaitlist(booking);

    return {
      success: true,
      booking
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

// Get user bookings
const getUserBookings = async (userId, filters = {}) => {
  try {
    const query = { user: userId };

    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.startDate && filters.endDate) {
      query.startTime = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    const bookings = await Booking.find(query)
      .populate('court', 'name type')
      .populate('equipment.item', 'name type')
      .populate('coach', 'name')
      .sort({ startTime: -1 });

    return {
      success: true,
      bookings
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

// Get booking by ID
const getBookingById = async (bookingId, userId, isAdmin = false) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('court')
      .populate('equipment.item')
      .populate('coach')
      .populate('user', 'name email phone');

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check authorization
    if (!isAdmin && booking.user._id.toString() !== userId.toString()) {
      throw new Error('Not authorized to view this booking');
    }

    return {
      success: true,
      booking
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

// Update booking (reschedule)
const updateBooking = async (bookingId, userId, updateData, isAdmin = false) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(bookingId).session(session);

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check authorization
    if (!isAdmin && booking.user.toString() !== userId.toString()) {
      throw new Error('Not authorized to update this booking');
    }

    // Check version for optimistic locking
    if (updateData.version !== undefined && booking.version !== updateData.version) {
      throw new Error('Booking has been modified by another process. Please refresh and try again.');
    }

    // If rescheduling, check availability
    if (updateData.startTime || updateData.endTime) {
      const newStartTime = updateData.startTime ? new Date(updateData.startTime) : booking.startTime;
      const newEndTime = updateData.endTime ? new Date(updateData.endTime) : booking.endTime;

      const availabilityCheck = await checkMultiResourceAvailability(
        booking.court,
        booking.coach,
        booking.equipment,
        newStartTime,
        newEndTime,
        bookingId // Exclude current booking from availability check
      );

      if (!availabilityCheck.available) {
        throw new Error(availabilityCheck.message);
      }

      // Recalculate pricing
      const pricingResult = await calculatePrice(
        booking.court,
        booking.equipment,
        booking.coach,
        newStartTime,
        newEndTime
      );

      if (!pricingResult.success) {
        throw new Error(pricingResult.message);
      }

      booking.startTime = newStartTime;
      booking.endTime = newEndTime;
      booking.duration = pricingResult.pricing.duration;
      booking.pricing = pricingResult.pricing;
    }

    // Update other fields
    if (updateData.notes !== undefined) {
      booking.notes = updateData.notes;
    }

    await booking.save({ session });
    await session.commitTransaction();
    session.endSession();

    await booking.populate([
      { path: 'court', select: 'name type' },
      { path: 'equipment.item', select: 'name type' },
      { path: 'coach', select: 'name' }
    ]);

    return {
      success: true,
      booking
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return {
      success: false,
      message: error.message
    };
  }
};

// Process waitlist when a booking is cancelled
const processWaitlist = async (cancelledBooking) => {
  try {
    const Waitlist = require('../models/Waitlist');
    
    // Format time as HH:mm using native JavaScript
    const formatTime = (date) => {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };
    
    // Find waitlist entries for the same slot
    const waitlistEntries = await Waitlist.find({
      court: cancelledBooking.court,
      desiredDate: {
        $gte: new Date(cancelledBooking.startTime).setHours(0, 0, 0, 0),
        $lt: new Date(cancelledBooking.startTime).setHours(23, 59, 59, 999)
      },
      desiredStartTime: formatTime(new Date(cancelledBooking.startTime)),
      desiredEndTime: formatTime(new Date(cancelledBooking.endTime)),
      status: 'waiting'
    }).sort({ position: 1 }).populate('user');

    if (waitlistEntries.length === 0) return;

    // Get the first person in queue
    const firstInQueue = waitlistEntries[0];

    // Create booking for them automatically
    const newBooking = await createBooking(firstInQueue.user._id, {
      courtId: firstInQueue.court.toString(),
      startTime: new Date(cancelledBooking.startTime),
      endTime: new Date(cancelledBooking.endTime),
      equipmentItems: firstInQueue.equipment,
      coachId: firstInQueue.coach,
      notes: 'Auto-booked from waitlist',
      phone: firstInQueue.user.phone
    });

    if (newBooking.success) {
      // Update waitlist entry
      firstInQueue.status = 'converted';
      await firstInQueue.save();

      // Notify user via email
      const { sendWaitlistNotification } = require('../utils/emailService');
      const startDate = new Date(cancelledBooking.startTime);
      sendWaitlistNotification(firstInQueue.user.email, {
        courtName: cancelledBooking.court.name || 'Court',
        date: startDate.toLocaleDateString(),
        startTime: startDate.toLocaleTimeString(),
        endTime: new Date(cancelledBooking.endTime).toLocaleTimeString()
      }).catch(err => console.error('Waitlist notification failed:', err));

      // Update positions for remaining waitlist entries
      for (let i = 1; i < waitlistEntries.length; i++) {
        waitlistEntries[i].position = i;
        await waitlistEntries[i].save();
      }
    }
  } catch (error) {
    console.error('Process waitlist error:', error);
  }
};

module.exports = {
  createBooking,
  cancelBooking,
  getUserBookings,
  getBookingById,
  updateBooking
};
