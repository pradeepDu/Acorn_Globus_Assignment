const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');
const Court = require('../models/Court');

// Check court availability
const checkCourtAvailability = async (courtId, startTime, endTime, excludeBookingId = null) => {
  // First check if court exists and is active (not in maintenance)
  const court = await Court.findById(courtId);
  if (!court) {
    throw new Error('Court not found');
  }
  if (court.status === 'maintenance' || court.status === 'disabled') {
    return false; // Court is frozen or disabled
  }

  const query = {
    court: courtId,
    status: { $in: ['confirmed', 'pending'] },
    $or: [
      // New booking starts during existing booking
      { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
      // New booking ends during existing booking
      { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
      // New booking completely contains existing booking
      { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
    ]
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBookings = await Booking.find(query);
  return conflictingBookings.length === 0;
};

// Check coach availability
const checkCoachAvailability = async (coachId, startTime, endTime, excludeBookingId = null) => {
  if (!coachId) return true;

  const query = {
    coach: coachId,
    status: { $in: ['confirmed', 'pending'] },
    $or: [
      { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
      { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
      { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
    ]
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
    // Get all bookings that overlap with the requested time
    const query = {
      'equipment.item': item.item,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
        { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
        { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
      ]
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
const checkMultiResourceAvailability = async (courtId, coachId, equipmentItems, startTime, endTime, excludeBookingId = null) => {
  // Check court availability
  const courtAvailable = await checkCourtAvailability(courtId, startTime, endTime, excludeBookingId);
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
const getAvailableSlots = async (courtId, date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get all bookings for this court on this date
  const bookings = await Booking.find({
    court: courtId,
    status: { $in: ['confirmed', 'pending'] },
    startTime: { $gte: startOfDay, $lte: endOfDay }
  }).sort({ startTime: 1 });

  // Generate available slots (assuming 1-hour slots from 6 AM to 10 PM)
  const slots = [];
  const startHour = 6;
  const endHour = 22;

  for (let hour = startHour; hour < endHour; hour++) {
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);

    const slotEnd = new Date(date);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    // Check if this slot conflicts with any booking
    const isBooked = bookings.some(booking => {
      return (
        (booking.startTime <= slotStart && booking.endTime > slotStart) ||
        (booking.startTime < slotEnd && booking.endTime >= slotEnd) ||
        (booking.startTime >= slotStart && booking.endTime <= slotEnd)
      );
    });

    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      available: !isBooked
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
