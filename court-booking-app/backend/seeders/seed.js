require('dotenv').config();
const mongoose = require('mongoose');
const Court = require('../models/Court');
const Equipment = require('../models/Equipment');
const Coach = require('../models/Coach');
const PricingRule = require('../models/PricingRule');
const User = require('../models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await Court.deleteMany({});
    await Equipment.deleteMany({});
    await Coach.deleteMany({});
    await PricingRule.deleteMany({});
    await User.deleteMany({});

    // Create super admin user
    console.log('Creating super admin user...');
    const adminUser = await User.create({
      name: 'Super Admin',
      email: process.env.SUPER_ADMIN_EMAIL , //Add your own valid email in env
      role: 'admin',
      isVerified: true
    });
    console.log('Super admin user created:', adminUser.email);

    // Create Courts (2 indoor, 2 outdoor)
    console.log('Creating courts...');
    const courts = await Court.insertMany([
      {
        name: 'Indoor Court 1',
        type: 'indoor',
        sport: 'badminton',
        hourlyBaseRate: 500,
        features: ['Air Conditioned', 'LED Lighting', 'Premium Flooring'],
        status: 'active',
        availability: [
          { dayOfWeek: 0, startTime: '06:00', endTime: '22:00' },
          { dayOfWeek: 1, startTime: '06:00', endTime: '22:00' },
          { dayOfWeek: 2, startTime: '06:00', endTime: '22:00' },
          { dayOfWeek: 3, startTime: '06:00', endTime: '22:00' },
          { dayOfWeek: 4, startTime: '06:00', endTime: '22:00' },
          { dayOfWeek: 5, startTime: '06:00', endTime: '23:00' },
          { dayOfWeek: 6, startTime: '06:00', endTime: '23:00' }
        ]
      },
      {
        name: 'Indoor Court 2',
        type: 'indoor',
        sport: 'badminton',
        hourlyBaseRate: 500,
        features: ['Air Conditioned', 'LED Lighting', 'Premium Flooring'],
        status: 'active',
        availability: [
          { dayOfWeek: 0, startTime: '06:00', endTime: '22:00' },
          { dayOfWeek: 1, startTime: '06:00', endTime: '22:00' },
          { dayOfWeek: 2, startTime: '06:00', endTime: '22:00' },
          { dayOfWeek: 3, startTime: '06:00', endTime: '22:00' },
          { dayOfWeek: 4, startTime: '06:00', endTime: '22:00' },
          { dayOfWeek: 5, startTime: '06:00', endTime: '23:00' },
          { dayOfWeek: 6, startTime: '06:00', endTime: '23:00' }
        ]
      },
      {
        name: 'Outdoor Court 1',
        type: 'outdoor',
        sport: 'badminton',
        hourlyBaseRate: 300,
        features: ['Natural Lighting', 'Fresh Air'],
        status: 'active',
        availability: [
          { dayOfWeek: 0, startTime: '06:00', endTime: '20:00' },
          { dayOfWeek: 1, startTime: '06:00', endTime: '20:00' },
          { dayOfWeek: 2, startTime: '06:00', endTime: '20:00' },
          { dayOfWeek: 3, startTime: '06:00', endTime: '20:00' },
          { dayOfWeek: 4, startTime: '06:00', endTime: '20:00' },
          { dayOfWeek: 5, startTime: '06:00', endTime: '21:00' },
          { dayOfWeek: 6, startTime: '06:00', endTime: '21:00' }
        ]
      },
      {
        name: 'Outdoor Court 2',
        type: 'outdoor',
        sport: 'badminton',
        hourlyBaseRate: 300,
        features: ['Natural Lighting', 'Fresh Air'],
        status: 'active',
        availability: [
          { dayOfWeek: 0, startTime: '06:00', endTime: '20:00' },
          { dayOfWeek: 1, startTime: '06:00', endTime: '20:00' },
          { dayOfWeek: 2, startTime: '06:00', endTime: '20:00' },
          { dayOfWeek: 3, startTime: '06:00', endTime: '20:00' },
          { dayOfWeek: 4, startTime: '06:00', endTime: '20:00' },
          { dayOfWeek: 5, startTime: '06:00', endTime: '21:00' },
          { dayOfWeek: 6, startTime: '06:00', endTime: '21:00' }
        ]
      }
    ]);
    console.log(`${courts.length} courts created`);

    // Create Equipment dummy data
    console.log('Creating equipment...');
    const equipment = await Equipment.insertMany([
      {
        name: 'Professional Badminton Racket',
        type: 'racket',
        totalQuantity: 10,
        availableQuantity: 10,
        hourlyRate: 50,
        description: 'High-quality professional badminton rackets',
        status: 'available'
      },
      {
        name: 'Beginner Badminton Racket',
        type: 'racket',
        totalQuantity: 15,
        availableQuantity: 15,
        hourlyRate: 30,
        description: 'Suitable for beginners and casual players',
        status: 'available'
      },
      {
        name: 'Non-Marking Court Shoes (Size 7-9)',
        type: 'shoes',
        totalQuantity: 8,
        availableQuantity: 8,
        hourlyRate: 40,
        description: 'Professional non-marking court shoes',
        status: 'available'
      },
      {
        name: 'Non-Marking Court Shoes (Size 10-12)',
        type: 'shoes',
        totalQuantity: 8,
        availableQuantity: 8,
        hourlyRate: 40,
        description: 'Professional non-marking court shoes',
        status: 'available'
      },
      {
        name: 'Shuttlecock Set (12 pieces)',
        type: 'other',
        totalQuantity: 20,
        availableQuantity: 20,
        hourlyRate: 20,
        description: 'Premium feather shuttlecocks',
        status: 'available'
      }
    ]);
    console.log(`${equipment.length} equipment items created`);

    // Create Coaches
    console.log('Creating coaches...');
    const coaches = await Coach.insertMany([
      {
        name: 'Rajesh Kumar',
        email: 'rajesh@courtbooking.com',
        phone: '+91-9876543210',
        specialties: ['Singles Strategy', 'Smash Technique', 'Footwork'],
        hourlyRate: 800,
        bio: 'Former national level player with 10+ years coaching experience',
        status: 'active',
        availability: [
          { dayOfWeek: 1, startTime: '06:00', endTime: '12:00' },
          { dayOfWeek: 3, startTime: '06:00', endTime: '12:00' },
          { dayOfWeek: 5, startTime: '06:00', endTime: '12:00' },
          { dayOfWeek: 6, startTime: '08:00', endTime: '14:00' }
        ]
      },
      {
        name: 'Priya Sharma',
        email: 'priya@courtbooking.com',
        phone: '+91-9876543211',
        specialties: ['Doubles Strategy', 'Defense Techniques', 'Beginners Training'],
        hourlyRate: 700,
        bio: 'State champion and certified coach specializing in doubles play',
        status: 'active',
        availability: [
          { dayOfWeek: 2, startTime: '16:00', endTime: '21:00' },
          { dayOfWeek: 4, startTime: '16:00', endTime: '21:00' },
          { dayOfWeek: 6, startTime: '10:00', endTime: '18:00' },
          { dayOfWeek: 0, startTime: '10:00', endTime: '18:00' }
        ]
      },
      {
        name: 'Amit Verma',
        email: 'amit@courtbooking.com',
        phone: '+91-9876543212',
        specialties: ['Fitness Training', 'Advanced Techniques', 'Tournament Preparation'],
        hourlyRate: 1000,
        bio: 'International player and fitness expert with 15+ years experience',
        status: 'active',
        availability: [
          { dayOfWeek: 1, startTime: '17:00', endTime: '21:00' },
          { dayOfWeek: 3, startTime: '17:00', endTime: '21:00' },
          { dayOfWeek: 5, startTime: '17:00', endTime: '21:00' },
          { dayOfWeek: 0, startTime: '08:00', endTime: '13:00' }
        ]
      }
    ]);
    console.log(`${coaches.length} coaches created`);

    // Create Pricing Rules
    console.log('Creating pricing rules...');
    const pricingRules = await PricingRule.insertMany([
      {
        name: 'Peak Hours (6-9 PM)',
        description: '50% surcharge during evening peak hours',
        type: 'time-based',
        conditions: {
          startHour: 18,
          endHour: 21
        },
        multiplier: 1.5,
        priority: 100,
        active: true
      },
      {
        name: 'Weekend Premium',
        description: '30% surcharge on weekends (Saturday & Sunday)',
        type: 'day-based',
        conditions: {
          daysOfWeek: [0, 6] // Sunday and Saturday
        },
        multiplier: 1.3,
        priority: 90,
        active: true
      },
      {
        name: 'Indoor Court Premium',
        description: '20% premium for indoor courts',
        type: 'court-type',
        conditions: {
          courtTypes: ['indoor']
        },
        multiplier: 1.2,
        priority: 80,
        active: true
      },
      {
        name: 'Early Bird Discount',
        description: '15% discount for morning slots (6-9 AM)',
        type: 'time-based',
        conditions: {
          startHour: 6,
          endHour: 9
        },
        multiplier: 0.85,
        priority: 70,
        active: true
      },
      {
        name: 'Weekday Afternoon Discount',
        description: '10% discount for weekday afternoons (12-4 PM)',
        type: 'time-based',
        conditions: {
          startHour: 12,
          endHour: 16,
          daysOfWeek: [1, 2, 3, 4, 5] // Monday to Friday
        },
        multiplier: 0.9,
        priority: 60,
        active: true
      }
    ]);
    console.log(`${pricingRules.length} pricing rules created`);

    console.log('\n Seed data created successfully!');
    console.log('\nSummary:');
    console.log(`   - Courts: ${courts.length} (2 indoor, 2 outdoor)`);
    console.log(`   - Equipment: ${equipment.length} items`);
    console.log(`   - Coaches: ${coaches.length}`);
    console.log(`   - Pricing Rules: ${pricingRules.length}`);
    console.log(`   - Users: 1 (super admin only)`);
    console.log('\n Login Credentials:');
    console.log(`   Super Admin: ${adminUser.email}`);
    console.log(`   ${process.env.NODE_ENV === 'development' ? 'Dev Mode: Use OTP 123456 for any email' : 'Use OTP sent to email'}`);
    console.log('\n To test: Request OTP for either email to login');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
