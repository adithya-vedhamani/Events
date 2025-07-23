'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Reservation {
  _id: string;
  spaceId: {
    _id: string;
    name: string;
    address: string;
    images: Array<{ url: string }>;
  };
  userId: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export default function ConsumerReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations/my-reservations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReservations(data);
      } else {
        setError('Failed to fetch reservations');
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setError('Failed to fetch reservations');
    } finally {
      setLoading(false);
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '✅';
      case 'pending':
        return '⏳';
      case 'cancelled':
        return '❌';
      case 'completed':
        return '📘';
      default:
        return '⏳';
    }
  };

  const getPaymentStatusEmoji = (status: string) => {
    switch (status) {
      case 'completed':
        return '💸';
      case 'pending':
        return '⌛';
      case 'failed':
        return '❌';
      default:
        return '⌛';
    }
  };

  if (loading) {
    return (
      <div className="p-6" style={{ fontFamily: 'Blinker, sans-serif' }}>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-black">📖 My Reservations</h1>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#f6f2ff] rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6" style={{ fontFamily: 'Blinker, sans-serif' }}>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-black">📖 My Reservations</h1>
          <div className="bg-[#f6f2ff] rounded-2xl p-6 text-center text-red-600">
            <div className="text-5xl mb-4">❌</div>
            <p>{error}</p>
            <button
              onClick={fetchReservations}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-full text-base font-blinker text-[#8b55ff] bg-white hover:bg-[#ede9fe] transition-all duration-200 shadow-sm hover:scale-105 focus:scale-105 focus:outline-none"
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-white" style={{ fontFamily: 'Blinker, sans-serif' }}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-black">📖 My Reservations</h1>
        {reservations.length === 0 ? (
          <div className="bg-[#f6f2ff] rounded-2xl p-6 text-center text-gray-600">
            <div className="text-5xl mb-4">📅</div>
            <p>No reservations found</p>
            <p className="text-sm">Start by booking a space!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation) => (
              <div key={reservation._id} className="rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow hover:scale-[1.01] focus-within:scale-[1.01] border border-transparent hover:border-[#ede9fe]">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="text-lg font-bold text-black mb-1">{reservation.spaceId.name}</div>
                    <div className="flex items-center gap-2 text-black/70 text-sm mb-2">
                      <span>📍</span>
                      <span>{reservation.spaceId.address}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[#f6f2ff] text-black">
                        {getStatusEmoji(reservation.status)} {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[#f6f2ff] text-black">
                        {getPaymentStatusEmoji(reservation.paymentStatus)} {reservation.paymentStatus.charAt(0).toUpperCase() + reservation.paymentStatus.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-black/80 text-sm">
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span>{format(new Date(reservation.startTime), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>⏰</span>
                      <span>{format(new Date(reservation.startTime), 'h:mm a')} - {format(new Date(reservation.endTime), 'h:mm a')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>💸</span>
                      <span className="font-medium">₹{reservation.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[#ede9fe] flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500 gap-2">
                  <span>Booked on {format(new Date(reservation.createdAt), 'MMM dd, yyyy')}</span>
                  <span>ID: {reservation._id.slice(-8)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 