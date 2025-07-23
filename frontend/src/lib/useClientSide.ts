'use client';

import { useState, useEffect } from 'react';

export function useClientSide() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

export function useSuppressHydrationWarning() {
  useEffect(() => {
    // Suppress hydration warnings globally
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      const message = args[0];
      if (
        typeof message === 'string' &&
        (message.includes('Hydration') || 
         message.includes('Text content does not match server-rendered HTML') ||
         message.includes('Expected server HTML to contain a matching') ||
         message.includes('Warning: Text content did not match') ||
         message.includes('Warning: Expected server HTML to contain'))
      ) {
        // Suppress hydration errors
        return;
      }
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = args[0];
      if (
        typeof message === 'string' &&
        (message.includes('Hydration') || 
         message.includes('Text content does not match server-rendered HTML') ||
         message.includes('Expected server HTML to contain a matching') ||
         message.includes('Warning: Text content did not match') ||
         message.includes('Warning: Expected server HTML to contain'))
      ) {
        // Suppress hydration warnings
        return;
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);
} 