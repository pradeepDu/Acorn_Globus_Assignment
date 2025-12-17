const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  court: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Court',
    required: true
  },
  equipment: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment'
    },
    quantity: {
      type: Number,
      min: 1
    }
  }],
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach'
  },
  startTime: {
    type: Date,
    required: [true, 'Please provide start time']
  },
  endTime: {
    type: Date,
    required: [true, 'Please provide end time']
  },
  duration: {
    type: Number, // in hours
    required: true
  },
  pricing: {
    courtFee: Number,
    equipmentFee: Number,
    coachFee: Number,
    baseTotal: Number,
    appliedRules: [{
      ruleId: mongoose.Schema.Types.ObjectId,
      ruleName: String,
      multiplier: Number
    }],
    finalTotal: Number
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'confirmed'
  },
  version: {
    type: Number,
    default: 0
  },
  phone: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient availability queries
bookingSchema.index({ court: 1, startTime: 1, endTime: 1, status: 1 });
bookingSchema.index({ coach: 1, startTime: 1, endTime: 1, status: 1 });
bookingSchema.index({ user: 1, createdAt: -1 });

// Optimistic locking
bookingSchema.pre('save', function() {
  this.updatedAt = Date.now();
  if (!this.isNew) {
    this.increment();
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
