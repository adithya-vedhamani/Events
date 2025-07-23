import Link from 'next/link';
import { Metadata } from 'next';
import { Home, Search, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Page Not Found - Events',
  description: 'The page you are looking for could not be found.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-4xl font-bold text-blue-600">404</span>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            href="/events"
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Homepage
          </Link>
          
          <Link
            href="/events"
            className="w-full bg-white text-blue-600 py-3 px-6 rounded-lg font-medium border border-blue-600 hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
          >
            <Search className="w-5 h-5 mr-2" />
            Browse Events
          </Link>

          <button
            onClick={() => window.history.back()}
            className="w-full text-gray-600 py-2 px-4 rounded-lg font-medium hover:text-gray-800 transition-colors inline-flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>

        {/* Help Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Need Help?
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
          </div>
        </div>
      </div>
    </div>
  );
} 