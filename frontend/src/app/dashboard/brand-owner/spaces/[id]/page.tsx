'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  Users, 
  Calendar, 
  Clock, 
  CreditCard, 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  X,
  Star,
  Settings,
  Edit,
  Save,
  ArrowLeft,
  Building2,
  Sparkles,
  Award,
  Zap,
  CheckCircle
} from 'lucide-react';
import ImageGallery from '@/components/ImageGallery';
import PricingManagement from '@/components/PricingManagement';

interface Space {
  _id: string;
  name: string;
  description: string;
  address: string;
  capacity: number;
  category?: string;
  subcategory?: string;
  openingHours?: string;
  closingHours?: string;
  tags?: string[];
  images: Array<{
    url: string;
    publicId: string;
    isPrimary: boolean;
    caption?: string;
  }>;
  pricing: {
    type: string;
    basePrice: number;
    currency: string;
    monthlyPrice?: number;
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
      name: string;
      startDate: string;
      endDate: string;
      price: number;
    }>;
    minimumBookingHours: number;
  };
  amenities: Array<{
    name: string;
    available: boolean;
  }>;
  ownerId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function SpaceManagementPage() {
  const params = useParams();
  const router = useRouter();
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchSpace(params.id as string);
    }
    setTimeout(() => setShowAnimation(true), 100);
  }, [params.id]);

  const fetchSpace = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spaces/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSpace(data);
        setEditingSpace(data);
      } else {
        console.error('Failed to fetch space');
      }
    } catch (error) {
      console.error('Error fetching space:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingSpace) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Clean up the data to only include updatable fields
      const updateData = {
        name: editingSpace.name,
        description: editingSpace.description,
        address: editingSpace.address,
        capacity: editingSpace.capacity,
        category: editingSpace.category,
        subcategory: editingSpace.subcategory,
        openingHours: editingSpace.openingHours,
        closingHours: editingSpace.closingHours,
        tags: editingSpace.tags,
        amenities: editingSpace.amenities,
        // Don't include system fields like _id, ownerId, createdAt, updatedAt, status
      };
      
      // Debug: Log what we're sending
      console.log('Sending space data:', updateData);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spaces/${editingSpace._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedSpace = await response.json();
        setSpace(updatedSpace);
        setEditingSpace(updatedSpace);
        setIsEditing(false);
      } else {
        const errorData = await response.text();
        console.error('Failed to update space:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          url: `${process.env.NEXT_PUBLIC_API_URL}/api/spaces/${editingSpace._id}`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          }
        });
        // You might want to show this error to the user via a toast or alert
        alert(`Failed to update space: ${response.status} ${response.statusText}\n\nError: ${errorData}`);
      }
    } catch (error) {
      console.error('Error updating space:', error);
      alert('Network error occurred while updating space');
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(files);

    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
  };

  const handleAddImages = async () => {
    if (!space || selectedImages.length === 0) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      selectedImages.forEach((image) => {
        formData.append('images', image);
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spaces/${space._id}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        setSelectedImages([]);
        setImagePreview([]);
        fetchSpace(space._id);
      }
    } catch (error) {
      console.error('Error adding images:', error);
    }
  };

  const handleRemoveImage = async (publicId: string) => {
    if (!space) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spaces/${space._id}/images/${publicId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchSpace(space._id);
      }
    } catch (error) {
      console.error('Error removing image:', error);
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading space...</h2>
          <p className="text-purple-600">Fetching your space data</p>
        </div>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 flex items-center justify-center" style={{ fontFamily: 'Blinker, sans-serif' }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Space not found</h2>
          <p className="text-gray-600 mb-4">The space you're looking for doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            Go Back
          </button>
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

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-purple-200">
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
                    {space.name}
                  </h1>
                </div>
                <p className="text-gray-600">Space Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant={space.status === 'active' ? 'default' : 'secondary'} className="px-4 py-2 text-base font-semibold rounded-xl border border-purple-200">
                {space.status}
              </Badge>
              {isEditing ? (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingSpace(space);
                    }}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 transition-all duration-300 hover:scale-105 shadow-lg">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setIsEditing(true)} className="bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 transition-all duration-300 hover:scale-105 shadow-lg">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Space
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm rounded-xl shadow border border-purple-200 mb-8 z-10 relative">
            <TabsTrigger value="overview" className="text-lg font-semibold text-black data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800 data-[state=active]:shadow-md">Overview</TabsTrigger>
            <TabsTrigger value="pricing" className="text-lg font-semibold text-black data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800 data-[state=active]:shadow-md">Pricing</TabsTrigger>
            <TabsTrigger value="images" className="text-lg font-semibold text-black data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800 data-[state=active]:shadow-md">Images</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className={`space-y-6 transition-all duration-700 delay-200 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}> 
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-8">
                {/* Basic Information */}
                <Card className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center text-xl font-bold text-black">
                      <Settings className="h-5 w-5 mr-2 text-purple-600" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="name" className="font-semibold text-black">Space Name</Label>
                      <Input
                        id="name"
                        value={editingSpace?.name || ''}
                        onChange={(e) => setEditingSpace(prev => prev ? { ...prev, name: e.target.value } : null)}
                        disabled={!isEditing}
                        className="border-2 border-purple-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-600 text-white placeholder-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description" className="font-semibold text-black">Description</Label>
                      <Textarea
                        id="description"
                        value={editingSpace?.description || ''}
                        onChange={(e) => setEditingSpace(prev => prev ? { ...prev, description: e.target.value } : null)}
                        disabled={!isEditing}
                        rows={4}
                        className="border-2 border-purple-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-600 text-white placeholder-white resize-none"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address" className="font-semibold text-black">Address</Label>
                      <Input
                        id="address"
                        value={editingSpace?.address || ''}
                        onChange={(e) => setEditingSpace(prev => prev ? { ...prev, address: e.target.value } : null)}
                        disabled={!isEditing}
                        className="border-2 border-purple-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-600 text-white placeholder-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="capacity" className="font-semibold text-black">Capacity</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={editingSpace?.capacity || 0}
                        onChange={(e) => setEditingSpace(prev => prev ? { ...prev, capacity: parseInt(e.target.value) } : null)}
                        disabled={!isEditing}
                        className="border-2 border-purple-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-600 text-white placeholder-white"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Image Gallery */}
                {space.images && space.images.length > 0 && (
                  <Card className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200">
                    <CardHeader>
                      <CardTitle className="flex items-center text-xl font-bold text-black">
                        <ImageIcon className="h-5 w-5 mr-2 text-purple-600" />
                        Space Images
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ImageGallery 
                        images={space.images}
                        className="w-full"
                        showThumbnails={true}
                        autoPlay={false}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Quick Stats */}
              <div className="space-y-8">
                <Card className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-black flex items-center">
                      <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-black font-semibold">Status</span>
                      <Badge variant={space.status === 'active' ? 'default' : 'secondary'} className="px-3 py-1 rounded-full border border-purple-200 font-semibold">
                        {space.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-black font-semibold">Capacity</span>
                      <span className="font-bold text-purple-700">{space.capacity} people</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-black font-semibold">Starting Price</span>
                      <span className="font-bold text-purple-700">{getPricingDisplay(space)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-black font-semibold">Images</span>
                      <span className="font-bold text-purple-700">{space.images.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-black font-semibold">Amenities</span>
                      <span className="font-bold text-purple-700">{space.amenities.length}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing Summary */}
                <Card className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-black flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
                      Pricing Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-black">Pricing Type</label>
                      <p className="mt-1 text-sm text-gray-900 capitalize">{space.pricing.type}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-black">Base Price</label>
                      <p className="mt-1 text-sm text-purple-700 font-bold">
                        {space.pricing.currency} {space.pricing.basePrice}
                      </p>
                    </div>
                    {space.pricing.monthlyPrice && (
                      <div>
                        <label className="block text-sm font-semibold text-black">Monthly Price</label>
                        <p className="mt-1 text-sm text-purple-700 font-bold">
                          {space.pricing.currency} {space.pricing.monthlyPrice}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-black">Minimum Booking Hours</label>
                      <p className="mt-1 text-sm text-purple-700 font-bold">{space.pricing.minimumBookingHours} hours</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Peak Hours */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200 p-6">
                  <h4 className="text-lg font-bold text-black mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-purple-600" />
                    Peak Hours
                  </h4>
                  {space.pricing.peakHours.length > 0 ? (
                    <div className="space-y-2">
                      {space.pricing.peakHours.map((peak, index) => (
                        <div key={index} className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-black capitalize">{peak.day}</span>
                            <span className="text-sm text-gray-600">{peak.startTime} - {peak.endTime}</span>
                          </div>
                          <p className="text-xs text-purple-500 mt-1">
                            {peak.multiplier}x multiplier
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-purple-400">No peak hours configured</p>
                  )}
                </div>

                {/* Time Blocks */}
                {space.pricing.timeBlocks.length > 0 && (
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200 p-6 mt-8">
                    <h4 className="text-lg font-bold text-black mb-4 flex items-center">
                      <Award className="h-5 w-5 mr-2 text-purple-600" />
                      Time Blocks
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {space.pricing.timeBlocks.map((block, index) => (
                        <div key={index} className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-black">{block.hours} hours</span>
                            <span className="text-sm font-bold text-purple-700">
                              {space.pricing.currency} {block.price}
                            </span>
                          </div>
                          {block.description && (
                            <p className="text-xs text-purple-500">{block.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className={`space-y-6 transition-all duration-700 delay-200 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}> 
            <Card className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-xl font-bold text-black">
                  <span className="flex items-center">
                    <ImageIcon className="h-5 w-5 mr-2 text-purple-600" />
                    Space Images
                  </span>
                  <button
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:from-purple-700 hover:to-purple-800 transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Add Images</span>
                  </button>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Image Preview */}
                {imagePreview.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-black mb-4">New Images</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {imagePreview.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            onClick={() => {
                              setSelectedImages(prev => prev.filter((_, i) => i !== index));
                              setImagePreview(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:bg-red-600 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleAddImages}
                      className="mt-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 hover:scale-105 shadow-lg font-semibold"
                    >
                      Upload Images
                    </button>
                  </div>
                )}

                {/* Existing Images */}
                <div>
                  <h4 className="text-lg font-bold text-black mb-4">Current Images</h4>
                  {space.images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {space.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image.url}
                            alt={`Space image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-xl flex items-center justify-center">
                            <button
                              onClick={() => handleRemoveImage(image.publicId)}
                              className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          {image.isPrimary && (
                            <span className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                              Primary
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ImageIcon className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                      <p className="text-purple-500">No images uploaded yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className={`space-y-6 transition-all duration-700 delay-200 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}> 
            {space && (
              <PricingManagement spaceId={space._id} initialPricing={space.pricing} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 