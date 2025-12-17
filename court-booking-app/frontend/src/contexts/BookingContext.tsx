import React, { createContext, useContext, useState } from 'react';
import type { BookingData } from '../types';

interface BookingContextType {
  bookingData: Partial<BookingData>;
  updateBookingData: (data: Partial<BookingData>) => void;
  resetBookingData: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({});

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...data }));
  };

  const resetBookingData = () => {
    setBookingData({});
  };

  return (
    <BookingContext.Provider value={{ bookingData, updateBookingData, resetBookingData }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
