'use client';

import React, { useEffect, useState } from 'react';
import { useClientSide, useSuppressHydrationWarning } from '@/lib/useClientSide';

interface HydrationErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function HydrationErrorBoundary({ 
  children, 
  fallback = <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div> 
}: HydrationErrorBoundaryProps) {
  const isClient = useClientSide();
  const [hasError, setHasError] = useState(false);

  // Suppress hydration warnings
  useSuppressHydrationWarning();

  // Show fallback during SSR or if there's an error
  if (!isClient || hasError) {
    return <>{fallback}</>;
  }

  // Return children directly without wrapping in a div to avoid event handler issues
  return <>{children}</>;
} 