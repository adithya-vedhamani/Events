import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SpaceDetailsClient from './SpaceDetailsClient';
import ClientOnly from '@/components/ClientOnly';

// Fetch space data directly without caching
const getSpace = async (id: string) => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      console.warn('NEXT_PUBLIC_API_URL not set, returning null');
      return null;
    }

    const response = await fetch(`${apiUrl}/api/spaces/${id}`, {
      cache: 'no-store', // Always fetch fresh data
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      return response.json();
    }
    
    console.warn('Failed to fetch space:', response.status);
    return null;
  } catch (error) {
    console.error('Error fetching space:', error);
    return null;
  }
};

// Generate metadata for the space
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const space = await getSpace(id);
  
  if (!space) {
    return {
      title: 'Event Not Found - Events',
      description: 'The event you are looking for could not be found.',
    };
  }

  return {
    title: `${space.name} - Events`,
    description: space.description || `Book ${space.name} for your next event. Capacity: ${space.capacity} people.`,
    keywords: ['event space', 'venue', 'booking', space.name, space.address],
    openGraph: {
      title: `${space.name} - Events`,
      description: space.description || `Book ${space.name} for your next event.`,
      type: 'website',
      images: space.images && space.images.length > 0 ? [space.images[0].url] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${space.name} - Events`,
      description: space.description || `Book ${space.name} for your next event.`,
      images: space.images && space.images.length > 0 ? [space.images[0].url] : [],
    },
    alternates: {
      canonical: `/events/${id}`,
    },
  };
}

export default async function SpaceDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const space = await getSpace(id);

  if (!space) {
    notFound();
  }

  return (
    <Suspense fallback={<SpaceDetailsSkeleton />}>
      <ClientOnly>
        <SpaceDetailsClient space={space} />
      </ClientOnly>
    </Suspense>
  );
}

function SpaceDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="h-64 bg-gray-200 rounded mb-4 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded mb-4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <div className="h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded mb-4 animate-pulse"></div>
              <div className="h-12 bg-blue-600 rounded mb-4 animate-pulse"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 