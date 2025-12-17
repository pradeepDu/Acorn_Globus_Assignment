import React, { useState } from 'react';
import { adminAPI, courtsAPI, equipmentAPI, coachesAPI, pricingRulesAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Users, MapPin, Package, User as UserIcon, Settings, Calendar } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'courts' | 'equipment' | 'coaches' | 'pricing' | 'bookings' | 'users'>('courts');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [waitlistEntries, setWaitlistEntries] = useState<any[]>([]);
  const [editingCourt, setEditingCourt] = useState<any>(null);
  const [editingCoach, setEditingCoach] = useState<any>(null);
  const [editingEquipment, setEditingEquipment] = useState<any>(null);

  // Form states
  const [courtForm, setCourtForm] = useState({ name: '', type: 'indoor', hourlyBaseRate: 500 });
  const [equipmentForm, setEquipmentForm] = useState({ name: '', type: 'racket', totalQuantity: 10, hourlyRate: 50 });
  const [coachForm, setCoachForm] = useState({ name: '', email: '', hourlyRate: 800 });
  const [pricingForm, setPricingForm] = useState({
    name: '',
    type: 'time-based',
    multiplier: 1.5,
    startHour: 18,
    endHour: 21
  });

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers({ role: 'user' });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };
  const loadCourts = async () => {
    try {
      const response = await courtsAPI.getAll();
      setCourts(response.data.courts || response.data);
    } catch (error) {
      console.error('Error loading courts:', error);
    }
  };

  const loadCoaches = async () => {
    try {
      const response = await coachesAPI.getAll();
      setCoaches(response.data.coaches || response.data);
    } catch (error) {
      console.error('Error loading coaches:', error);
    }
  };

  const loadEquipment = async () => {
    try {
      const response = await equipmentAPI.getAll();
      setEquipment(response.data.equipment || response.data);
    } catch (error) {
      console.error('Error loading equipment:', error);
    }
  };

  const loadBookings = async () => {
    try {
      const response = await adminAPI.getAllBookings();
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const loadWaitlist = async () => {
    try {
      const response = await adminAPI.getAllWaitlist();
      setWaitlistEntries(response.data.waitlist || []);
    } catch (error) {
      console.error('Error loading waitlist:', error);
    }
  };
  const handleCreateCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourt) {
        await courtsAPI.update(editingCourt._id, courtForm);
        alert('Court updated successfully!');
        setEditingCourt(null);
      } else {
        await courtsAPI.create(courtForm);
        alert('Court created successfully!');
      }
      setCourtForm({ name: '', type: 'indoor', hourlyBaseRate: 500 });
      loadCourts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save court');
    }
  };

  const handleEditCourt = (court: any) => {
    setEditingCourt(court);
    setCourtForm({
      name: court.name,
      type: court.type,
      hourlyBaseRate: court.hourlyBaseRate
    });
  };

  const handleDeleteCourt = async (courtId: string) => {
    if (!confirm('Are you sure you want to delete this court? This cannot be undone.')) return;
    try {
      await courtsAPI.delete(courtId);
      alert('Court deleted successfully!');
      loadCourts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete court');
    }
  };

  const handleToggleCourtStatus = async (courtId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'maintenance' ? 'active' : 'maintenance';
      await courtsAPI.update(courtId, { status: newStatus });
      alert(`Court ${newStatus === 'maintenance' ? 'frozen for maintenance' : 'activated'} successfully!`);
      loadCourts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update court status');
    }
  };

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEquipment) {
        await equipmentAPI.update(editingEquipment._id, equipmentForm);
        alert('Equipment updated successfully!');
        setEditingEquipment(null);
      } else {
        await equipmentAPI.create(equipmentForm);
        alert('Equipment created successfully!');
      }
      setEquipmentForm({ name: '', type: 'racket', totalQuantity: 10, hourlyRate: 50 });
      loadEquipment();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save equipment');
    }
  };

  const handleEditEquipment = (equip: any) => {
    setEditingEquipment(equip);
    setEquipmentForm({
      name: equip.name,
      type: equip.type,
      totalQuantity: equip.totalQuantity,
      hourlyRate: equip.hourlyRate
    });
  };

  const handleDeleteEquipment = async (equipId: string) => {
    if (!confirm('Are you sure you want to delete this equipment? This cannot be undone.')) return;
    try {
      await equipmentAPI.delete(equipId);
      alert('Equipment deleted successfully!');
      loadEquipment();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete equipment');
    }
  };

  const handleCreateCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCoach) {
        await coachesAPI.update(editingCoach._id, coachForm);
        alert('Coach updated successfully!');
        setEditingCoach(null);
      } else {
        await coachesAPI.create(coachForm);
        alert('Coach created successfully!');
      }
      setCoachForm({ name: '', email: '', hourlyRate: 800 });
      loadCoaches();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save coach');
    }
  };

  const handleEditCoach = (coach: any) => {
    setEditingCoach(coach);
    setCoachForm({
      name: coach.name,
      email: coach.email,
      hourlyRate: coach.hourlyRate
    });
  };

  const handleDeleteCoach = async (coachId: string) => {
    if (!confirm('Are you sure you want to delete this coach? This cannot be undone.')) return;
    try {
      await coachesAPI.delete(coachId);
      alert('Coach deleted successfully!');
      loadCoaches();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete coach');
    }
  };

  const handleCreatePricingRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const conditions: any = {};
      if (pricingForm.type === 'time-based') {
        conditions.startHour = pricingForm.startHour;
        conditions.endHour = pricingForm.endHour;
      }
      
      await pricingRulesAPI.create({
        name: pricingForm.name,
        type: pricingForm.type,
        multiplier: pricingForm.multiplier,
        conditions,
        priority: 50,
        active: true
      });
      alert('Pricing rule created successfully!');
      setPricingForm({ name: '', type: 'time-based', multiplier: 1.5, startHour: 18, endHour: 21 });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create pricing rule');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">Manage courts, equipment, coaches, and pricing</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        <Button
          variant={activeTab === 'courts' ? 'default' : 'outline'}
          onClick={() => setActiveTab('courts')}
        >
          <MapPin className="h-4 w-4 mr-2" />
          Courts
        </Button>
        <Button
          variant={activeTab === 'equipment' ? 'default' : 'outline'}
          onClick={() => setActiveTab('equipment')}
        >
          <Package className="h-4 w-4 mr-2" />
          Equipment
        </Button>
        <Button
          variant={activeTab === 'coaches' ? 'default' : 'outline'}
          onClick={() => setActiveTab('coaches')}
        >
          <UserIcon className="h-4 w-4 mr-2" />
          Coaches
        </Button>
        <Button
          variant={activeTab === 'pricing' ? 'default' : 'outline'}
          onClick={() => setActiveTab('pricing')}
        >
          <Settings className="h-4 w-4 mr-2" />
          Pricing Rules
        </Button>
        <Button
          variant={activeTab === 'bookings' ? 'default' : 'outline'}
          onClick={() => {
            setActiveTab('bookings');
            loadBookings();
            loadWaitlist();
          }}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Bookings
        </Button>
        <Button
          variant={activeTab === 'users' ? 'default' : 'outline'}
          onClick={() => {
            setActiveTab('users');
            loadUsers();
          }}
        >
          <Users className="h-4 w-4 mr-2" />
          Users
        </Button>
      </div>



      {/* Courts Tab */}
      {activeTab === 'courts' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{editingCourt ? 'Edit Court' : 'Add New Court'}</CardTitle>
              <CardDescription>{editingCourt ? 'Update court details' : 'Create a new court for bookings'}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCourt} className="space-y-4">
                <div>
                  <Label htmlFor="court-name">Court Name</Label>
                  <Input
                    id="court-name"
                    value={courtForm.name}
                    onChange={(e) => setCourtForm({ ...courtForm, name: e.target.value })}
                    required
                    placeholder="e.g., Indoor Court 3"
                  />
                </div>
                <div>
                  <Label htmlFor="court-type">Type</Label>
                  <select
                    id="court-type"
                    className="w-full border rounded-md px-3 py-2"
                    value={courtForm.type}
                    onChange={(e) => setCourtForm({ ...courtForm, type: e.target.value })}
                  >
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="court-rate">Hourly Base Rate (₹)</Label>
                  <Input
                    id="court-rate"
                    type="number"
                    value={courtForm.hourlyBaseRate}
                    onChange={(e) => setCourtForm({ ...courtForm, hourlyBaseRate: parseInt(e.target.value) })}
                    required
                    min="0"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">{editingCourt ? 'Update Court' : 'Create Court'}</Button>
                  {editingCourt && (
                    <Button type="button" variant="outline" onClick={() => {
                      setEditingCourt(null);
                      setCourtForm({ name: '', type: 'indoor', hourlyBaseRate: 500 });
                    }}>Cancel</Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Existing Courts</CardTitle>
              <CardDescription>Manage all courts</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={loadCourts} className="mb-4" variant="outline">
                Refresh List
              </Button>
              <div className="space-y-3">
                {courts.map((court: any) => (
                  <div key={court._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{court.name}</h3>
                      <p className="text-sm text-gray-600">
                        Type: {court.type} | Rate: ₹{court.hourlyBaseRate}/hr | 
                        Status: <span className={court.status === 'maintenance' ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'}>
                          {court.status || 'active'}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditCourt(court)}>
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant={court.status === 'maintenance' ? 'default' : 'outline'}
                        onClick={() => handleToggleCourtStatus(court._id, court.status || 'active')}
                      >
                        {court.status === 'maintenance' ? 'Unfreeze' : 'Freeze'}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteCourt(court._id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                {courts.length === 0 && <p className="text-gray-500">No courts found. Click Refresh or create a new court.</p>}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Equipment Tab */}
      {activeTab === 'equipment' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}</CardTitle>
              <CardDescription>{editingEquipment ? 'Update equipment details' : 'Add equipment for rental'}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateEquipment} className="space-y-4">
                <div>
                  <Label htmlFor="equip-name">Equipment Name</Label>
                  <Input
                    id="equip-name"
                    value={equipmentForm.name}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                    required
                    placeholder="e.g., Professional Racket"
                  />
                </div>
                <div>
                  <Label htmlFor="equip-type">Type</Label>
                  <select
                    id="equip-type"
                    className="w-full border rounded-md px-3 py-2"
                    value={equipmentForm.type}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, type: e.target.value })}
                  >
                    <option value="racket">Racket</option>
                    <option value="shoes">Shoes</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="equip-quantity">Total Quantity</Label>
                  <Input
                    id="equip-quantity"
                    type="number"
                    value={equipmentForm.totalQuantity}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, totalQuantity: parseInt(e.target.value) })}
                    required
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="equip-rate">Hourly Rate (₹)</Label>
                  <Input
                    id="equip-rate"
                    type="number"
                    value={equipmentForm.hourlyRate}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, hourlyRate: parseInt(e.target.value) })}
                    required
                    min="0"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">{editingEquipment ? 'Update Equipment' : 'Add Equipment'}</Button>
                  {editingEquipment && (
                    <Button type="button" variant="outline" onClick={() => {
                      setEditingEquipment(null);
                      setEquipmentForm({ name: '', type: 'racket', totalQuantity: 10, hourlyRate: 50 });
                    }}>Cancel</Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Existing Equipment</CardTitle>
              <CardDescription>Manage all equipment</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={loadEquipment} className="mb-4" variant="outline">
                Refresh List
              </Button>
              <div className="space-y-3">
                {equipment.map((equip: any) => (
                  <div key={equip._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{equip.name}</h3>
                      <p className="text-sm text-gray-600">
                        Type: {equip.type} | Quantity: {equip.totalQuantity} | Rate: ₹{equip.hourlyRate}/hr
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditEquipment(equip)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteEquipment(equip._id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                {equipment.length === 0 && <p className="text-gray-500">No equipment found. Click Refresh or add new equipment.</p>}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Coaches Tab */}
      {activeTab === 'coaches' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{editingCoach ? 'Edit Coach' : 'Add New Coach'}</CardTitle>
              <CardDescription>{editingCoach ? 'Update coach details' : 'Register a new coach'}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCoach} className="space-y-4">
                <div>
                  <Label htmlFor="coach-name">Coach Name</Label>
                  <Input
                    id="coach-name"
                    value={coachForm.name}
                    onChange={(e) => setCoachForm({ ...coachForm, name: e.target.value })}
                    required
                    placeholder="e.g., John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="coach-email">Email</Label>
                  <Input
                    id="coach-email"
                    type="email"
                    value={coachForm.email}
                    onChange={(e) => setCoachForm({ ...coachForm, email: e.target.value })}
                    required
                    placeholder="coach@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="coach-rate">Hourly Rate (₹)</Label>
                  <Input
                    id="coach-rate"
                    type="number"
                    value={coachForm.hourlyRate}
                    onChange={(e) => setCoachForm({ ...coachForm, hourlyRate: parseInt(e.target.value) })}
                    required
                    min="0"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">{editingCoach ? 'Update Coach' : 'Add Coach'}</Button>
                  {editingCoach && (
                    <Button type="button" variant="outline" onClick={() => {
                      setEditingCoach(null);
                      setCoachForm({ name: '', email: '', hourlyRate: 800 });
                    }}>Cancel</Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Existing Coaches</CardTitle>
              <CardDescription>Manage all coaches</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={loadCoaches} className="mb-4" variant="outline">
                Refresh List
              </Button>
              <div className="space-y-3">
                {coaches.map((coach: any) => (
                  <div key={coach._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{coach.name}</h3>
                      <p className="text-sm text-gray-600">
                        Email: {coach.email} | Rate: ₹{coach.hourlyRate}/hr
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditCoach(coach)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteCoach(coach._id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                {coaches.length === 0 && <p className="text-gray-500">No coaches found. Click Refresh or add a new coach.</p>}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Pricing Rules Tab */}
      {activeTab === 'pricing' && (
        <Card>
          <CardHeader>
            <CardTitle>Create Pricing Rule</CardTitle>
            <CardDescription>Add dynamic pricing rules</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePricingRule} className="space-y-4">
              <div>
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  value={pricingForm.name}
                  onChange={(e) => setPricingForm({ ...pricingForm, name: e.target.value })}
                  required
                  placeholder="e.g., Evening Peak Hours"
                />
              </div>
              <div>
                <Label htmlFor="rule-type">Rule Type</Label>
                <select
                  id="rule-type"
                  className="w-full border rounded-md px-3 py-2"
                  value={pricingForm.type}
                  onChange={(e) => setPricingForm({ ...pricingForm, type: e.target.value })}
                >
                  <option value="time-based">Time Based</option>
                  <option value="day-based">Day Based</option>
                  <option value="court-type">Court Type</option>
                </select>
              </div>
              <div>
                <Label htmlFor="rule-multiplier">Price Multiplier</Label>
                <Input
                  id="rule-multiplier"
                  type="number"
                  step="0.1"
                  value={pricingForm.multiplier}
                  onChange={(e) => setPricingForm({ ...pricingForm, multiplier: parseFloat(e.target.value) })}
                  required
                  min="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  1.0 = no change, 1.5 = 50% increase, 0.8 = 20% discount
                </p>
              </div>
              {pricingForm.type === 'time-based' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-hour">Start Hour (0-23)</Label>
                    <Input
                      id="start-hour"
                      type="number"
                      min="0"
                      max="23"
                      value={pricingForm.startHour}
                      onChange={(e) => setPricingForm({ ...pricingForm, startHour: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-hour">End Hour (0-23)</Label>
                    <Input
                      id="end-hour"
                      type="number"
                      min="0"
                      max="23"
                      value={pricingForm.endHour}
                      onChange={(e) => setPricingForm({ ...pricingForm, endHour: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              )}
              <Button type="submit">Create Rule</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>All Bookings</CardTitle>
              <CardDescription>View and manage all court bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={loadBookings} className="mb-4" variant="outline">
                Refresh List
              </Button>
              <div className="space-y-3">
                {bookings.map((booking: any) => (
                  <div key={booking._id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-lg">{booking.court?.name}</p>
                        <p className="text-sm text-gray-600">
                          Booked by: {booking.user?.name} ({booking.user?.email})
                        </p>
                        {booking.phone && (
                          <p className="text-sm text-gray-600">Phone: {booking.phone}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Date & Time</p>
                        <p className="font-medium">
                          {new Date(booking.startTime).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-600">
                          {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Extras</p>
                        <p className="font-medium">
                          {booking.coach?.name && `Coach: ${booking.coach.name}`}
                          {!booking.coach?.name && booking.equipment?.length > 0 && 'Equipment'}
                          {!booking.coach?.name && !booking.equipment?.length && 'None'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Amount</p>
                        <p className="font-medium text-lg text-primary">₹{booking.pricing?.finalTotal}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {bookings.length === 0 && <p className="text-gray-500 text-center py-8">No bookings found. Click Refresh to load.</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Waitlist Entries</CardTitle>
              <CardDescription>View all users waiting for court availability</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={loadWaitlist} className="mb-4" variant="outline">
                Refresh Waitlist
              </Button>
              <div className="space-y-3">
                {waitlistEntries.map((entry: any) => (
                  <div key={entry._id} className="p-4 border rounded-lg border-orange-200 bg-orange-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-lg">{entry.court?.name}</p>
                        <p className="text-sm text-gray-600">
                          Waiting: {entry.user?.name} ({entry.user?.email})
                        </p>
                        <p className="text-xs text-orange-600 font-medium mt-1">
                          Position #{entry.position} in queue
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        entry.status === 'waiting' ? 'bg-orange-100 text-orange-800' :
                        entry.status === 'notified' ? 'bg-blue-100 text-blue-800' :
                        entry.status === 'converted' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Desired Date & Time</p>
                        <p className="font-medium">
                          {new Date(entry.desiredDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-600">
                          {entry.desiredStartTime} - {entry.desiredEndTime}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Joined Queue</p>
                        <p className="font-medium">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expires</p>
                        <p className="font-medium text-sm">
                          {new Date(entry.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {waitlistEntries.length === 0 && <p className="text-gray-500 text-center py-8">No waitlist entries. Click Refresh to load.</p>}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>Registered Users</CardTitle>
            <CardDescription>View all registered users and their booking activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No users registered yet</p>
              ) : (
                users.map((user) => (
                  <div key={user._id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-lg">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Joined</p>
                        <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Bookings</p>
                        <p className="font-medium">{user.bookingCount || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{user.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
