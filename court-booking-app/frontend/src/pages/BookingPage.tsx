import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { courtsAPI, equipmentAPI, coachesAPI, bookingsAPI, waitlistAPI } from '../services/api';
import type { Court, Equipment, Coach, TimeSlot } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Calendar, Clock, ShoppingCart, User, Check, ArrowRight, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';

export const BookingPage: React.FC = () => {
  const { courtId } = useParams<{ courtId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [court, setCourt] = useState<Court | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Array<{ item: string; quantity: number }>>([]);
  
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<string | null>(null);
  
  const [pricing, setPricing] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Pre-fill phone if user has it saved
    if (user.phone) {
      setPhone(user.phone);
    }
    loadCourtDetails();
    loadEquipment();
    loadCoaches();
  }, [courtId, user]);

  useEffect(() => {
    if (court) {
      loadAvailability();
    }
  }, [selectedDate, court]);

  // Polling for availability updates every 10 seconds when on step 1
  useEffect(() => {
    if (step === 1 && court) {
      const pollInterval = setInterval(() => {
        loadAvailability();
      }, 10000); // Poll every 10 seconds

      return () => clearInterval(pollInterval);
    }
  }, [step, court, selectedDate]);

  useEffect(() => {
    if (selectedSlot) {
      fetchPricing();
    }
  }, [selectedSlot, selectedEquipment, selectedCoach]);

  const loadCourtDetails = async () => {
    try {
      const response = await courtsAPI.getById(courtId!);
      const courtData = response.data.court;
      
      // Check if court is under maintenance
      if (courtData.status === 'maintenance') {
        setError('This court is currently under maintenance. Please book another court.');
        setCourt(null);
        return;
      }
      
      setCourt(courtData);
    } catch (error) {
      console.error('Error loading court:', error);
      setError('Failed to load court details');
    }
  };

  const loadAvailability = async () => {
    try {
      const response = await courtsAPI.getAvailability(courtId!, selectedDate);
      setSlots(response.data.slots);
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  const loadEquipment = async () => {
    try {
      const response = await equipmentAPI.getAll();
      setEquipment(response.data.equipment);
    } catch (error) {
      console.error('Error loading equipment:', error);
    }
  };

  const loadCoaches = async () => {
    try {
      const response = await coachesAPI.getAll();
      setCoaches(response.data.coaches);
    } catch (error) {
      console.error('Error loading coaches:', error);
    }
  };

  const fetchPricing = async () => {
    if (!selectedSlot) return;

    try {
      const response = await bookingsAPI.previewPrice({
        courtId: courtId!,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        equipmentItems: selectedEquipment,
        coachId: selectedCoach
      });
      setPricing(response.data.pricing);
    } catch (error) {
      console.error('Error fetching pricing:', error);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    if (slot.available) {
      setSelectedSlot(slot);
      setStep(2);
    }
  };

  const handleJoinWaitlist = async (slot: TimeSlot) => {
    setLoading(true);
    setError('');

    try {
      const response = await waitlistAPI.join({
        courtId: courtId!,
        desiredDate: selectedDate,
        desiredStartTime: format(new Date(slot.startTime), 'HH:mm'),
        desiredEndTime: format(new Date(slot.endTime), 'HH:mm'),
        equipmentItems: selectedEquipment,
        coachId: selectedCoach
      });

      alert(`Successfully joined waitlist! You are #${response.data.waitlistEntry.position} in queue. We'll notify you if a spot opens up.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join waitlist');
    } finally {
      setLoading(false);
    }
  };

  const toggleEquipment = (equipmentId: string) => {
    setSelectedEquipment(prev => {
      const existing = prev.find(e => e.item === equipmentId);
      if (existing) {
        return prev.filter(e => e.item !== equipmentId);
      } else {
        return [...prev, { item: equipmentId, quantity: 1 }];
      }
    });
  };

  const updateEquipmentQuantity = (equipmentId: string, quantity: number) => {
    setSelectedEquipment(prev => 
      prev.map(e => e.item === equipmentId ? { ...e, quantity } : e)
    );
  };

  const handleBooking = async () => {
    setLoading(true);
    setError('');

    // Validate phone number
    if (!phone || phone.trim().length < 10) {
      setError('Please enter a valid phone number (minimum 10 digits)');
      setLoading(false);
      return;
    }

    try {
      const bookingData = {
        courtId: courtId!,
        startTime: selectedSlot!.startTime,
        endTime: selectedSlot!.endTime,
        equipmentItems: selectedEquipment,
        coachId: selectedCoach || undefined,
        notes,
        phone
      };

      await bookingsAPI.create(bookingData);
      navigate('/dashboard?success=true');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show maintenance message if court is under maintenance
  if (error && !court) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-orange-200">
          <CardHeader className="bg-orange-50">
            <CardTitle className="flex items-center text-orange-800">
              <span className="text-2xl mr-3">🔧</span>
              Court Under Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-lg text-gray-700">{error}</p>
              <div className="bg-orange-100 border border-orange-200 rounded-md p-4">
                <p className="text-sm text-orange-800">
                  This court is temporarily unavailable for bookings due to scheduled maintenance. 
                  We apologize for any inconvenience.
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => navigate('/courts')} className="flex-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  Browse Other Courts
                </Button>
                <Button onClick={() => navigate('/dashboard')} variant="outline" className="flex-1">
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!court) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading court details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Book {court.name}</h1>
        <p className="text-muted-foreground">Complete your booking in a few simple steps</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step > s ? <Check className="h-5 w-5" /> : s}
            </div>
            {s < 4 && (
              <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-primary' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Step 1: Select Date & Time */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Select Date & Time
                </CardTitle>
                <CardDescription>Choose your preferred date and time slot</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    max={format(addDays(new Date(), 30), 'yyyy-MM-dd')}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Available Time Slots</Label>
                    <span className="text-xs text-muted-foreground">Auto-refreshing...</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {slots.map((slot, idx) => (
                      <div key={idx} className="space-y-1">
                        <Button
                          variant={selectedSlot === slot ? 'default' : slot.available ? 'outline' : 'ghost'}
                          disabled={!slot.available}
                          onClick={() => handleSlotSelect(slot)}
                          className="w-full"
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          {format(new Date(slot.startTime), 'HH:mm')}
                        </Button>
                        {!slot.available && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs h-7"
                            onClick={() => handleJoinWaitlist(slot)}
                            disabled={loading}
                          >
                            Join Waitlist
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {slots.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">No slots available for this date</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Select Equipment */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Select Equipment (Optional)
                </CardTitle>
                <CardDescription>Add rackets, shoes, or other equipment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {equipment.map((item) => {
                  const selected = selectedEquipment.find(e => e.item === item._id);
                  return (
                    <div key={item._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                        <div className="text-sm font-semibold text-primary mt-1">
                          ₹{item.hourlyRate}/hour
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {selected ? (
                          <>
                            <Input
                              type="number"
                              min="1"
                              max={item.availableQuantity}
                              value={selected.quantity}
                              onChange={(e) => updateEquipmentQuantity(item._id, parseInt(e.target.value))}
                              className="w-20"
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => toggleEquipment(item._id)}
                            >
                              Remove
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => toggleEquipment(item._id)}
                            disabled={item.availableQuantity === 0}
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="flex space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={() => setStep(3)} className="flex-1">
                    Continue <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Select Coach */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Select Coach (Optional)
                </CardTitle>
                <CardDescription>Book a professional coach for your session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {coaches.map((coach) => (
                  <div
                    key={coach._id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedCoach === coach._id ? 'border-primary bg-primary/5' : 'hover:border-gray-400'
                    }`}
                    onClick={() => setSelectedCoach(selectedCoach === coach._id ? null : coach._id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-lg">{coach.name}</div>
                        <div className="text-sm text-muted-foreground mb-2">{coach.bio}</div>
                        <div className="flex flex-wrap gap-1">
                          {coach.specialties.map((spec, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">₹{coach.hourlyRate}</div>
                        <div className="text-xs text-muted-foreground">/hour</div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                  <Button onClick={() => setStep(4)} className="flex-1">
                    Continue <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review & Confirm */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Review Your Booking</CardTitle>
                <CardDescription>Verify all details before confirming</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="phone">Contact Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    We'll use this to contact you about your booking
                  </p>
                </div>
                <div>
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Input
                    id="notes"
                    placeholder="Any special requests or notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className="flex space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                  <Button onClick={handleBooking} disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Confirm Booking
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Court</div>
                <div className="font-semibold">{court.name}</div>
              </div>
              
              {selectedSlot && (
                <div>
                  <div className="text-sm text-muted-foreground">Date & Time</div>
                  <div className="font-semibold">
                    {format(new Date(selectedSlot.startTime), 'MMM dd, yyyy')}
                  </div>
                  <div className="text-sm">
                    {format(new Date(selectedSlot.startTime), 'HH:mm')} - {format(new Date(selectedSlot.endTime), 'HH:mm')}
                  </div>
                </div>
              )}

              {selectedEquipment.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Equipment</div>
                  {selectedEquipment.map((item) => {
                    const eq = equipment.find(e => e._id === item.item);
                    return eq ? (
                      <div key={item.item} className="text-sm">
                        {eq.name} × {item.quantity}
                      </div>
                    ) : null;
                  })}
                </div>
              )}

              {selectedCoach && (
                <div>
                  <div className="text-sm text-muted-foreground">Coach</div>
                  <div className="font-semibold">
                    {coaches.find(c => c._id === selectedCoach)?.name}
                  </div>
                </div>
              )}

              {pricing && (
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Court Fee</span>
                    <span>₹{pricing.courtFee}</span>
                  </div>
                  {pricing.equipmentFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Equipment Fee</span>
                      <span>₹{pricing.equipmentFee}</span>
                    </div>
                  )}
                  {pricing.coachFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Coach Fee</span>
                      <span>₹{pricing.coachFee}</span>
                    </div>
                  )}
                  {pricing.appliedRules && pricing.appliedRules.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Applied: {pricing.appliedRules.map((r: any) => r.ruleName).join(', ')}
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span className="text-primary">₹{pricing.finalTotal}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
