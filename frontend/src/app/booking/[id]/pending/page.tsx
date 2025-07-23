'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
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
  createdAt: string;
}

export default function BookingPending() {
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

  const refreshStatus = async () => {
    await fetchReservation();
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
        {/* Pending Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Pending Approval</h1>
          <p className="text-gray-600">
            Your free reservation request has been submitted and is waiting for approval from the space owner.
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
                <p className="text-gray-600">₹{reservation.totalAmount.toFixed(2)} (Free)</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <Badge variant="secondary">
                {reservation.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium">Payment:</span>
              <Badge variant="secondary">
                {reservation.paymentStatus.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* What Happens Next */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-medium">1</span>
                </div>
                <div>
                  <p className="font-medium">Space owner reviews your request</p>
                  <p className="text-sm text-gray-600">
                    The space owner will review your booking request and either approve or reject it.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-medium">2</span>
                </div>
                <div>
                  <p className="font-medium">You&apos;ll receive a notification</p>
                  <p className="text-sm text-gray-600">
                    We&apos;ll send you an email and update the status here once the owner responds.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-medium">3</span>
                </div>
                <div>
                  <p className="font-medium">If approved, you&apos;re all set!</p>
                  <p className="text-sm text-gray-600">
                    You can check in at the venue on your scheduled date and time.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={refreshStatus} variant="outline" className="flex-1">
            <RefreshCw className="w-4 h-4 mr-2" />
            Check Status
          </Button>
          <Button onClick={() => router.push('/dashboard')} className="flex-1">
            View My Bookings
          </Button>
        </div>

        {/* Important Notes */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Important Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Approval typically takes 24-48 hours</p>
              <p>• You can cancel this request at any time before approval</p>
              <p>• If rejected, you can try booking a different time slot</p>
              <p>• Keep your schedule flexible until you receive confirmation</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Need help? Contact us at support@events.com</p>
          <p>Reservation ID: {reservation._id}</p>
        </div>
      </div>
    </div>
  );
} 