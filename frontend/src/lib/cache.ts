import { unstable_cache } from 'next/cache';

// Cache configuration
export const CACHE_CONFIG = {
  SPACES: {
    revalidate: 300, // 5 minutes
    tags: ['spaces'],
  },
  SPACE_DETAILS: {
    revalidate: 300, // 5 minutes
    tags: ['space'],
  },
  USER_PROFILE: {
    revalidate: 60, // 1 minute
    tags: ['user'],
  },
  RESERVATIONS: {
    revalidate: 30, // 30 seconds
    tags: ['reservations'],
  },
  ANALYTICS: {
    revalidate: 600, // 10 minutes
    tags: ['analytics'],
  },
} as const;

// Generic cache wrapper
export function createCache<T>(
  fn: () => Promise<T>,
  key: string,
  config: { revalidate: number; tags: string[] }
) {
  return unstable_cache(fn, [key], config);
}

// Helper function to get API URL
function getApiUrl(): string | null {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    console.warn('NEXT_PUBLIC_API_URL not set');
    return null;
  }
  return apiUrl;
}

// Spaces cache
export const getCachedSpaces = createCache(
  async () => {
    try {
      const apiUrl = getApiUrl();
      if (!apiUrl) {
        return [];
      }

      const response = await fetch(`${apiUrl}/api/spaces`, {
        next: { revalidate: CACHE_CONFIG.SPACES.revalidate },
        headers: {
          'Content-Type': 'application/json',
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
  'spaces-list',
  CACHE_CONFIG.SPACES
);

// Space details cache
export const getCachedSpace = createCache(
  async (id: string) => {
    try {
      const apiUrl = getApiUrl();
      if (!apiUrl) {
        return null;
      }

      const response = await fetch(`${apiUrl}/api/spaces/${id}`, {
        next: { revalidate: CACHE_CONFIG.SPACE_DETAILS.revalidate },
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
  },
  'space-details',
  CACHE_CONFIG.SPACE_DETAILS
);

// User profile cache
export const getCachedUserProfile = createCache(
  async (token: string) => {
    try {
      const apiUrl = getApiUrl();
      if (!apiUrl) {
        return null;
      }

      const response = await fetch(`${apiUrl}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: CACHE_CONFIG.USER_PROFILE.revalidate },
      });
      
      if (response.ok) {
        return response.json();
      }
      
      console.warn('Failed to fetch user profile:', response.status);
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },
  'user-profile',
  CACHE_CONFIG.USER_PROFILE
);

// Reservations cache
export const getCachedReservations = createCache(
  async (token: string, userId: string) => {
    try {
      const apiUrl = getApiUrl();
      if (!apiUrl) {
        return [];
      }

      const response = await fetch(`${apiUrl}/api/reservations/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: CACHE_CONFIG.RESERVATIONS.revalidate },
      });
      
      if (response.ok) {
        return response.json();
      }
      
      console.warn('Failed to fetch reservations:', response.status);
      return [];
    } catch (error) {
      console.error('Error fetching reservations:', error);
      return [];
    }
  },
  'user-reservations',
  CACHE_CONFIG.RESERVATIONS
);

// Analytics cache
export const getCachedAnalytics = createCache(
  async (token: string, timeRange: string) => {
    try {
      const apiUrl = getApiUrl();
      if (!apiUrl) {
        return null;
      }

      const response = await fetch(`${apiUrl}/api/analytics/brand-owner?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: CACHE_CONFIG.ANALYTICS.revalidate },
      });
      
      if (response.ok) {
        return response.json();
      }
      
      console.warn('Failed to fetch analytics:', response.status);
      return null;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return null;
    }
  },
  'brand-owner-analytics',
  CACHE_CONFIG.ANALYTICS
);

// Cache invalidation helpers
export async function revalidateSpaces() {
  // This would be called after space updates
  // In a real app, you'd use Next.js revalidateTag
  console.log('Revalidating spaces cache');
}

export async function revalidateSpace(id: string) {
  // This would be called after specific space updates
  console.log(`Revalidating space cache for ID: ${id}`);
}

export async function revalidateUser(userId: string) {
  // This would be called after user profile updates
  console.log(`Revalidating user cache for ID: ${userId}`);
} 