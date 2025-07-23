'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Users, LogOut, Plus, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'consumer' | 'brand_owner' | 'staff';
}

interface Reservation {
  _id: string;
  spaceId: {
    name: string;
    address: string;
  };
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: string;
  bookingCode: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Redirect based on role
        switch (parsedUser.role) {
          case 'consumer':
            router.push('/dashboard/consumer');
            break;
          case 'brand_owner':
            router.push('/dashboard/brand-owner');
            break;
          case 'staff':
            router.push('/dashboard/staff');
            break;
          default:
            // Stay on this page and show error
            setLoading(false);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/login');
      }
    } else {
      setLoading(false);
    }
  }, [router]);

  const loadReservations = async () => {
    try {
      const response = await api.get('/reservations/my');
      setReservations(response.data);
    } catch (error) {
      toast.error('Failed to load reservations');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    router.push('/');
    toast.success('Logged out successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'checked_in':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Please log in to access your dashboard.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-purple-600">
                Events
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {user.firstName} {user.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage your reservations and account
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/spaces"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <Plus className="w-6 h-6 text-purple-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Browse Spaces</h3>
                <p className="text-sm text-gray-600">Find and book event spaces</p>
              </div>
            </div>
          </Link>

          {user.role === 'brand_owner' && (
            <Link
              href="/dashboard/brand"
              className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Manage Spaces</h3>
                  <p className="text-sm text-gray-600">Create and manage your spaces</p>
                </div>
              </div>
            </Link>
          )}

          {user.role === 'staff' && (
            <Link
              href="/dashboard/staff"
              className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <Calendar className="w-6 h-6 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Staff Dashboard</h3>
                  <p className="text-sm text-gray-600">Manage check-ins and operations</p>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Reservations */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">My Reservations</h2>
          </div>
          <div className="p-6">
            {reservations.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reservations yet</h3>
                <p className="text-gray-600 mb-4">
                  Start by browsing available spaces and making your first booking.
                </p>
                <Link
                  href="/spaces"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  Browse Spaces
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reservations.map((reservation) => (
                  <div
                    key={reservation._id}
                    className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {reservation.spaceId.name}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          {reservation.spaceId.address}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(reservation.startTime).toLocaleDateString()} at{' '}
                          {new Date(reservation.startTime).toLocaleTimeString()}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <span className="font-medium">₹{reservation.totalAmount}</span>
                          <span className="mx-2">•</span>
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {reservation.bookingCode}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            reservation.status
                          )}`}
                        >
                          {reservation.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <button
                          onClick={() => {
                            // Handle cancel reservation
                            toast.info('Cancel functionality coming soon');
                          }}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 