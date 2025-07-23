import { Suspense } from 'react';
import { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import HomePageClient from './HomePageClient';
import ClientOnly from '@/components/ClientOnly';

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

// Cache the spaces data for better performance
const getCachedSpaces = unstable_cache(
  async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        console.warn('NEXT_PUBLIC_API_URL not set, returning empty spaces array');
        return [];
      }

      const response = await fetch(`${apiUrl}/api/spaces`, {
        next: { revalidate: 30 }, // Revalidate every 30 seconds for real-time pricing updates
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache', // Prevent browser caching
        },
      });
      
      if (response.ok) {
        return response.json();
      }
      
      console.warn('Failed to fetch spaces:', response.status);
      return [];
    } catch (error) {
      console.error('Error fetching spaces:', error);
      return [];
    }
  },
  ['spaces-list'],
  {
    revalidate: 30, // 30 seconds for real-time updates
    tags: ['spaces', 'pricing'],
  }
);

export const metadata: Metadata = {
  title: 'Events - Find the Perfect Event for Your Occasion',
  description: 'Discover unique events, book instantly, and create unforgettable experiences. Find the perfect event for your next occasion.',
  keywords: ['events', 'venue booking', 'party venues', 'meeting rooms', 'event planning'],
  openGraph: {
    title: 'Events - Find the Perfect Event for Your Occasion',
    description: 'Discover unique events, book instantly, and create unforgettable experiences.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Events - Find the Perfect Event for Your Occasion',
    description: 'Discover unique events, book instantly, and create unforgettable experiences.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function HomePage() {
  const spaces = await getCachedSpaces();

  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <ClientOnly>
        <HomePageClient initialSpaces={spaces} />
      </ClientOnly>
    </Suspense>
  );
}

function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Blinker, sans-serif' }}>
      {/* Hero Section Skeleton */}
      <section className="bg-gradient-to-r from-[#8b55ff] to-[#ede9fe] text-black py-20 animate-gradient-x">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="h-12 bg-[#8b55ff] rounded mb-4 animate-pulse"></div>
          <div className="h-6 bg-[#ede9fe] rounded mb-8 animate-pulse"></div>
          <div className="max-w-2xl mx-auto">
            <div className="flex bg-white rounded-2xl shadow-lg overflow-hidden animate-fade-in">
              <div className="flex-1 h-12 bg-gray-200 animate-pulse"></div>
              <div className="w-24 h-12 bg-[#8b55ff] animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid Skeleton */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="h-48 bg-[#ede9fe] animate-pulse"></div>
              <div className="p-6">
                <div className="h-6 bg-[#ede9fe] rounded mb-2 animate-pulse"></div>
                <div className="h-4 bg-[#f6f2ff] rounded mb-4 animate-pulse"></div>
                <div className="h-4 bg-[#f6f2ff] rounded mb-4 animate-pulse"></div>
                <div className="h-10 bg-[#ede9fe] rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
