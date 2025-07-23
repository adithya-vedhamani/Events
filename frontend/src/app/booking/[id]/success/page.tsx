'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, Clock, MapPin, Download } from 'lucide-react';
import { format } from 'date-fns';

interface Reservation {
  _id: string;
  spaceId: {
    _id: string;
    name: string;
    address: string;
    images: string[];
  };
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  pricingBreakdown: Array<{
    type: string;
    description: string;
    amount: number;
  }>;
  createdAt: string;
}

export default function BookingSuccess() {
  const params = useParams();
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservation();
  }, []);

  const fetchReservation = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReservation(data);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching reservation:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = () => {
    // Generate and download receipt
    const receiptData = {
      reservationId: reservation?._id,
      spaceName: reservation?.spaceId.name,
      date: reservation?.startTime,
      amount: reservation?.totalAmount,
      status: reservation?.status,
    };

    const blob = new Blob([JSON.stringify(receiptData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${reservation?._id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!reservation) {
    return <div className="flex items-center justify-center min-h-screen">Reservation not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">
            Your reservation has been successfully confirmed. You&apos;ll receive a confirmation email shortly.
          </p>
        </div>

        {/* Reservation Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Reservation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium">Date</p>
                <p className="text-gray-600">
                  {format(new Date(reservation.startTime), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium">Time</p>
                <p className="text-gray-600">
                  {format(new Date(reservation.startTime), 'h:mm a')} - {format(new Date(reservation.endTime), 'h:mm a')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-gray-600">{reservation.spaceId.name}</p>
                <p className="text-sm text-gray-500">{reservation.spaceId.address}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 text-gray-500">₹</div>
              <div>
                <p className="font-medium">Total Amount</p>
                <p className="text-gray-600">₹{reservation.totalAmount.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <Badge variant={reservation.status === 'confirmed' ? 'default' : 'secondary'}>
                {reservation.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium">Payment:</span>
              <Badge variant={reservation.paymentStatus === 'completed' ? 'default' : 'secondary'}>
                {reservation.paymentStatus.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Price Breakdown */}
        {reservation.pricingBreakdown && reservation.pricingBreakdown.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Price Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reservation.pricingBreakdown.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.description}</span>
                    <span>₹{item.amount.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₹{reservation.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What&apos;s Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-medium">1</span>
                </div>
                <div>
                  <p className="font-medium">Check your email</p>
                  <p className="text-sm text-gray-600">
                    We&apos;ve sent you a confirmation email with all the details.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-medium">2</span>
                </div>
                <div>
                  <p className="font-medium">Arrive on time</p>
                  <p className="text-sm text-gray-600">
                    Please arrive 10 minutes before your scheduled time.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-medium">3</span>
                </div>
                <div>
                  <p className="font-medium">Check in</p>
                  <p className="text-sm text-gray-600">
                    Present your booking confirmation at the venue.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={downloadReceipt} variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </Button>
          <Button onClick={() => router.push('/dashboard')} className="flex-1">
            View My Bookings
          </Button>
        </div>

        {/* Contact Information */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Need help? Contact us at support@events.com</p>
          <p>Reservation ID: {reservation._id}</p>
        </div>
      </div>
    </div>
  );
} 