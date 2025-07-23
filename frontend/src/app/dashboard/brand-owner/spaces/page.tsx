'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Image, 
  MapPin, 
  Users, 
  DollarSign, 
  Calendar,
  Upload,
  X,
  Eye,
  Settings,
  Tag,
  Clock,
  Star,
  Sparkles,
  Crown,
  Activity,
  TrendingUp,
  Award,
  Building2,
  Zap,
  Heart,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import dynamic from 'next/dynamic';

interface Space {
  _id: string;
  name: string;
  description: string;
  address: string;
  capacity: number;
  amenities: Array<{
    name: string;
    description?: string;
    available: boolean;
    icon?: string;
  }>;
  images: Array<{
    url: string;
    publicId: string;
    isPrimary: boolean;
    caption?: string;
  }>;
  pricing: {
    type: 'free' | 'hourly' | 'daily' | 'monthly' | 'package';
    basePrice: number;
    currency: string;
    peakMultiplier: number;
    offPeakMultiplier: number;
    peakHours: Array<{
      day: string;
      startTime: string;
      endTime: string;
      multiplier: number;
    }>;
    timeBlocks: Array<{
      hours: number;
      price: number;
      description?: string;
    }>;
    monthlyPrice?: number;
    promoCodes: Array<{
      code: string;
      discountPercentage: number;
      validFrom: string;
      validUntil: string;
      maxUses: number;
      usedCount: number;
      isActive: boolean;
    }>;
    specialEvents: Array<{
      eventName: string;
      startDate: string;
      endDate: string;
      price: number;
      description?: string;
    }>;
    minimumBookingHours: number;
  };
  isActive: boolean;
  isVerified: boolean;
  tags: string[];
  category?: string;
  subcategory?: string;
  rating: number;
  reviewCount: number;
  totalBookings: number;
  createdAt: string;
}

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

async function geocodeAddress(address: string): Promise<[number, number] | null> {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
  const data = await res.json();
  if (data && data.length > 0) {
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  }
  return null;
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
  const data = await res.json();
  return data.display_name || '';
}

export default function SpacesManagementPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchSpaces();
    // Initialize monthly price field visibility
    const pricingTypeSelect = document.querySelector('select[name="pricing.type"]') as HTMLSelectElement;
    if (pricingTypeSelect) {
      const monthlyField = document.getElementById('monthlyPriceField');
      if (monthlyField) {
        monthlyField.style.display = pricingTypeSelect.value === 'monthly' ? 'block' : 'none';
      }
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => setShowAnimation(true), 100);
    }
  }, [loading]);

  const fetchSpaces = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching spaces with token:', token ? 'present' : 'missing');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spaces/my-spaces`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('Fetch spaces response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched spaces:', data);
        setSpaces(data);
      } else {
        console.error('Failed to fetch spaces:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching spaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSpace = async (spaceId: string) => {
    if (!confirm('Are you sure you want to delete this space?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spaces/${spaceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchSpaces();
      }
    } catch (error) {
      console.error('Error deleting space:', error);
    }
  };

  const getPricingDisplay = (space: Space) => {
    switch (space.pricing.type) {
      case 'free':
        return 'Free';
      case 'hourly':
        return `₹${space.pricing.basePrice}/hour`;
      case 'daily':
        return `₹${space.pricing.basePrice}/day`;
      case 'monthly':
        return `₹${space.pricing.monthlyPrice || space.pricing.basePrice * 30}/month`;
      case 'package':
        return `From ₹${space.pricing.basePrice}`;
      default:
        return `₹${space.pricing.basePrice}`;
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading your spaces...</h2>
          <p className="text-purple-600">Fetching your venue data</p>
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
              <Building2 className="h-8 w-8 text-purple-600 mr-3" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                My Spaces
              </h1>
            </div>
            <p className="text-gray-600 text-lg">Manage your event spaces and pricing</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={fetchSpaces}
              className="bg-white/80 backdrop-blur-sm text-purple-700 px-4 py-3 rounded-xl hover:bg-white transition-all duration-300 hover:scale-105 border border-purple-200 shadow-lg"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button
              onClick={() => router.push('/dashboard/brand-owner/spaces/add')}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:from-purple-700 hover:to-purple-800 transition-all duration-300 hover:scale-105 shadow-lg"
              type="button"
            >
              <Plus className="h-5 w-5" />
              <span>Add New Space</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 transition-all duration-700 delay-200 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Spaces</p>
                <p className="text-3xl font-bold text-purple-600">{spaces.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Spaces</p>
                <p className="text-3xl font-bold text-green-600">
                  {spaces.filter(s => s.isActive).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {spaces.length > 0 
                    ? (spaces.reduce((sum, s) => sum + s.rating, 0) / spaces.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-3xl font-bold text-blue-600">
                  {spaces.reduce((sum, s) => sum + s.totalBookings, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Spaces Grid */}
        {spaces.length === 0 ? (
          <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200 p-12 text-center transition-all duration-700 delay-400 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">No spaces yet</h3>
            <p className="text-gray-600 mb-6">Create your first space to start earning</p>
            <button
              onClick={() => router.push('/dashboard/brand-owner/spaces/add')}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 hover:scale-105 shadow-lg font-semibold"
            >
              <Plus className="h-5 w-5 inline mr-2" />
              Add Your First Space
            </button>
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-700 delay-400 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {spaces.map((space, index) => (
              <div key={space._id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
                {/* Image */}
                <div className="relative h-56 bg-gradient-to-br from-purple-100 to-purple-200">
                  {space.images && space.images.length > 0 ? (
                    <img
                      src={space.images.find(img => img.isPrimary)?.url || space.images[0].url}
                      alt={space.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="h-16 w-16 text-purple-400" />
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="absolute top-3 right-3 flex space-x-2">
                    <button
                      onClick={() => router.push(`/dashboard/brand-owner/spaces/${space._id}`)}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-300 hover:scale-110"
                    >
                      <Edit className="h-4 w-4 text-purple-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteSpace(space._id)}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-300 hover:scale-110"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                  
                  {/* Status Badge */}
                  {!space.isActive && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        Inactive
                      </span>
                    </div>
                  )}
                  
                  {/* Rating Badge */}
                  <div className="absolute bottom-3 left-3">
                    <div className="flex items-center bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-sm font-semibold text-gray-900">{space.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-gray-900 text-xl group-hover:text-purple-600 transition-colors duration-300">{space.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      space.isActive ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {space.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{space.description}</p>
                  
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <MapPin className="h-4 w-4 mr-2 text-purple-500" />
                    <span className="truncate font-medium">{space.address}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center text-gray-500">
                      <Users className="h-4 w-4 mr-2 text-purple-500" />
                      <span className="font-medium">{space.capacity} people</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                      <span className="font-medium">{space.totalBookings} bookings</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold text-purple-600">
                      {getPricingDisplay(space)}
                    </span>
                    <div className="flex items-center text-purple-600">
                      <Zap className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Premium</span>
                    </div>
                  </div>

                  {/* Key Amenities */}
                  {space.amenities && space.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(() => {
                        const keyAmenities = ['WiFi', 'Parking', 'Kitchen', 'Bathroom', 'Projector'];
                        const availableKeyAmenities = space.amenities
                          .filter(amenity => keyAmenities.includes(amenity.name))
                          .slice(0, 3);
                        
                        return (
                          <>
                            {availableKeyAmenities.map((amenity, index) => (
                              <span
                                key={index}
                                className="bg-purple-50 text-purple-700 text-xs px-3 py-1 rounded-full font-medium border border-purple-200"
                              >
                                {amenity.name}
                              </span>
                            ))}
                            {space.amenities.length > availableKeyAmenities.length && (
                              <span className="text-xs text-purple-600 font-medium">
                                +{space.amenities.length - availableKeyAmenities.length} more
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={() => router.push(`/dashboard/brand-owner/spaces/${space._id}`)}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-300 hover:scale-105 shadow-lg"
                    >
                      <Settings className="h-4 w-4 inline mr-2" />
                      Manage
                    </button>
                    <button
                      onClick={() => router.push(`/spaces/${space._id}`)}
                      className="px-4 py-3 border-2 border-purple-200 rounded-xl text-sm font-semibold text-purple-700 hover:bg-purple-50 transition-all duration-300 hover:scale-105"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 