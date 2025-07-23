'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Something went wrong!
        </h1>
        <p className="text-gray-600 mb-8">
          We're sorry, but something unexpected happened. Our team has been notified and is working to fix the issue.
        </p>

        {/* Error Details (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-8 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Error Details (Development)
            </summary>
            <div className="mt-2 p-4 bg-gray-100 rounded-lg text-xs font-mono text-gray-800 overflow-auto">
              <p><strong>Message:</strong> {error.message}</p>
              {error.digest && <p><strong>Digest:</strong> {error.digest}</p>}
              <p><strong>Stack:</strong></p>
              <pre className="whitespace-pre-wrap">{error.stack}</pre>
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={reset}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </button>
          
          <Link
            href="/"
            className="w-full bg-white text-blue-600 py-3 px-6 rounded-lg font-medium border border-blue-600 hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Homepage
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Still having issues?
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <Link href="/contact" className="text-blue-600 hover:underline">
                Contact Support
              </Link>
            </p>
            <p>
              <Link href="/help" className="text-blue-600 hover:underline">
                Help Center
              </Link>
            </p>
            <p>
              <a 
                href="mailto:support@events.com" 
                className="text-blue-600 hover:underline"
              >
                Email us directly
              </a>
            </p>
          </div>
        </div>

        {/* Error ID for support */}
        {error.digest && (
          <div className="mt-8 text-xs text-gray-500">
            Error ID: {error.digest}
          </div>
        )}
      </div>
    </div>
  );
} 