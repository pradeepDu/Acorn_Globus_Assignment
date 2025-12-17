import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingsAPI } from '../services/api';
import { type Booking } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar, Clock, MapPin, User, Package, X, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(searchParams.get('success') === 'true');

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const response = await bookingsAPI.getAll();
      let filtered = response.data.bookings;

      if (filter === 'upcoming') {
        filtered = filtered.filter((b: Booking) => 
          new Date(b.startTime) > new Date() && b.status === 'confirmed'
        );
      } else if (filter === 'past') {
        filtered = filtered.filter((b: Booking) => 
          new Date(b.startTime) < new Date() || b.status === 'completed' || b.status === 'cancelled'
        );
      }

      setBookings(filtered);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await bookingsAPI.cancel(bookingId);
      loadBookings();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Booking confirmed successfully!</span>
          </div>
          <button onClick={() => setShowSuccess(false)} className="text-green-600 hover:text-green-800">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}!</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All Bookings
        </Button>
        <Button
          variant={filter === 'upcoming' ? 'default' : 'outline'}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </Button>
        <Button
          variant={filter === 'past' ? 'default' : 'outline'}
          onClick={() => setFilter('past')}
        >
          Past
        </Button>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking._id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-primary" />
                    {booking.court.name}
                  </CardTitle>
                  <CardDescription>
                    Booking ID: {booking._id.slice(-8)}
                  </CardDescription>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.status)}`}>
                  {booking.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    Date
                  </div>
                  <div className="font-semibold">
                    {format(new Date(booking.startTime), 'MMM dd, yyyy')}
                  </div>
                </div>
                <div>
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <Clock className="h-4 w-4 mr-1" />
                    Time
                  </div>
                  <div className="font-semibold">
                    {format(new Date(booking.startTime), 'HH:mm')} - {format(new Date(booking.endTime), 'HH:mm')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Duration</div>
                  <div className="font-semibold">{booking.duration} hour(s)</div>
                </div>
              </div>

              {booking.equipment && booking.equipment.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <Package className="h-4 w-4 mr-1" />
                    Equipment
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {booking.equipment.map((eq, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-sm rounded">
                        {eq.item.name} × {eq.quantity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {booking.coach && (
                <div className="mb-4">
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <User className="h-4 w-4 mr-1" />
                    Coach
                  </div>
                  <div className="font-semibold">{booking.coach.name}</div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                  <div className="text-2xl font-bold text-primary">
                    ₹{booking.pricing.finalTotal}
                  </div>
                </div>
                {booking.status === 'confirmed' && new Date(booking.startTime) > new Date() && (
                  <Button
                    variant="destructive"
                    onClick={() => handleCancelBooking(booking._id)}
                  >
                    Cancel Booking
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {bookings.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No bookings found</p>
              <Button onClick={() => window.location.href = '/courts'}>
                Book Your First Court
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
