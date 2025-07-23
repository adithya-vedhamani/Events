'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Clock, Users, LogOut, Plus, Building, TrendingUp, DollarSign, Eye, Settings, Building2, BarChart3, User, Sparkles, Star, Crown, Zap, Target, Award, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface Space {
  _id: string;
  name: string;
  address: string;
  capacity: number;
  isActive: boolean;
  isVerified: boolean;
  pricing: {
    basePrice: number;
    currency: string;
  };
  _count?: {
    reservations: number;
  };
}

interface Reservation {
  _id: string;
  userId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: 'pending_approval' | 'pending_payment' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'rejected' | 'no_show';
  paymentStatus: 'pending' | 'success' | 'failed' | 'refunded' | 'not_required';
  bookingCode: string;
  createdAt: string;
}

export default function BrandOwnerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  const [stats, setStats] = useState({
    totalSpaces: 0,
    totalReservations: 0,
    totalRevenue: 0,
    activeReservations: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
    loadSpaces();
    loadReservations();
  }, []);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => setShowAnimation(true), 100);
    }
  }, [loading]);

  const loadSpaces = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spaces/my-spaces`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSpaces(data);
        setStats(prev => ({ ...prev, totalSpaces: data.length }));
      }
    } catch (error) {
      console.error('Error loading spaces:', error);
    }
  };

  const loadReservations = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      const user = JSON.parse(userData || '{}');
      console.log('Loading reservations for user:', user);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations/space-owner`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Reservations response status:', response.status);
      console.log('Reservations response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Loaded reservations:', data);
        console.log('Number of reservations:', data.length);
        
        // Log each reservation for debugging
        data.forEach((reservation: any, index: number) => {
          console.log(`Reservation ${index + 1}:`, {
            id: reservation._id,
            spaceName: reservation.spaceId?.name,
            customerName: `${reservation.userId?.firstName} ${reservation.userId?.lastName}`,
            status: reservation.status,
            paymentStatus: reservation.paymentStatus,
            amount: reservation.totalAmount,
            startTime: reservation.startTime
          });
        });
        
        setReservations(data);
        
        const totalRevenue = data
          .filter((r: Reservation) => r.paymentStatus === 'success')
          .reduce((sum: number, r: Reservation) => sum + r.totalAmount, 0);
        
        const activeReservations = data.filter((r: Reservation) => 
          r.status === 'confirmed' || r.status === 'checked_in' || r.status === 'pending_payment'
        ).length;

        setStats({
          totalSpaces: spaces.length,
          totalReservations: data.length,
          totalRevenue,
          activeReservations,
        });
      } else {
        console.error('Failed to load reservations:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending_approval':
      case 'pending_payment':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'checked_in':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'no_show':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending_approval':
        return 'Pending Approval';
      case 'pending_payment':
        return 'Pending Payment';
      case 'pending':
        return 'Pending';
      case 'checked_in':
        return 'Checked In';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'rejected':
        return 'Rejected';
      case 'no_show':
        return 'No Show';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 flex items-center justify-center" style={{ fontFamily: 'Blinker, sans-serif' }}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-200 border-t-purple-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-20 w-20 border-2 border-purple-400 opacity-20"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading your dashboard...</h2>
          <p className="text-purple-600">Preparing your business insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200" style={{ fontFamily: 'Blinker, sans-serif' }}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-24 h-24 bg-purple-300 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-purple-400 rounded-full opacity-30 animate-bounce"></div>
        <div className="absolute bottom-20 left-20 w-20 h-20 bg-purple-500 rounded-full opacity-25 animate-ping"></div>
        <div className="absolute bottom-40 right-10 w-32 h-32 bg-purple-300 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-purple-400 rounded-full opacity-30 animate-bounce"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className={`flex justify-between items-center mb-12 transition-all duration-1000 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div>
            <div className="flex items-center mb-2">
              <Crown className="h-8 w-8 text-purple-600 mr-3" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                Welcome back, {user?.firstName}! 👋
              </h1>
            </div>
            <p className="text-gray-600 text-lg">Manage your spaces and track your business performance</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setLoading(true);
                loadSpaces();
                loadReservations();
              }}
              className="bg-white/80 backdrop-blur-sm text-purple-700 px-6 py-3 rounded-xl hover:bg-white transition-all duration-300 hover:scale-105 border border-purple-200 shadow-lg"
            >
              <Zap className="h-5 w-5 inline mr-2" />
              Refresh
            </button>
            <button
              onClick={() => router.push('/dashboard/brand-owner/spaces')}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-xl flex items-center space-x-2 hover:from-purple-700 hover:to-purple-800 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <Plus className="h-5 w-5" />
              <span>Manage Spaces</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 transition-all duration-700 delay-200 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Total Spaces</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalSpaces}</p>
                <div className="flex items-center mt-2 text-green-600">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Active</span>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Building className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalReservations}</p>
                <div className="flex items-center mt-2 text-blue-600">
                  <Activity className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">All time</span>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Active Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeReservations}</p>
                <div className="flex items-center mt-2 text-yellow-600">
                  <Target className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Current</span>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-2 text-green-600">
                  <Award className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Earnings</span>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200 p-8 mb-12 transition-all duration-700 delay-400 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center mb-6">
            <Sparkles className="h-6 w-6 text-purple-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 hover:from-purple-100 hover:to-purple-200 transition-all duration-300 hover:scale-105 cursor-pointer border border-purple-200" onClick={() => router.push('/dashboard/brand-owner/spaces')}>
              <div className="flex items-center">
                <div className="p-3 bg-purple-600 rounded-lg mr-4">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Manage Spaces</h3>
                  <p className="text-gray-600 text-sm">Create and manage your spaces</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 hover:scale-105 cursor-pointer border border-blue-200" onClick={() => router.push('/dashboard/brand-owner/analytics')}>
              <div className="flex items-center">
                <div className="p-3 bg-blue-600 rounded-lg mr-4">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
                  <p className="text-gray-600 text-sm">View performance insights</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 hover:from-green-100 hover:to-green-200 transition-all duration-300 hover:scale-105 cursor-pointer border border-green-200" onClick={() => router.push('/dashboard/brand-owner/bookings')}>
              <div className="flex items-center">
                <div className="p-3 bg-green-600 rounded-lg mr-4">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Bookings</h3>
                  <p className="text-gray-600 text-sm">Manage reservations</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 hover:from-orange-100 hover:to-orange-200 transition-all duration-300 hover:scale-105 cursor-pointer border border-orange-200" onClick={() => router.push('/dashboard/brand-owner/customers')}>
              <div className="flex items-center">
                <div className="p-3 bg-orange-600 rounded-lg mr-4">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Customers</h3>
                  <p className="text-gray-600 text-sm">Manage customer base</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Spaces */}
        <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200 transition-all duration-700 delay-600 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="p-8 border-b border-purple-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Star className="h-6 w-6 text-purple-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Your Spaces</h2>
              </div>
              <button
                onClick={() => router.push('/dashboard/brand-owner/spaces')}
                className="text-purple-600 hover:text-purple-700 font-semibold hover:scale-105 transition-all duration-300"
              >
                View All →
              </button>
            </div>
          </div>
          <div className="p-8">
            {spaces.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {spaces.slice(0, 6).map((space, index) => (
                  <div key={space._id} className={`bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer`} style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-lg text-gray-900">{space.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        space.isActive ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'
                      }`}>
                        {space.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-purple-500" />
                      {space.address}
                    </p>
                    <div className="flex justify-between items-center text-sm mb-4">
                      <span className="text-gray-600 flex items-center">
                        <Users className="h-4 w-4 mr-1 text-purple-500" />
                        {space.capacity} people
                      </span>
                      <span className="font-bold text-purple-700 text-lg">
                        ₹{space.pricing.basePrice}
                      </span>
                    </div>
                    <button
                      onClick={() => router.push(`/dashboard/brand-owner/spaces/${space._id}`)}
                      className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors duration-300 font-semibold"
                    >
                      Manage Space
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Building className="h-10 w-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">No spaces yet</h3>
                <p className="text-gray-600 mb-6">Create your first space to start earning</p>
                <button
                  onClick={() => router.push('/dashboard/brand-owner/spaces')}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Add Your First Space
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Reservations */}
        {reservations.length > 0 && (
          <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200 mt-12 transition-all duration-700 delay-800 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="p-8 border-b border-purple-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Activity className="h-6 w-6 text-purple-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">Recent Bookings</h2>
                </div>
                <button
                  onClick={() => router.push('/dashboard/brand-owner/reservations')}
                  className="text-purple-600 hover:text-purple-700 font-semibold hover:scale-105 transition-all duration-300"
                >
                  View All →
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-purple-50">
                  <tr>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-purple-800 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-purple-800 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-purple-800 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-purple-800 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100">
                  {reservations.slice(0, 5).map((reservation, index) => (
                    <tr key={reservation._id} className="hover:bg-purple-50 transition-colors duration-200">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {reservation.userId.firstName} {reservation.userId.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{reservation.userId.email}</div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {new Date(reservation.startTime).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm font-bold text-purple-700">
                        ₹{reservation.totalAmount}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(reservation.status)}`}>
                          {getStatusText(reservation.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}