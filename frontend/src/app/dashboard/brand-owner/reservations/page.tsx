'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users, CreditCard, CheckCircle, XCircle, Clock as ClockIcon, Eye, Sparkles, Star, Crown, Activity, TrendingUp, DollarSign, Filter, RefreshCw, ArrowUpRight, ArrowDownRight, Award } from 'lucide-react';
import { format } from 'date-fns';

interface Reservation {
  _id: string;
  spaceId: {
    _id: string;
    name: string;
    address: string;
    images: Array<{ url: string }>;
  };
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: 'pending_approval' | 'pending_payment' | 'confirmed' | 'cancelled' | 'rejected' | 'completed';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded' | 'not_required';
  createdAt: string;
  updatedAt: string;
}

export default function BrandOwnerReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending_approval' | 'pending_payment' | 'confirmed' | 'cancelled' | 'rejected' | 'completed'>('all');

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => setShowAnimation(true), 100);
    }
  }, [loading]);

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations/space-owner`, {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending_approval':
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending_approval':
      case 'pending_payment':
        return <ClockIcon className="h-4 w-4" />;
      case 'cancelled':
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'Pending Approval';
      case 'pending_payment':
        return 'Pending Payment';
      case 'confirmed':
        return 'Confirmed';
      case 'cancelled':
        return 'Cancelled';
      case 'rejected':
        return 'Rejected';
      case 'completed':
        return 'Completed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'refunded':
        return 'Refunded';
      case 'not_required':
        return 'Not Required';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    if (filter === 'all') return true;
    return reservation.status === filter;
  });

  const getStats = () => {
    const total = reservations.length;
    const pendingApproval = reservations.filter(r => r.status === 'pending_approval').length;
    const pendingPayment = reservations.filter(r => r.status === 'pending_payment').length;
    const confirmed = reservations.filter(r => r.status === 'confirmed').length;
    const completed = reservations.filter(r => r.status === 'completed').length;
    const cancelled = reservations.filter(r => r.status === 'cancelled').length;
    const rejected = reservations.filter(r => r.status === 'rejected').length;

    return { total, pendingApproval, pendingPayment, confirmed, completed, cancelled, rejected };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 flex items-center justify-center" style={{ fontFamily: 'Blinker, sans-serif' }}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-200 border-t-purple-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-20 w-20 border-2 border-purple-400 opacity-20"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading reservations...</h2>
          <p className="text-purple-600">Fetching your booking data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 flex items-center justify-center" style={{ fontFamily: 'Blinker, sans-serif' }}>
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Reservations</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={fetchReservations} className="bg-purple-600 hover:bg-purple-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
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
                Reservations Management
              </h1>
            </div>
            <p className="text-gray-600 text-lg">Monitor and manage all your space bookings</p>
          </div>
          <button
            onClick={fetchReservations}
            className="bg-white/80 backdrop-blur-sm text-purple-700 px-6 py-3 rounded-xl hover:bg-white transition-all duration-300 hover:scale-105 border border-purple-200 shadow-lg"
          >
            <RefreshCw className="h-5 w-5 inline mr-2" />
            Refresh
          </button>
        </div>
        
        {/* Stats Cards */}
        <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 mb-12 transition-all duration-700 delay-200 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{stats.total}</div>
              <div className="text-sm font-medium text-gray-600">Total</div>
              <div className="flex items-center justify-center mt-2 text-purple-600">
                <Activity className="h-4 w-4 mr-1" />
                <span className="text-xs">All time</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.pendingApproval}</div>
              <div className="text-sm font-medium text-gray-600">Pending Approval</div>
              <div className="flex items-center justify-center mt-2 text-yellow-600">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-xs">Awaiting</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">{stats.pendingPayment}</div>
              <div className="text-sm font-medium text-gray-600">Pending Payment</div>
              <div className="flex items-center justify-center mt-2 text-orange-600">
                <CreditCard className="h-4 w-4 mr-1" />
                <span className="text-xs">Payment</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.confirmed}</div>
              <div className="text-sm font-medium text-gray-600">Confirmed</div>
              <div className="flex items-center justify-center mt-2 text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-xs">Active</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stats.completed}</div>
              <div className="text-sm font-medium text-gray-600">Completed</div>
              <div className="flex items-center justify-center mt-2 text-blue-600">
                <Award className="h-4 w-4 mr-1" />
                <span className="text-xs">Finished</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">{stats.cancelled}</div>
              <div className="text-sm font-medium text-gray-600">Cancelled</div>
              <div className="flex items-center justify-center mt-2 text-red-600">
                <XCircle className="h-4 w-4 mr-1" />
                <span className="text-xs">Cancelled</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">{stats.rejected}</div>
              <div className="text-sm font-medium text-gray-600">Rejected</div>
              <div className="flex items-center justify-center mt-2 text-red-600">
                <XCircle className="h-4 w-4 mr-1" />
                <span className="text-xs">Rejected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className={`flex flex-wrap gap-3 mb-8 transition-all duration-700 delay-400 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center mr-4">
            <Filter className="h-5 w-5 text-purple-600 mr-2" />
            <span className="text-sm font-semibold text-gray-700">Filter by:</span>
          </div>
          {([
            { value: 'all', label: 'All', color: 'purple' },
            { value: 'pending_approval', label: 'Pending Approval', color: 'yellow' },
            { value: 'pending_payment', label: 'Pending Payment', color: 'orange' },
            { value: 'confirmed', label: 'Confirmed', color: 'green' },
            { value: 'completed', label: 'Completed', color: 'blue' },
            { value: 'cancelled', label: 'Cancelled', color: 'red' },
            { value: 'rejected', label: 'Rejected', color: 'red' }
          ] as const).map(({ value, label, color }) => (
            <Button
              key={value}
              variant={filter === value ? 'default' : 'outline'}
              onClick={() => setFilter(value)}
              size="sm"
              className={`${
                filter === value 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'bg-white/80 backdrop-blur-sm border-purple-200 text-gray-700 hover:bg-purple-50'
              } transition-all duration-300 hover:scale-105 font-semibold`}
            >
              {label}
            </Button>
          ))}
        </div>
        
        {filteredReservations.length === 0 ? (
          <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200 p-12 text-center transition-all duration-700 delay-600 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">No reservations found</h3>
            <p className="text-gray-600 mb-4">No bookings match your current filter criteria</p>
            {filter !== 'all' && (
              <p className="text-sm text-purple-600">Try changing the filter or check back later</p>
            )}
          </div>
        ) : (
          <div className={`space-y-6 transition-all duration-700 delay-600 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {filteredReservations.map((reservation, index) => (
              <Card key={reservation._id} className="bg-white/90 backdrop-blur-sm border border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <Star className="h-5 w-5 text-purple-600 mr-2" />
                        <CardTitle className="text-xl font-bold text-gray-900">{reservation.spaceId.name}</CardTitle>
                      </div>
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-2 text-purple-500" />
                        <span className="text-sm font-medium">{reservation.spaceId.address}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-2 text-purple-500" />
                        <span className="text-sm font-medium">Booked by: {reservation.userId.firstName} {reservation.userId.lastName}</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Badge className={`${getStatusColor(reservation.status)} font-semibold px-3 py-1`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(reservation.status)}
                          {getStatusLabel(reservation.status)}
                        </div>
                      </Badge>
                      <Badge className={`${getPaymentStatusColor(reservation.paymentStatus)} font-semibold px-3 py-1`}>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {getPaymentStatusLabel(reservation.paymentStatus)}
                        </div>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                      <Calendar className="h-5 w-5 mr-3 text-purple-600" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {format(new Date(reservation.startTime), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">Date</div>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                      <Clock className="h-5 w-5 mr-3 text-blue-600" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {format(new Date(reservation.startTime), 'h:mm a')} - {format(new Date(reservation.endTime), 'h:mm a')}
                        </div>
                        <div className="text-xs text-gray-500">Time</div>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-green-50 rounded-lg">
                      <DollarSign className="h-5 w-5 mr-3 text-green-600" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          ₹{reservation.totalAmount.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">Amount</div>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                      <Users className="h-5 w-5 mr-3 text-orange-600" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {reservation.userId.email}
                        </div>
                        <div className="text-xs text-gray-500">Email</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-purple-200">
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span className="flex items-center">
                        <Sparkles className="h-3 w-3 mr-1 text-purple-500" />
                        Booked on {format(new Date(reservation.createdAt), 'MMM dd, yyyy')}
                      </span>
                      <span className="font-mono text-purple-600 font-semibold">
                        ID: {reservation._id.slice(-8)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 