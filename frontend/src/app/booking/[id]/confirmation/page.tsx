'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, CheckCircle, Share2, Calendar, Mail, Phone, QrCode, CalendarPlus, Sparkles, Star } from 'lucide-react';
import { format } from 'date-fns';

interface Reservation {
  _id: string;
  spaceId: {
    _id: string;
    name: string;
    address: string;
    images: string[];
  };
  userId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  bookingCode: string;
  pricingBreakdown?: Array<{
    type: string;
    description: string;
    amount: number;
  }>;
}

export default function ConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const loadReservation = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReservation(data);
        // Trigger animation after data loads
        setTimeout(() => setShowAnimation(true), 100);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error loading reservation:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      loadReservation();
    }
  }, [params.id]);

  const handleDownloadIcal = async () => {
    if (!reservation) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations/${reservation._id}/ical`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to download calendar');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `booking-${reservation.bookingCode}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download calendar file.');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Booking Confirmation',
          text: `I just booked ${reservation?.spaceId.name} on ${format(new Date(reservation?.startTime || ''), 'EEEE, MMMM d, yyyy')}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyBookingCode = () => {
    if (reservation) {
      navigator.clipboard.writeText(reservation.bookingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 flex items-center justify-center" style={{ fontFamily: 'Blinker, sans-serif' }}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-purple-400 opacity-20"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading your confirmation...</h2>
          <p className="text-purple-600">Preparing something special for you</p>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 flex items-center justify-center" style={{ fontFamily: 'Blinker, sans-serif' }}>
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="h-10 w-10 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reservation Not Found</h2>
          <p className="text-gray-600 mb-6">The reservation you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/dashboard')} className="w-full bg-purple-600 hover:bg-purple-700">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const duration = Math.round(
    (new Date(reservation.endTime).getTime() - new Date(reservation.startTime).getTime()) / (1000 * 60 * 60)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200" style={{ fontFamily: 'Blinker, sans-serif' }}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-purple-300 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-purple-400 rounded-full opacity-30 animate-bounce"></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 bg-purple-500 rounded-full opacity-25 animate-ping"></div>
        <div className="absolute bottom-40 right-10 w-24 h-24 bg-purple-300 rounded-full opacity-20 animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/90 backdrop-blur-md shadow-lg border-b border-purple-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-purple-600 transition-all duration-300 hover:scale-105"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Booking Confirmation</h1>
            <div className="w-8"></div>
          </div>
        </div>
      </header>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        <div className={`text-center mb-12 transition-all duration-1000 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mb-8 shadow-2xl animate-pulse">
            <CheckCircle className="h-12 w-12 text-white" />
            <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-30"></div>
          </div>
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-purple-500 mr-2 animate-spin" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              Booking Confirmed!
            </h1>
            <Sparkles className="h-6 w-6 text-purple-500 ml-2 animate-spin" />
          </div>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
            Your booking has been successfully confirmed. You&apos;ll receive a confirmation email shortly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Booking Details */}
            <Card className={`border-0 shadow-2xl bg-white/95 backdrop-blur-sm transition-all duration-700 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-t-xl">
                <CardTitle className="flex items-center text-xl">
                  <Calendar className="h-6 w-6 mr-3" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 p-8">
                {/* Space Details */}
                <div className="flex items-start space-x-6">
                  {reservation.spaceId.images && reservation.spaceId.images.length > 0 && (
                    <div className="relative">
                      <img
                        src={reservation.spaceId.images[0]}
                        alt={reservation.spaceId.name}
                        className="w-32 h-32 object-cover rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <Star className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-3xl text-gray-900 mb-3">{reservation.spaceId.name}</h3>
                    <div className="flex items-center text-gray-600 text-lg">
                      <MapPin className="h-5 w-5 mr-2 text-purple-500" />
                      {reservation.spaceId.address}
                    </div>
                  </div>
                </div>

                <Separator className="bg-purple-200" />

                {/* Booking Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-purple-100">
                      <span className="text-gray-600 font-medium">Date:</span>
                      <span className="font-semibold text-gray-900">{format(new Date(reservation.startTime), 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-purple-100">
                      <span className="text-gray-600 font-medium">Time:</span>
                      <span className="font-semibold text-gray-900">
                        {format(new Date(reservation.startTime), 'h:mm a')} - {format(new Date(reservation.endTime), 'h:mm a')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-600 font-medium">Duration:</span>
                      <span className="font-semibold text-gray-900">{duration} hours</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-purple-100">
                      <span className="text-gray-600 font-medium">Booking Code:</span>
                      <span className="font-mono font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg text-lg">{reservation.bookingCode}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-purple-100">
                      <span className="text-gray-600 font-medium">Status:</span>
                      <Badge className="bg-green-100 text-green-800 font-semibold px-3 py-1">
                        Confirmed
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-600 font-medium">Payment:</span>
                      <Badge className="bg-purple-100 text-purple-800 font-semibold px-3 py-1">
                        Completed
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                {reservation.pricingBreakdown && (
                  <>
                    <Separator className="bg-purple-200" />
                    <div className="space-y-4">
                      <h4 className="font-bold text-xl text-gray-900">Price Breakdown</h4>
                      <div className="space-y-3">
                        {reservation.pricingBreakdown.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-3 border-b border-purple-100">
                            <span className="text-gray-600 font-medium">{item.description}</span>
                            <span className={`font-semibold ${item.amount < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                              ₹{item.amount.toFixed(2)}
                            </span>
                          </div>
                        ))}
                        <Separator className="my-4 bg-purple-200" />
                        <div className="flex justify-between items-center py-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl px-6">
                          <span className="font-bold text-2xl text-gray-900">Total Amount</span>
                          <span className="font-bold text-2xl text-purple-900">₹{reservation.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-700 delay-300 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <Button
                onClick={handleDownloadIcal}
                variant="outline"
                className="flex items-center justify-center space-x-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-300 hover:scale-105"
              >
                <CalendarPlus className="h-5 w-5" />
                <span>Add to Calendar</span>
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                className="flex items-center justify-center space-x-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-300 hover:scale-105"
              >
                <Share2 className="h-5 w-5" />
                <span>{copied ? 'Copied!' : 'Share Booking'}</span>
              </Button>
              <Button
                onClick={copyBookingCode}
                variant="outline"
                className="flex items-center justify-center space-x-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-300 hover:scale-105"
              >
                <QrCode className="h-5 w-5" />
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <Card className={`border-0 shadow-2xl bg-white/95 backdrop-blur-sm transition-all duration-700 delay-200 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-t-xl">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="w-full bg-purple-600 hover:bg-purple-700 transition-all duration-300 hover:scale-105"
                >
                  View All Bookings
                </Button>
                <Button
                  onClick={() => router.push('/spaces')}
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 transition-all duration-300 hover:scale-105"
                  variant="outline"
                >
                  Book Another Space
                </Button>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className={`border-0 shadow-2xl bg-white/95 backdrop-blur-sm transition-all duration-700 delay-400 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-t-xl">
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-300">
                  <Mail className="h-5 w-5 text-purple-600" />
                  <span className="text-sm text-gray-700 font-medium">support@events.com</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-300">
                  <Phone className="h-5 w-5 text-purple-600" />
                  <span className="text-sm text-gray-700 font-medium">+91 98765 43210</span>
                </div>
                <div className="text-xs text-gray-600 mt-4 p-3 bg-purple-50 rounded-lg">
                  <p className="font-medium">Our support team is available 24/7 to help you with any questions.</p>
                </div>
              </CardContent>
            </Card>

            {/* Important Notes */}
            <Card className={`border-0 shadow-2xl bg-white/95 backdrop-blur-sm transition-all duration-700 delay-600 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-t-xl">
                <CardTitle className="text-lg">Important Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-6">
                <div className="text-sm text-gray-700 space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Please arrive 10 minutes before your booking time</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Bring a valid ID for verification</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Show your booking code at check-in</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Cancellations must be made 24 hours in advance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 