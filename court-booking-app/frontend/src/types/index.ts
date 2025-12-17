export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  createdAt: string;
}

export interface Court {
  _id: string;
  name: string;
  type: 'indoor' | 'outdoor';
  sport: string;
  hourlyBaseRate: number;
  features: string[];
  status: 'active' | 'maintenance' | 'disabled';
  availability: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Equipment {
  _id: string;
  name: string;
  type: 'racket' | 'shoes' | 'other';
  totalQuantity: number;
  availableQuantity: number;
  hourlyRate: number;
  description?: string;
  status: 'available' | 'unavailable';
  createdAt: string;
  updatedAt: string;
}

export interface Coach {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  specialties: string[];
  hourlyRate: number;
  bio?: string;
  availability: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  _id: string;
  user: User;
  court: Court;
  equipment: Array<{
    item: Equipment;
    quantity: number;
  }>;
  coach?: Coach;
  startTime: string;
  endTime: string;
  duration: number;
  pricing: {
    courtFee: number;
    equipmentFee: number;
    coachFee: number;
    baseTotal: number;
    appliedRules: Array<{
      ruleId: string;
      ruleName: string;
      multiplier: number;
    }>;
    finalTotal: number;
  };
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  version: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PricingRule {
  _id: string;
  name: string;
  description?: string;
  type: 'time-based' | 'day-based' | 'court-type' | 'seasonal' | 'custom';
  conditions: {
    startHour?: number;
    endHour?: number;
    daysOfWeek?: number[];
    courtTypes?: string[];
    startDate?: string;
    endDate?: string;
    custom?: any;
  };
  multiplier: number;
  priority: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Waitlist {
  _id: string;
  user: User;
  court: Court;
  desiredDate: string;
  desiredStartTime: string;
  desiredEndTime: string;
  equipment: Array<{
    item: Equipment;
    quantity: number;
  }>;
  coach?: Coach;
  position: number;
  status: 'waiting' | 'notified' | 'expired' | 'converted';
  notifiedAt?: string;
  expiresAt: string;
  createdAt: string;
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
}

export interface BookingData {
  courtId: string;
  equipmentItems?: Array<{
    item: string;
    quantity: number;
  }>;
  coachId?: string;
  startTime: string;
  endTime: string;
  notes?: string;
}
