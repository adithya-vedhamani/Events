'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Clock, Users, LogOut, Search, CheckCircle, XCircle, QrCode, Mail, Phone, Building } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface Reservation {
  _id: string;
  userId: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  spaceId: {
    _id: string;
    name: string;
    address: string;
  };
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';
  paymentStatus: 'pending' | 'success' | 'failed' | 'refunded';
  bookingCode: string;
  createdAt: string;
  checkInTime?: string;
  checkOutTime?: string;
}

export default function StaffDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [bookingCode, setBookingCode] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [highlightedBookingCode, setHighlightedBookingCode] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [bookingCodeSearchResult, setBookingCodeSearchResult] = useState<Reservation | null>(null);

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
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reservations/staff-brand?status=all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setReservations(data);
      } else {
        toast.error('Failed to load reservations');
      }
    } catch (error) {
      toast.error('Error loading reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleCheckIn = async (reservationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations/${reservationId}/check-in`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        loadReservations();
        toast.success('Guest checked in successfully!');
      } else {
        const error = await response.json();
        if (response.status === 404) {
          toast.error('Reservation not found.');
        } else {
          toast.error(error.message || 'Failed to check in guest');
        }
      }
    } catch (error) {
      toast.error('Failed to check in guest');
    }
  };

  const handleCheckOut = async (reservationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations/${reservationId}/check-out`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        loadReservations();
        toast.success('Guest checked out successfully!');
      } else {
        const error = await response.json();
        if (response.status === 404) {
          toast.error('Reservation not found.');
        } else {
          toast.error(error.message || 'Failed to check out guest');
        }
      }
    } catch (error) {
      toast.error('Failed to check out guest');
    }
  };

  const handleMarkNoShow = async (reservationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations/${reservationId}/no-show`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        loadReservations();
        toast.success('Marked as no-show successfully!');
      } else {
        const error = await response.json();
        if (response.status === 404) {
          toast.error('Reservation not found.');
        } else {
          toast.error(error.message || 'Failed to mark as no-show');
        }
      }
    } catch (error) {
      toast.error('Failed to mark as no-show');
    }
  };

  const searchByBookingCode = async () => {
    if (!bookingCode.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reservations/by-code/${bookingCode}`,
        {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        }
      );
      if (response.ok) {
        const reservation = await response.json();
        toast.success(
          `Found reservation for ${reservation.userId.firstName} ${reservation.userId.lastName}`
        );
        setBookingCodeSearchResult(reservation);
        setCurrentPage(1);
      } else {
        toast.error("Booking code not found");
        setBookingCodeSearchResult(null);
      }
    } catch (error) {
      toast.error("Failed to search booking code");
      setBookingCodeSearchResult(null);
    }
  };

  const clearBookingCodeSearch = () => {
    setBookingCodeSearchResult(null);
    setBookingCode("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
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

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch = 
      reservation.userId.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.userId.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.userId.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.spaceId.name.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesDate = true;
    if (selectedDate) {
      const resDate = new Date(reservation.startTime).toISOString().split('T')[0];
      matchesDate = resDate === selectedDate;
    }
    if (filter === 'today') {
      return matchesSearch && matchesDate && new Date(reservation.startTime).toDateString() === new Date().toDateString();
    }
    if (filter === 'upcoming') {
      return matchesSearch && matchesDate && new Date(reservation.startTime) > new Date() && reservation.status === 'confirmed';
    }
    if (filter === 'checked-in') {
      return matchesSearch && matchesDate && reservation.status === 'checked_in';
    }
    if (filter === 'no-show') {
      return matchesSearch && matchesDate && reservation.status === 'no_show';
    }
    if (filter === 'completed') {
      return matchesSearch && matchesDate && reservation.status === 'completed';
    }
    if (filter === 'checked-out') {
      return matchesSearch && matchesDate && reservation.status === 'checked_out';
    }
    return matchesSearch && matchesDate;
  });

  let paginatedReservations = filteredReservations;
  if (bookingCodeSearchResult) {
    paginatedReservations = [bookingCodeSearchResult];
  } else {
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    paginatedReservations = filteredReservations.slice(startIdx, endIdx);
  }
  const totalPages = Math.ceil(filteredReservations.length / pageSize);

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedDate("");
    setFilter("all");
    setBookingCode("");
    setBookingCodeSearchResult(null);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f3e8ff] via-[#e9d5ff] to-[#8b55ff] animate-gradient-move" style={{ fontFamily: 'Blinker, sans-serif' }}>
        <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-[#8b55ff]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3e8ff] via-[#e9d5ff] to-[#f8fafc] animate-gradient-move" style={{ fontFamily: 'Blinker, sans-serif' }}>
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-[#e9d5ff] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
          <div className="flex items-center gap-4 w-full justify-center">
            <Building className="h-8 w-8 text-[#8b55ff]" />
            <div>
              <h1 className="text-2xl font-extrabold text-black tracking-tight">Staff Check-In Dashboard</h1>
              <p className="text-sm text-[#8b55ff] font-medium">Welcome, {user?.firstName} {user?.lastName}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search and Filters */}
        <section className="bg-white/70 backdrop-blur rounded-2xl shadow-lg mb-8 p-6 flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-black mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8b55ff]" />
                <input
                  type="text"
                  placeholder="Search by name, email, or booking code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-[#e9d5ff] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b55ff] bg-white text-black font-medium"
                />
              </div>
            </div>
            {/* Filter */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-black mb-2">Filter</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-[#e9d5ff] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b55ff] bg-white text-black font-medium"
              >
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
                <option value="checked-in">Checked In</option>
                <option value="checked-out">Checked Out</option>
                <option value="completed">Completed</option>
                <option value="no-show">No Shows</option>
              </select>
            </div>
            {/* Booking Code Search */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-black mb-2">Quick Search by Booking Code</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Enter booking code..."
                  value={bookingCode}
                  onChange={(e) => setBookingCode(e.target.value)}
                  className="flex-1 px-3 py-2 border border-[#e9d5ff] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b55ff] bg-white text-black font-medium"
                />
                <button
                  onClick={searchByBookingCode}
                  className="px-4 py-2 bg-[#8b55ff] text-white rounded-lg font-bold shadow hover:bg-[#7a3fff] focus:outline-none focus:ring-2 focus:ring-[#8b55ff] transition"
                >
                  <QrCode className="h-4 w-4" />
                </button>
                {bookingCodeSearchResult && (
                  <button
                    onClick={clearBookingCodeSearch}
                    className="px-2 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 focus:outline-none font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            {/* Date Filter */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-black mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#e9d5ff] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b55ff] bg-white text-black font-medium"
              />
            </div>
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 focus:outline-none font-bold"
            >
              Clear All Filters
            </button>
          </div>
        </section>

        {/* Reservations List */}
        <section className="bg-white/80 backdrop-blur rounded-2xl shadow-xl">
          <div className="px-6 py-4 border-b border-[#e9d5ff] flex items-center justify-between">
            <h2 className="text-lg font-bold text-black">Reservations</h2>
            <span className="text-sm text-[#8b55ff] font-semibold">{paginatedReservations.length} found</span>
          </div>

          {paginatedReservations.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <Calendar className="h-16 w-16 text-[#8b55ff] mb-4 animate-bounce" />
              <p className="text-black text-lg font-bold">No reservations found</p>
              <p className="text-sm text-[#8b55ff] mt-2">Try changing your filters or check back later.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#e9d5ff]">
              {paginatedReservations.map((reservation) => (
                <div
                  key={reservation._id}
                  className="p-6 hover:bg-[#f3e8ff] transition-colors rounded-xl flex flex-col lg:flex-row lg:items-center lg:justify-between group"
                  style={{ boxShadow: '0 2px 16px 0 rgba(139,85,255,0.07)' }}
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-bold text-black">
                            {reservation.userId.firstName} {reservation.userId.lastName}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-bold rounded-full shadow ${getStatusColor(reservation.status)} ${reservation.status === 'confirmed' ? 'border border-[#8b55ff] bg-[#ede9fe] text-[#8b55ff]' : ''}`}
                            style={reservation.status === 'confirmed' ? { boxShadow: '0 0 0 2px #8b55ff33' } : {}}>
                            {getStatusText(reservation.status)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-black/80">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2 text-[#8b55ff]" />
                            <span>{reservation.spaceId.name}</span>
                          </div>
                          <div className="flex items-center">
                            <QrCode className="h-4 w-4 mr-2 text-[#8b55ff]" />
                            <span className="font-mono">{reservation.bookingCode}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-[#8b55ff]" />
                            <span>
                              {new Date(reservation.startTime).toLocaleTimeString()} - {new Date(reservation.endTime).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-[#8b55ff]" />
                            <span>{new Date(reservation.startTime).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-black/60">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1 text-[#8b55ff]" />
                            <span>{reservation.userId.email}</span>
                          </div>
                          {reservation.userId.phone && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-1 text-[#8b55ff]" />
                              <span>{reservation.userId.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 lg:mt-0 lg:ml-6">
                    <div className="flex flex-col space-y-2">
                      {reservation.status === 'confirmed' && (
                        <>
                          <button
                            onClick={() => handleCheckIn(reservation._id)}
                            className="flex items-center justify-center px-4 py-2 bg-[#8b55ff] text-white rounded-lg font-bold shadow hover:bg-[#7a3fff] focus:outline-none focus:ring-2 focus:ring-[#8b55ff] transition"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Check In
                          </button>
                          <button
                            onClick={() => handleMarkNoShow(reservation._id)}
                            className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg font-bold shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            No Show
                          </button>
                        </>
                      )}
                      {reservation.status === 'checked_in' && (
                        <button
                          onClick={() => handleCheckOut(reservation._id)}
                          className="flex items-center justify-center px-4 py-2 bg-[#8b55ff] text-white rounded-lg font-bold shadow hover:bg-[#7a3fff] focus:outline-none focus:ring-2 focus:ring-[#8b55ff] transition"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Check Out
                        </button>
                      )}
                      {reservation.status === 'completed' && (
                        <div className="text-center text-sm text-[#8b55ff] font-bold">
                          <CheckCircle className="h-6 w-6 mx-auto mb-1 text-[#8b55ff]" />
                          Completed
                        </div>
                      )}
                      {reservation.status === 'no_show' && (
                        <div className="text-center text-sm text-red-600 font-bold">
                          <XCircle className="h-6 w-6 mx-auto mb-1 text-red-600" />
                          No Show
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pagination controls (only show if not searching by booking code) */}
        {!bookingCodeSearchResult && totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 py-6">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-gray-200 text-black font-bold disabled:opacity-50"
            >
              Prev
            </button>
            <span className="px-2 text-black font-semibold">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-gray-200 text-black font-bold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
} 