'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

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
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show' | 'pending_payment' | 'pending_approval';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded' | 'not_required';
  bookingCode: string;
  createdAt: string;
}

export default function ConsumerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations/my-reservations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReservations(data);
      }
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending_payment':
        return 'bg-orange-100 text-orange-800';
      case 'checked_in':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      case 'pending_approval':
        return 'Pending Approval';
      case 'pending_payment':
        return 'Payment Pending';
      case 'checked_in':
        return 'Checked In';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'no_show':
        return 'No Show';
      default:
        return status;
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') {
      return new Date(reservation.startTime) > new Date() && reservation.status === 'confirmed';
    }
    if (filter === 'past') {
      return new Date(reservation.startTime) < new Date();
    }
    return reservation.status === filter;
  });

  const upcomingReservations = reservations.filter(
    r => new Date(r.startTime) > new Date() && r.status === 'confirmed'
  );

  const handleDownloadIcal = async (reservation: Reservation) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Blinker, sans-serif' }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-black">👋 Welcome, {user?.firstName}!</h1>
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="rounded-2xl bg-[#f6f2ff] p-5 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl mb-2">📅</div>
            <div className="text-xs text-gray-500">Total Bookings</div>
            <div className="text-xl font-bold text-black">{reservations.length}</div>
          </div>
          <div className="rounded-2xl bg-[#f6f2ff] p-5 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl mb-2">⏳</div>
            <div className="text-xs text-gray-500">Upcoming</div>
            <div className="text-xl font-bold text-black">{upcomingReservations.length}</div>
          </div>
          <div className="rounded-2xl bg-[#f6f2ff] p-5 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-xs text-gray-500">Completed</div>
            <div className="text-xl font-bold text-black">{reservations.filter(r => r.status === 'completed').length}</div>
          </div>
          <div className="rounded-2xl bg-[#f6f2ff] p-5 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl mb-2">🟣</div>
            <div className="text-xs text-gray-500">Active</div>
            <div className="text-xl font-bold text-black">{reservations.filter(r => r.status === 'checked_in').length}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl bg-[#f6f2ff] p-6 mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
          <div className="flex gap-3 w-full justify-center">
            <button
              onClick={() => router.push('/')} 
              className="flex items-center gap-2 px-5 py-2 rounded-full text-base font-blinker text-[#8b55ff] bg-white hover:bg-[#ede9fe] transition-all duration-200 shadow-sm hover:scale-105 focus:scale-105 focus:outline-none"
            >
              <span>🔍</span>
              <span>Browse Spaces</span>
            </button>
            <button
              onClick={() => router.push('/dashboard/consumer/reservations')} 
              className="flex items-center gap-2 px-5 py-2 rounded-full text-base font-blinker text-[#8b55ff] bg-white hover:bg-[#ede9fe] transition-all duration-200 shadow-sm hover:scale-105 focus:scale-105 focus:outline-none"
            >
              <span>📖</span>
              <span>View All Bookings</span>
            </button>
          </div>
        </div>

        {/* Reservations */}
        <div className="rounded-2xl bg-[#f6f2ff] shadow-sm">
          <div className="p-6 border-b border-[#ede9fe] flex flex-col sm:flex-row justify-between items-center">
            <h2 className="text-lg font-semibold text-black flex items-center gap-2">📝 Recent Bookings</h2>
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              <span className="text-lg">🔎</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-[#ede9fe] rounded-full px-4 py-1 text-sm text-black bg-white focus:ring-2 focus:ring-[#8b55ff] focus:outline-none"
              >
                <option value="all">All Bookings</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="p-6">
            {filteredReservations.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">📅</div>
                <p className="text-gray-500">No bookings found.</p>
                <button
                  onClick={() => router.push('/')} 
                  className="mt-4 flex items-center gap-2 px-5 py-2 rounded-full text-base font-blinker text-[#8b55ff] bg-white hover:bg-[#ede9fe] transition-all duration-200 shadow-sm hover:scale-105 focus:scale-105 focus:outline-none"
                >
                  <span>🔍</span>
                  <span>Browse Spaces</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReservations.slice(0, 5).map((reservation) => (
                  <div
                    key={reservation._id}
                    className="rounded-xl bg-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow hover:scale-[1.01] focus-within:scale-[1.01] border border-transparent hover:border-[#ede9fe]"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-semibold text-black text-base">{reservation.spaceId.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>{getStatusText(reservation.status)}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-black/70">
                        <div className="flex items-center gap-2">
                          <span>📅</span>
                          <span>{new Date(reservation.startTime).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>⏰</span>
                          <span>{new Date(reservation.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(reservation.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>📍</span>
                          <span className="truncate">{reservation.spaceId.address}</span>
                        </div>
                      </div>
                      {reservation.bookingCode && (
                        <div className="mt-2 text-sm flex items-center gap-2 flex-wrap">
                          <span className="text-gray-500">Booking Code:</span>
                          <span className="font-mono bg-[#f6f2ff] px-2 py-1 rounded">{reservation.bookingCode}</span>
                          <button
                            onClick={() => handleDownloadIcal(reservation)}
                            className="ml-2 flex items-center text-[#8b55ff] hover:text-black text-xs px-2 py-1 border border-[#ede9fe] rounded-full transition-colors hover:bg-[#ede9fe] focus:outline-none focus:ring-2 focus:ring-[#8b55ff]"
                            title="Download iCal (.ics)"
                          >
                            <span className="mr-1">📥</span>iCal
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-right min-w-[90px]">
                      <div className="text-lg font-semibold text-black">₹{reservation.totalAmount}</div>
                      <div className="text-xs text-gray-500">
                        {reservation.paymentStatus === 'completed' ? 'Paid' : 
                          reservation.status === 'confirmed' && reservation.totalAmount > 0 ? 'Payment Pending' :
                          reservation.paymentStatus === 'not_required' ? 'Free' : 'Payment Pending'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {filteredReservations.length > 5 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => router.push('/dashboard/consumer/reservations')} 
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-base font-blinker text-[#8b55ff] bg-white hover:bg-[#ede9fe] transition-all duration-200 shadow-sm hover:scale-105 focus:scale-105 focus:outline-none"
                >
                  <span>📖</span>
                  <span>View All Bookings →</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 