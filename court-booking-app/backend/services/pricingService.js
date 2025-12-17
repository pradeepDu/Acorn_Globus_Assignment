const PricingRule = require('../models/PricingRule');
const Court = require('../models/Court');
const Equipment = require('../models/Equipment');
const Coach = require('../models/Coach');

// Calculate booking price
const calculatePrice = async (courtId, equipmentItems, coachId, startTime, endTime) => {
  try {
    // Calculate duration in hours
    const durationMs = new Date(endTime) - new Date(startTime);
    const duration = durationMs / (1000 * 60 * 60); // Convert to hours

    // Get court base rate
    const court = await Court.findById(courtId);
    if (!court) {
      throw new Error('Court not found');
    }

    const courtFee = court.hourlyBaseRate * duration;

    // Calculate equipment fee
    let equipmentFee = 0;
    if (equipmentItems && equipmentItems.length > 0) {
      for (const item of equipmentItems) {
        const equipment = await Equipment.findById(item.item);
        if (equipment) {
          equipmentFee += equipment.hourlyRate * item.quantity * duration;
        }
      }
    }

    // Calculate coach fee
    let coachFee = 0;
    if (coachId) {
      const coach = await Coach.findById(coachId);
      if (coach) {
        coachFee = coach.hourlyRate * duration;
      }
    }

    const baseTotal = courtFee + equipmentFee + coachFee;

    // Get active pricing rules sorted by priority
    const pricingRules = await PricingRule.find({ active: true }).sort({ priority: -1 });

    // Evaluate applicable rules
    const appliedRules = [];
    const bookingDate = new Date(startTime);
    const bookingHour = bookingDate.getHours();
    const bookingDay = bookingDate.getDay();

    for (const rule of pricingRules) {
      let applies = false;

      switch (rule.type) {
        case 'time-based':
          // Check if booking time falls within rule hours
          if (
            rule.conditions.startHour !== undefined &&
            rule.conditions.endHour !== undefined
          ) {
            applies = bookingHour >= rule.conditions.startHour && 
                     bookingHour < rule.conditions.endHour;
          }
          break;

        case 'day-based':
          // Check if booking day matches rule days
          if (rule.conditions.daysOfWeek && rule.conditions.daysOfWeek.length > 0) {
            applies = rule.conditions.daysOfWeek.includes(bookingDay);
          } else {
            applies = true; // If no specific days, applies to all
          }
          break;

        case 'court-type':
          // Check if court type matches rule
          if (rule.conditions.courtTypes && rule.conditions.courtTypes.length > 0) {
            applies = rule.conditions.courtTypes.includes(court.type);
          }
          break;

        case 'seasonal':
          // Check if current date falls within date range
          if (rule.conditions.startDate && rule.conditions.endDate) {
            const ruleStart = new Date(rule.conditions.startDate);
            const ruleEnd = new Date(rule.conditions.endDate);
            applies = bookingDate >= ruleStart && bookingDate <= ruleEnd;
          }
          break;

        case 'custom':
          // Custom logic can be added here
          applies = false;
          break;
      }

      if (applies) {
        appliedRules.push({
          ruleId: rule._id,
          ruleName: rule.name,
          multiplier: rule.multiplier
        });
      }
    }

    // Calculate final total by applying all rule multipliers
    let finalTotal = baseTotal;
    
    // Strategy: Multiply all applicable rule multipliers (stacking)
    for (const rule of appliedRules) {
      finalTotal *= rule.multiplier;
    }

    // Round to 2 decimal places
    finalTotal = Math.round(finalTotal * 100) / 100;

    return {
      success: true,
      pricing: {
        courtFee: Math.round(courtFee * 100) / 100,
        equipmentFee: Math.round(equipmentFee * 100) / 100,
        coachFee: Math.round(coachFee * 100) / 100,
        baseTotal: Math.round(baseTotal * 100) / 100,
        appliedRules,
        finalTotal,
        duration
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

// Preview price calculation (for frontend)
const previewPrice = async (courtId, equipmentItems, coachId, startTime, endTime) => {
  return await calculatePrice(courtId, equipmentItems, coachId, startTime, endTime);
};

// Evaluate if a specific rule applies to a booking
const evaluateRule = (rule, bookingData) => {
  const { startTime, courtType } = bookingData;
  const bookingDate = new Date(startTime);
  const bookingHour = bookingDate.getHours();
  const bookingDay = bookingDate.getDay();

  switch (rule.type) {
    case 'time-based':
      if (rule.conditions.startHour !== undefined && rule.conditions.endHour !== undefined) {
        return bookingHour >= rule.conditions.startHour && bookingHour < rule.conditions.endHour;
      }
      break;

    case 'day-based':
      if (rule.conditions.daysOfWeek && rule.conditions.daysOfWeek.length > 0) {
        return rule.conditions.daysOfWeek.includes(bookingDay);
      }
      return true;

    case 'court-type':
      if (rule.conditions.courtTypes && rule.conditions.courtTypes.length > 0) {
        return rule.conditions.courtTypes.includes(courtType);
      }
      break;

    case 'seasonal':
      if (rule.conditions.startDate && rule.conditions.endDate) {
        const ruleStart = new Date(rule.conditions.startDate);
        const ruleEnd = new Date(rule.conditions.endDate);
        return bookingDate >= ruleStart && bookingDate <= ruleEnd;
      }
      break;
  }

  return false;
};

module.exports = {
  calculatePrice,
  previewPrice,
  evaluateRule
};
