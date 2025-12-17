import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Calendar, Clock, Users, TrendingUp, MapPin, Zap } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">Book Your Court in Seconds</h1>
            <p className="text-xl mb-8 text-blue-100">
              Premium badminton courts with professional coaches and equipment rental. 
              Dynamic pricing, instant booking, and smart availability.
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/courts">
                <Button size="lg" variant="secondary">
                  <Calendar className="mr-2 h-5 w-5" />
                  Browse Courts
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                  Login / Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Instant Booking</CardTitle>
                <CardDescription>
                  Real-time availability checking across courts, coaches, and equipment. Book everything in one transaction.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Dynamic Pricing</CardTitle>
                <CardDescription>
                  Smart pricing based on peak hours, weekends, and court type. Get discounts during off-peak hours.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Professional Coaches</CardTitle>
                <CardDescription>
                  Book expert coaches with your court session. Choose from multiple specialties and experience levels.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-primary mb-2">4</div>
              <div className="text-gray-600">Premium Courts</div>
              <div className="text-sm text-gray-500">2 Indoor • 2 Outdoor</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-primary mb-2">3</div>
              <div className="text-gray-600">Expert Coaches</div>
              <div className="text-sm text-gray-500">All Certified Professionals</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-primary mb-2">16</div>
              <div className="text-gray-600">Hours Open Daily</div>
              <div className="text-sm text-gray-500">6 AM - 10 PM</div>
            </div>
          </div>
        </div>
      </section>

      {/* Court Types Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Facilities</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-primary" />
                  Indoor Courts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-green-500" />
                    Air Conditioned
                  </li>
                  <li className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-green-500" />
                    LED Lighting
                  </li>
                  <li className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-green-500" />
                    Premium Flooring
                  </li>
                  <li className="text-2xl font-bold mt-4 text-primary">
                    ₹500/hour
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-primary" />
                  Outdoor Courts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-green-500" />
                    Natural Lighting
                  </li>
                  <li className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-green-500" />
                    Fresh Air Environment
                  </li>
                  <li className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-green-500" />
                    Quality Surfaces
                  </li>
                  <li className="text-2xl font-bold mt-4 text-primary">
                    ₹300/hour
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Play?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Book your court now and enjoy premium facilities at competitive prices
          </p>
          <Link to="/courts">
            <Button size="lg" variant="secondary">
              <Calendar className="mr-2 h-5 w-5" />
              Book Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
