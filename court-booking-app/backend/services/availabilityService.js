const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');
const Court = require('../models/Court');
const Reservation = require('../models/Reservation');

// Check court availability
const checkCourtAvailability = async (courtId, startTime, endTime, excludeBookingId = null, excludeUserId = null) => {
  // First check if court exists and is active (not in maintenance)
  const court = await Court.findById(courtId);
  if (!court) {
    throw new Error('Court not found');
  }
  if (court.status === 'maintenance' || court.status === 'disabled') {
    return false; // Court is frozen or disabled
  }

  // Use standard interval overlap formula: intervals [a1,a2) and [b1,b2) overlap if a1 < b2 AND b1 < a2
  // This correctly allows consecutive bookings (e.g., 1-2 PM, then 2-3 PM)
  const query = {
    court: courtId,
    status: { $in: ['confirmed', 'pending'] },
    startTime: { $lt: endTime },      // existing starts before new ends
    endTime: { $gt: startTime }        // existing ends after new starts
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBookings = await Booking.find(query);
  
  // Also check for active reservations by other users
  // Use same overlap formula for consistency
  const reservationQuery = {
    court: courtId,
    status: 'active',
    expiresAt: { $gt: new Date() },
    startTime: { $lt: endTime },      // reservation starts before new ends
    endTime: { $gt: startTime }        // reservation ends after new starts
  };

  // Exclude reservations by the current user
  if (excludeUserId) {
    reservationQuery.user = { $ne: excludeUserId };
  }

  const conflictingReservations = await Reservation.find(reservationQuery);
  
  return conflictingBookings.length === 0 && conflictingReservations.length === 0;
};

// Check coach availability
const checkCoachAvailability = async (coachId, startTime, endTime, excludeBookingId = null) => {
  if (!coachId) return true;

  // Use standard overlap formula for coach availability too
  const query = {
    coach: coachId,
    status: { $in: ['confirmed', 'pending'] },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBookings = await Booking.find(query);
  return conflictingBookings.length === 0;
};

// Check equipment availability
const checkEquipmentAvailability = async (equipmentItems, startTime, endTime, excludeBookingId = null) => {
  if (!equipmentItems || equipmentItems.length === 0) return { available: true };

  for (const item of equipmentItems) {
    // Get all bookings that overlap with the requested time using standard formula
    const query = {
      'equipment.item': item.item,
      status: { $in: ['confirmed', 'pending'] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const overlappingBookings = await Booking.find(query);

    // Calculate total quantity booked during this time
    const totalBooked = overlappingBookings.reduce((sum, booking) => {
      const equipmentInBooking = booking.equipment.find(
        e => e.item.toString() === item.item.toString()
      );
      return sum + (equipmentInBooking?.quantity || 0);
    }, 0);

    // Get equipment total quantity
    const equipment = await Equipment.findById(item.item);
    if (!equipment) {
      return {
        available: false,
        message: `Equipment not found: ${item.item}`
      };
    }

    const availableQuantity = equipment.totalQuantity - totalBooked;

    if (availableQuantity < item.quantity) {
      return {
        available: false,
        message: `Insufficient ${equipment.name} available. Requested: ${item.quantity}, Available: ${availableQuantity}`
      };
    }
  }

  return { available: true };
};

// Check all resources availability (atomic check)
const checkMultiResourceAvailability = async (courtId, coachId, equipmentItems, startTime, endTime, excludeBookingId = null, excludeUserId = null) => {
  // Check court availability
  const courtAvailable = await checkCourtAvailability(courtId, startTime, endTime, excludeBookingId, excludeUserId);
  if (!courtAvailable) {
    return {
      available: false,
      message: 'Court is not available for the selected time slot'
    };
  }

  // Check coach availability
  const coachAvailable = await checkCoachAvailability(coachId, startTime, endTime, excludeBookingId);
  if (!coachAvailable) {
    return {
      available: false,
      message: 'Coach is not available for the selected time slot'
    };
  }

  // Check equipment availability
  const equipmentCheck = await checkEquipmentAvailability(equipmentItems, startTime, endTime, excludeBookingId);
  if (!equipmentCheck.available) {
    return equipmentCheck;
  }

  return { available: true };
};

// Get available time slots for a court on a specific date
const getAvailableSlots = async (courtId, date, userId = null) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const now = new Date();

  // Get all bookings for this court on this date
  const bookings = await Booking.find({
    court: courtId,
    status: { $in: ['confirmed', 'pending'] },
    startTime: { $gte: startOfDay, $lte: endOfDay }
  }).sort({ startTime: 1 });

  // Debug: Log all bookings found (dev mode only)
  if (process.env.NODE_ENV === 'development' && bookings.length > 0) {
    console.log(`[Availability] Found ${bookings.length} bookings for court ${courtId}:`);
    bookings.forEach(b => {
      console.log(`  - User: ${b.user}, Start: ${b.startTime}, End: ${b.endTime}, Status: ${b.status}`);
    });
  }

  // Get all active reservations for this court on this date
  const reservations = await Reservation.find({
    court: courtId,
    status: 'active',
    expiresAt: { $gt: now },
    startTime: { $gte: startOfDay, $lte: endOfDay }
  }).sort({ startTime: 1 });

  // Get user's waitlist entries for this court on this date
  let userWaitlistEntries = [];
  if (userId) {
    const Waitlist = require('../models/Waitlist');
    userWaitlistEntries = await Waitlist.find({
      court: courtId,
      user: userId,
      desiredDate: { $gte: startOfDay, $lte: endOfDay },
      status: 'waiting'
    });
  }

  // Generate available slots (assuming 1-hour slots from 6 AM to 10 PM)
  const slots = [];
  const startHour = 6;
  const endHour = 22;

  for (let hour = startHour; hour < endHour; hour++) {
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);

    const slotEnd = new Date(date);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    // Check if this slot is in the past
    const isPast = slotStart <= now;

    // Check if this slot conflicts with any booking
    const booking = bookings.find(booking => {
      return (
        (booking.startTime <= slotStart && booking.endTime > slotStart) ||
        (booking.startTime < slotEnd && booking.endTime >= slotEnd) ||
        (booking.startTime >= slotStart && booking.endTime <= slotEnd)
      );
    });
    const isBooked = !!booking;
    // Ensure both IDs are strings for comparison
    const bookingUserId = booking ? booking.user.toString() : null;
    const currentUserId = userId ? userId.toString() : null;
    const isBookedByMe = isBooked && currentUserId && bookingUserId === currentUserId;
    
    // Debug logging for booked slots only (dev mode only)
    if (process.env.NODE_ENV === 'development' && isBooked && userId) {
      console.log(`[Slot Check ${hour}:00] userId: ${currentUserId}, bookingUserId: ${bookingUserId}, isBookedByMe: ${isBookedByMe}`);
    }

    // Check if this slot is reserved by another user
    const reservation = reservations.find(res => {
      return (
        (res.startTime <= slotStart && res.endTime > slotStart) ||
        (res.startTime < slotEnd && res.endTime >= slotEnd) ||
        (res.startTime >= slotStart && res.endTime <= slotEnd)
      );
    });

    const isReservedByOther = reservation && userId && reservation.user.toString() !== userId.toString();
    const isReservedByMe = reservation && userId && reservation.user.toString() === userId.toString();

    // Check if user is in waitlist for this slot
    const formatTime = (date) => {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };
    const slotStartTime = formatTime(slotStart);
    const slotEndTime = formatTime(slotEnd);
    const isInWaitlist = userWaitlistEntries.some(entry => 
      entry.desiredStartTime === slotStartTime && entry.desiredEndTime === slotEndTime
    );

    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      available: !isBooked && !isPast && !isReservedByOther,
      isPast: isPast,
      isReserved: !!reservation,
      reservedByMe: isReservedByMe,
      isBookedByMe: isBookedByMe,
      isInWaitlist: isInWaitlist
    });
  }

  return slots;
};

module.exports = {
  checkCourtAvailability,
  checkCoachAvailability,
  checkEquipmentAvailability,
  checkMultiResourceAvailability,
  getAvailableSlots
};
