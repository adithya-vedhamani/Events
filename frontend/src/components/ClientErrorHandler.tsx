'use client';

import { useEffect } from 'react';
import { setupHydrationErrorSuppression } from '@/lib/errorHandler';

export default function ClientErrorHandler() {
  useEffect(() => {
    setupHydrationErrorSuppression();
  }, []);

  return null;
} 