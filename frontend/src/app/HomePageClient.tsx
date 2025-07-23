'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    type: string;
    basePrice: number;
    currency: string;
    hourlyRate?: number;
    dailyRate?: number;
    monthlyRate?: number;
    bundles?: Array<{
      _id: string;
      name: string;
      type: string;
      description: string;
      price: number;
      value: number;
      validFrom: string;
      validUntil: string;
      isActive: boolean;
    }>;
  };
  rating?: number;
  reviewCount?: number;
}

interface HomePageClientProps {
  initialSpaces: Space[];
}

// Simple Image Carousel Component for Space Cards
function SpaceImageCarousel({ images, spaceName }: { images: Space['images']; spaceName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-xl">📷</span>
          </div>
          <span className="text-gray-400 text-sm">No images</span>
        </div>
      </div>
    );
  }

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(index);
  };

  return (
    <div className="relative w-full h-48 bg-gray-200 overflow-hidden group">
      <img
        src={images[currentIndex].url}
        alt={`${spaceName} - Image ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
      />
      
      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-opacity-70 rounded-full w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-opacity-70 rounded-full w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={goToImage(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white' 
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomePageClient({ initialSpaces }: HomePageClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [spacesWithBundles, setSpacesWithBundles] = useState<Space[]>(initialSpaces);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [timeDisplay, setTimeDisplay] = useState<string>('--:--:--');

  // Debug: Log initial spaces data
  useEffect(() => {
    console.log('=== DEBUG: Initial spaces data ===');
    console.log('Total spaces:', initialSpaces.length);
    initialSpaces.forEach((space, index) => {
      console.log(`Space ${index}: ${space.name}`);
      console.log(`  Bundles count: ${space.pricing.bundles?.length || 0}`);
      if (space.pricing.bundles && space.pricing.bundles.length > 0) {
        space.pricing.bundles.forEach((bundle, bundleIndex) => {
          console.log(`    Bundle ${bundleIndex}: ${bundle.name} - ₹${bundle.price} for ${bundle.value}h`);
          console.log(`      Active: ${bundle.isActive}, Valid: ${bundle.validFrom} to ${bundle.validUntil}`);
        });
      }
    });
  }, [initialSpaces]);

  useEffect(() => {
    setIsClient(true);
    const now = new Date();
    setLastUpdated(now);
    setTimeDisplay(now.toLocaleTimeString());
  }, []);

  // Update time display every second when on client
  useEffect(() => {
    if (!isClient) return;
    
    const interval = setInterval(() => {
      if (lastUpdated) {
        setTimeDisplay(lastUpdated.toLocaleTimeString());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isClient, lastUpdated]);

  // Real-time updates: Poll for fresh data every 30 seconds
  useEffect(() => {
    if (!isClient) return;

    const fetchLatestSpaces = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spaces?_t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        
        if (response.ok) {
          const latestSpaces = await response.json();
          setSpacesWithBundles(latestSpaces);
          const now = new Date();
          setLastUpdated(now);
          setTimeDisplay(now.toLocaleTimeString());
          console.log('🔄 Spaces data refreshed at:', now.toLocaleTimeString());
        }
      } catch (error) {
        console.error('Error fetching latest spaces:', error);
      }
    };

    // Initial fetch
    fetchLatestSpaces();

    // Set up polling every 30 seconds
    const interval = setInterval(fetchLatestSpaces, 30000);

    return () => clearInterval(interval);
  }, [isClient]);

  // Process spaces with bundles filtering
  const processedSpaces = useMemo(() => {
    // Don't filter bundles on server side to prevent hydration issues
    // Bundles will be filtered in the UI only when isClient is true
    return spacesWithBundles;
  }, [spacesWithBundles]);

  const filteredSpaces = processedSpaces.filter(space => {
    const matchesSearch = space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         space.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = !locationFilter || space.address.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesCapacity = !capacityFilter || space.capacity >= parseInt(capacityFilter);
    
    return matchesSearch && matchesLocation && matchesCapacity;
  });

  // Helper function to get available bundles for a space
  const getAvailableBundles = (space: Space) => {
    if (!isClient || !space.pricing.bundles) return [];
    
    const now = new Date();
    console.log(`=== DEBUG: Checking bundles for ${space.name} ===`);
    console.log('Is client:', isClient);
    console.log('Total bundles:', space.pricing.bundles.length);
    console.log('Current time:', now.toISOString());
    
    const filtered = space.pricing.bundles.filter(bundle => {
      const validFrom = new Date(bundle.validFrom);
      const validUntil = new Date(bundle.validUntil);
      const isActive = bundle.isActive;
      const isInDateRange = validFrom <= now && validUntil >= now;
      
      console.log(`Bundle ${bundle.name}:`);
      console.log(`  Active: ${isActive}`);
      console.log(`  Valid from: ${validFrom.toISOString()}`);
      console.log(`  Valid until: ${validUntil.toISOString()}`);
      console.log(`  In date range: ${isInDateRange}`);
      console.log(`  Will show: ${isActive && isInDateRange}`);
      
      return isActive && isInDateRange;
    });
    
    console.log(`Final filtered bundles for ${space.name}:`, filtered.length);
    return filtered;
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
        return `₹${space.pricing.monthlyRate || space.pricing.basePrice * 30}/month`;
      case 'package':
        return `From ₹${space.pricing.basePrice}`;
      default:
        return `₹${space.pricing.basePrice}`;
    }
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Blinker, sans-serif' }}>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#8b55ff] to-[#ede9fe] text-black py-20 animate-gradient-x">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-extrabold mb-4 animate-fade-in">✨ Find the Perfect Space for Your Event</h2>
          <p className="text-xl md:text-2xl mb-8 text-[#8b55ff] animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Discover unique venues, book instantly, and create unforgettable experiences
          </p>
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex bg-white rounded-full shadow-lg overflow-hidden border-2 border-[#ede9fe] focus-within:ring-2 focus-within:ring-[#8b55ff]">
              <div className="flex-1 flex items-center px-4">
                <span className="text-2xl mr-3">🔍</span>
                <input
                  type="text"
                  placeholder="Search events, locations, or amenities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 outline-none text-black placeholder-gray-400 bg-transparent font-blinker"
                />
              </div>
              <button className="bg-[#8b55ff] hover:bg-[#7c3aed] text-white px-6 py-3 transition-all font-blinker text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#8b55ff]">
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Real-time Update Indicator */}
      {isClient && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-end text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live updates • Last refreshed: {timeDisplay}</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Location Filter */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">📍</span>
            <input
              type="text"
              placeholder="Location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#ede9fe] rounded-full focus:ring-2 focus:ring-[#8b55ff] focus:border-transparent font-blinker text-black bg-white"
            />
          </div>
          {/* Capacity Filter */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">👥</span>
            <select
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#ede9fe] rounded-full focus:ring-2 focus:ring-[#8b55ff] focus:border-transparent appearance-none bg-white font-blinker text-black"
            >
              <option value="">Any Capacity</option>
              <option value="20">20+ people</option>
            </select>
          </div>
          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchQuery('');
              setLocationFilter('');
              setCapacityFilter('');
            }}
            className="px-4 py-2 text-[#8b55ff] hover:text-black transition-colors font-blinker rounded-full border border-[#ede9fe] bg-white hover:bg-[#ede9fe] focus:outline-none focus:ring-2 focus:ring-[#8b55ff]"
          >
            Clear Filters
          </button>
        </div>
      </section>

      {/* Spaces Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSpaces.map((space, i) => (
            <div
              key={space._id}
              className="bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-300 animate-fade-in-up group hover:shadow-[0_0_32px_8px_#8b55ff44] hover:scale-105 focus-within:shadow-[0_0_32px_8px_#8b55ff44] focus-within:scale-105"
              style={{ animationDelay: `${0.1 + i * 0.08}s` }}
            >
              <SpaceImageCarousel images={space.images} spaceName={space.name} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-black font-blinker">{space.name}</h3>
                  <div className="flex items-center space-x-1">
                    {space.rating && (
                      <>
                        <span className="text-lg">⭐</span>
                        <span className="text-sm text-black font-blinker">{space.rating}</span>
                        <span className="text-sm text-gray-400 font-blinker">({space.reviewCount || 0})</span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-black/70 text-sm mb-3 line-clamp-2 font-blinker">
                  {space.description}
                </p>
                <div className="flex items-center text-sm text-black/50 mb-3">
                  <span className="text-lg mr-1">📍</span>
                  <span className="truncate font-blinker">{space.address}</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-sm text-black/50 font-blinker">
                    <span className="text-lg mr-1">👥</span>
                    <span>Up to {space.capacity} people</span>
                  </div>
                  <div
                    className="text-lg font-bold text-[#8b55ff] font-blinker transition-all duration-300 group-hover:shadow-[0_0_16px_2px_#ede9fe] group-hover:scale-110 group-active:scale-95 group-hover:bg-[#f6f2ff] px-4 py-1 rounded-full cursor-pointer"
                    tabIndex={0}
                    onClick={e => {
                      e.stopPropagation();
                      e.currentTarget.classList.add('ring-4', 'ring-[#8b55ff]', 'shadow-[0_0_32px_8px_#8b55ff44]');
                      setTimeout(() => {
                        e.currentTarget.classList.remove('ring-4', 'ring-[#8b55ff]', 'shadow-[0_0_32px_8px_#8b55ff44]');
                      }, 600);
                    }}
                  >
                    {getPricingDisplay(space)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {/* Show only key amenities */}
                  {(() => {
                    const keyAmenities = ['WiFi', 'Parking', 'Kitchen', 'Bathroom', 'Projector'];
                    const availableKeyAmenities = space.amenities
                      .filter(amenity => keyAmenities.includes(amenity.name))
                      .slice(0, 4); // Show max 4 key amenities
                    return (
                      <>
                        {availableKeyAmenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="bg-[#ede9fe] text-[#8b55ff] text-xs px-2 py-1 rounded-full font-blinker"
                          >
                            {amenity.name}
                          </span>
                        ))}
                        {space.amenities.length > availableKeyAmenities.length && (
                          <span className="text-xs text-black/40 font-blinker">
                            +{space.amenities.length - availableKeyAmenities.length} more
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
                {/* Available Bundles */}
                {isClient && (() => {
                  const availableBundles = getAvailableBundles(space);
                  if (availableBundles.length === 0) {
                    return null;
                  }
                  return (
                    <div className="mb-4">
                      <div className="text-xs text-black/40 mb-2 font-blinker">Available Bundles:</div>
                      <div className="space-y-1">
                        {availableBundles
                          .slice(0, 2) // Show only first 2 bundles
                          .map((bundle) => (
                            <div key={bundle._id} className="bg-green-50 border border-green-200 rounded px-2 py-1 text-xs font-blinker">
                              <div className="font-medium text-green-800">{bundle.name}</div>
                              <div className="text-green-600">₹{bundle.price} for {bundle.value} hours</div>
                            </div>
                          ))}
                        {availableBundles.length > 2 && (
                          <div className="text-xs text-black/40 font-blinker">
                            +{availableBundles.length - 2} more bundles
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
                <Link
                  href={`/spaces/${space._id}`}
                  className="w-full bg-[#8b55ff] text-white py-2 px-4 rounded-full text-base font-blinker font-semibold hover:bg-[#7c3aed] transition-all text-center block shadow-sm hover:scale-105 focus:scale-105 focus:outline-none"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
        {filteredSpaces.length === 0 && (
          <div className="text-center py-12">
            <p className="text-black/40 text-lg font-blinker">No events found matching your criteria.</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-[#8b55ff] text-white py-12 animate-fade-in" style={{ animationDelay: '0.5s' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4 font-blinker">Events 49c</h3>
              <p className="text-white/80 font-blinker">
                Connecting people with amazing events for unforgettable experiences.
              </p>
            </div>
            <div>
              <h4 className="text-md font-bold mb-4 font-blinker">Quick Links</h4>
              <ul className="space-y-2 text-white/80 font-blinker">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-bold mb-4 font-blinker">For Space Owners</h4>
              <ul className="space-y-2 text-white/80 font-blinker">
                <li><Link href="/register" className="hover:text-white">List Your Space</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/support" className="hover:text-white">Support</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/60 font-blinker">
            <p>&copy; 2025 Events. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 