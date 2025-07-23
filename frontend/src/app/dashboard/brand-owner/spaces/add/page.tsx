'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Image,
  MapPin,
  Upload,
  X,
  Sparkles,
  Crown,
  Building2,
  DollarSign,
  Settings,
  Star,
  CheckCircle,
  Zap,
  Heart,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  Users,
  Clock,
  Tag,
  Camera,
  Map,
  Wifi,
  Car,
  Utensils,
  Bath,
  Monitor,
  Volume2,
  Snowflake,
  Flame,
  Shield,
  ChefHat,
  Sparkles as SparklesIcon
} from 'lucide-react';
import dynamic from 'next/dynamic';

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

export default function AddSpacePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  useEffect(() => {
    setTimeout(() => setShowAnimation(true), 100);
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    if (checked) {
      setSelectedAmenities(prev => [...prev, amenity]);
    } else {
      setSelectedAmenities(prev => prev.filter(a => a !== amenity));
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case 'WiFi': return <Wifi className="h-4 w-4" />;
      case 'Parking': return <Car className="h-4 w-4" />;
      case 'Kitchen': return <Utensils className="h-4 w-4" />;
      case 'Bathroom': return <Bath className="h-4 w-4" />;
      case 'Projector': return <Monitor className="h-4 w-4" />;
      case 'Sound System': return <Volume2 className="h-4 w-4" />;
      case 'Air Conditioning': return <Snowflake className="h-4 w-4" />;
      case 'Heating': return <Flame className="h-4 w-4" />;
      case 'Security': return <Shield className="h-4 w-4" />;
      case 'Accessibility': return <Award className="h-4 w-4" />;
      case 'Catering': return <ChefHat className="h-4 w-4" />;
      case 'Cleaning': return <SparklesIcon className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const handleCreateSpace = async (formData: FormData) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      // Convert FormData to JSON object with proper structure
      const formDataObj = Object.fromEntries(formData.entries());
      
      // Structure the data properly for the backend
      const spaceData = {
        name: formDataObj.name,
        description: formDataObj.description,
        address: formDataObj.address,
        capacity: parseInt(formDataObj.capacity as string),
        latitude: latitude !== null ? latitude : undefined,
        longitude: longitude !== null ? longitude : undefined,
        category: formDataObj.category || undefined,
        pricing: {
          type: formDataObj['pricing.type'],
          basePrice: parseFloat(formDataObj['pricing.basePrice'] as string),
          currency: formDataObj['pricing.currency'] || 'INR',
          monthlyPrice: formDataObj['pricing.monthlyPrice'] ? parseFloat(formDataObj['pricing.monthlyPrice'] as string) : undefined,
          minimumBookingHours: parseInt(formDataObj['pricing.minimumBookingHours'] as string) || 1,
          peakHours: [],
          timeBlocks: [],
          promoCodes: [],
          specialEvents: [],
        },
        amenities: selectedAmenities.map((name: string) => ({
          name,
          available: true,
        })),
        tags: [],
      };

      // Create a new FormData for the request
      const requestFormData = new FormData();
      
      // Add the JSON data as a string
      requestFormData.append('data', JSON.stringify(spaceData));
      
      // Add images
      selectedImages.forEach((image, index) => {
        requestFormData.append('images', image);
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spaces`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: requestFormData,
      });

      if (response.ok) {
        const result = await response.json();
        router.push('/dashboard/brand-owner/spaces');
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          const text = await response.text();
          errorData = { message: text || 'Unknown error' };
        }
        console.error('Error creating space:', errorData);
        alert(errorData.message || 'Failed to create space');
      }
    } catch (error) {
      console.error('Error creating space:', error);
      alert('Failed to create space');
    } finally {
      setSubmitting(false);
    }
  };

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

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-purple-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex justify-between items-center py-6 transition-all duration-1000 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-purple-600 hover:text-purple-700 p-3 hover:bg-purple-50 rounded-xl transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <div className="flex items-center mb-1">
                  <Building2 className="h-6 w-6 text-purple-600 mr-2" />
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                    Add New Space
                  </h1>
                </div>
                <p className="text-gray-600">Create a stunning new space for your business</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleCreateSpace(formData);
        }}>
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 transition-all duration-700 delay-200 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Basic Info */}
            <div className="space-y-6">
              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3 animate-pulse"></div>
                  Basic Information
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Space Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full border-2 border-purple-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                      placeholder="Enter your space name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      required
                      rows={4}
                      className="w-full border-2 border-purple-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm resize-none"
                      placeholder="Describe your amazing space..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Search Address</label>
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={searchAddress}
                        onChange={e => setSearchAddress(e.target.value)}
                        className="flex-1 border-2 border-purple-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                        placeholder="Search for an address..."
                      />
                      <button
                        type="button"
                        className={`px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl flex items-center space-x-2 hover:from-purple-700 hover:to-purple-800 transition-all duration-300 hover:scale-105 shadow-lg ${searchLoading || !searchAddress ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={async () => {
                          setSearchError('');
                          setSearchLoading(true);
                          const coords = await geocodeAddress(searchAddress);
                          if (coords) {
                            setLatitude(coords[0]);
                            setLongitude(coords[1]);
                            const addr = await reverseGeocode(coords[0], coords[1]);
                            setAddress(addr);
                          } else {
                            setSearchError('No results found for this address. Please try another search.');
                          }
                          setSearchLoading(false);
                        }}
                        disabled={searchLoading || !searchAddress}
                      >
                        {searchLoading ? (
                          <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                        ) : <MapPin className="h-5 w-5" />}
                        <span>Search</span>
                      </button>
                    </div>
                    {searchError && (
                      <div className="text-red-600 text-sm mt-3 bg-red-50 p-3 rounded-xl border border-red-200">{searchError}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      required
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full border-2 border-purple-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                      placeholder="Enter complete address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Capacity *
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      required
                      min="1"
                      className="w-full border-2 border-purple-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                      placeholder="Number of people"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                  Location
                </h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Pick Location on Map
                  </label>
                  <div className="border-2 border-purple-200 rounded-xl overflow-hidden shadow-lg">
                    <MapPicker
                      value={latitude && longitude ? [latitude, longitude] : undefined}
                      onChange={([lat, lng]) => {
                        setLatitude(lat);
                        setLongitude(lng);
                      }}
                    />
                  </div>
                  {latitude !== null && longitude !== null && (
                    <div className="flex space-x-4 mt-4">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-600 mb-2">Latitude</label>
                        <input
                          type="number"
                          name="latitude"
                          value={latitude}
                          readOnly
                          className="w-full border-2 border-purple-200 rounded-xl px-3 py-3 bg-purple-50 text-gray-700 text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-600 mb-2">Longitude</label>
                        <input
                          type="number"
                          name="longitude"
                          value={longitude}
                          readOnly
                          className="w-full border-2 border-purple-200 rounded-xl px-3 py-3 bg-purple-50 text-gray-700 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing & Amenities */}
            <div className="space-y-6">
              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3 animate-pulse"></div>
                  Pricing Information
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Pricing Type *
                    </label>
                    <select
                      name="pricing.type"
                      required
                      defaultValue="hourly"
                      onChange={(e) => {
                        const monthlyField = document.getElementById('monthlyPriceField');
                        if (monthlyField) {
                          monthlyField.style.display = e.target.value === 'monthly' ? 'block' : 'none';
                        }
                      }}
                      className="w-full border-2 border-purple-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                    >
                      <option value="free">Free</option>
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="monthly">Monthly</option>
                      <option value="package">Package</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Base Price *
                    </label>
                    <input
                      type="number"
                      name="pricing.basePrice"
                      required
                      min="0"
                      step="0.01"
                      className="w-full border-2 border-purple-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Currency
                    </label>
                    <select
                      name="pricing.currency"
                      defaultValue="INR"
                      className="w-full border-2 border-purple-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>

                  {/* Monthly Price (for monthly pricing) */}
                  <div id="monthlyPriceField" style={{ display: 'none' }}>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Monthly Price
                    </label>
                    <input
                      type="number"
                      name="pricing.monthlyPrice"
                      min="0"
                      step="0.01"
                      className="w-full border-2 border-purple-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                      placeholder="Monthly price"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Minimum Booking Hours
                    </label>
                    <input
                      type="number"
                      name="pricing.minimumBookingHours"
                      min="1"
                      defaultValue={1}
                      className="w-full border-2 border-purple-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                      placeholder="1"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-3 animate-pulse"></div>
                  Amenities
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    'WiFi', 'Parking', 'Kitchen', 'Bathroom', 'Projector', 'Sound System',
                    'Air Conditioning', 'Heating', 'Security', 'Accessibility', 'Catering', 'Cleaning'
                  ].map((amenity) => (
                    <label key={amenity} className="flex items-center space-x-3 p-3 hover:bg-purple-50 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer border border-transparent hover:border-purple-200">
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(amenity)}
                        onChange={(e) => handleAmenityChange(amenity, e.target.checked)}
                        className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 h-5 w-5"
                      />
                      <div className="flex items-center space-x-2">
                        <span className="text-purple-600">{getAmenityIcon(amenity)}</span>
                        <span className="text-sm font-medium text-gray-700">{amenity}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-3 h-3 bg-pink-500 rounded-full mr-3 animate-pulse"></div>
                  Space Images
                </h3>
                <div className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center hover:border-purple-400 transition-all duration-300 bg-purple-50/50">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer text-purple-600 hover:text-purple-700 transition-all duration-300"
                  >
                    <Camera className="h-16 w-16 mx-auto mb-4 text-purple-400" />
                    <span className="text-lg font-semibold">Click to upload images</span>
                    <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
                  </label>
                </div>
                
                {imagePreview.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreview.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-28 object-cover rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:bg-red-600 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className={`flex justify-end space-x-4 mt-12 pt-8 border-t border-purple-200 transition-all duration-700 delay-400 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-4 border-2 border-purple-200 rounded-xl text-sm font-semibold text-purple-700 hover:bg-purple-50 transition-all duration-300 hover:scale-105"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-10 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                  Creating Space...
                </div>
              ) : (
                <div className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Create Space
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 