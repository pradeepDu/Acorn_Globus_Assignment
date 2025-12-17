import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courtsAPI } from '../services/api';
import type { Court } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { MapPin, Star, Calendar } from 'lucide-react';

export const CourtsPage: React.FC = () => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'indoor' | 'outdoor'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadCourts();
  }, [filter]);

  const loadCourts = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { type: filter } : {};
      const response = await courtsAPI.getAll(params);
      setCourts(response.data.courts);
    } catch (error) {
      console.error('Error loading courts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookCourt = (courtId: string) => {
    navigate(`/booking/${courtId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading courts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Browse Courts</h1>
        <p className="text-muted-foreground">Choose from our premium badminton courts</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All Courts
        </Button>
        <Button
          variant={filter === 'indoor' ? 'default' : 'outline'}
          onClick={() => setFilter('indoor')}
        >
          Indoor
        </Button>
        <Button
          variant={filter === 'outdoor' ? 'default' : 'outline'}
          onClick={() => setFilter('outdoor')}
        >
          Outdoor
        </Button>
      </div>

      {/* Courts Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courts.map((court) => (
          <Card key={court._id} className={`hover:shadow-lg transition-shadow ${court.status === 'maintenance' ? 'opacity-75' : ''}`}>
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="text-xl">{court.name}</CardTitle>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    court.type === 'indoor' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {court.type}
                  </span>
                  {court.status === 'maintenance' && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800 flex items-center gap-1">
                      🔧 Maintenance
                    </span>
                  )}
                </div>
              </div>
              <CardDescription className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {court.sport}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">
                    ₹{court.hourlyBaseRate}<span className="text-sm text-muted-foreground">/hour</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Base rate (dynamic pricing applies)</p>
                </div>

                {court.features && court.features.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Features:</p>
                    <ul className="text-sm space-y-1">
                      {court.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-center text-muted-foreground">
                          <Star className="h-3 w-3 mr-2 text-yellow-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {court.status === 'maintenance' ? (
                  <Button 
                    className="w-full" 
                    disabled
                    variant="outline"
                  >
                    🔧 Under Maintenance
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => handleBookCourt(court._id)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Now
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {courts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No courts available</p>
        </div>
      )}
    </div>
  );
};
