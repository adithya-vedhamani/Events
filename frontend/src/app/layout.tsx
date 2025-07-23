import type { Metadata } from "next";
import { Inter, Blinker } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Toaster as SonnerToaster } from "sonner";
import Navigation from "@/components/Navigation";
import ClientErrorHandler from "@/components/ClientErrorHandler";
import 'react-modern-calendar-datepicker/lib/DatePicker.css';

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

const blinker = Blinker({ 
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: 'swap',
  variable: '--font-blinker',
});

export const metadata: Metadata = {
  title: {
    default: "Events - Find the Perfect Event for Your Occasion",
    template: "%s | Events",
  },
  description: "Discover unique events, book instantly, and create unforgettable experiences. Find the perfect event for your next occasion.",
  keywords: ["events", "venue booking", "party venues", "meeting rooms", "event planning", "event rental"],
  authors: [{ name: "Events" }],
  creator: "Events",
  publisher: "Events",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://events.events.live'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Events - Find the Perfect Event for Your Occasion',
    description: 'Discover unique events, book instantly, and create unforgettable experiences.',
    siteName: 'Events',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Events - Event Venue Booking',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Events - Find the Perfect Event for Your Occasion',
    description: 'Discover unique events, book instantly, and create unforgettable experiences.',
    images: ['/og-image.jpg'],
    creator: '@events',
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
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  icons: {
    icon: '/favicon.ico',
    alt: 'Events - Event Venue Booking',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${blinker.variable}`}>
      <head>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        {/* Suppress hydration errors immediately */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress hydration errors immediately
              (function() {
                const originalError = console.error;
                const originalWarn = console.warn;
                const originalLog = console.log;
                
                function suppressHydration(message) {
                  return typeof message === 'string' && (
                    message.includes('Hydration') ||
                    message.includes('Text content does not match server-rendered HTML') ||
                    message.includes('Expected server HTML to contain a matching') ||
                    message.includes('Warning: Text content did not match') ||
                    message.includes('Warning: Expected server HTML to contain') ||
                    message.includes('Warning: An error occurred during hydration') ||
                    message.includes('Warning: The server rendered HTML didn\\'t match the client') ||
                    message.includes('Hydration failed because the server rendered HTML didn\\'t match the client') ||
                    message.includes('As a result this tree will be regenerated on the client') ||
                    message.includes('This can happen if a SSR-ed Client Component used') ||
                    message.includes('A server/client branch') ||
                    message.includes('Variable input such as') ||
                    message.includes('Date formatting in a user\\'s locale') ||
                    message.includes('External changing data without sending a snapshot') ||
                    message.includes('Invalid HTML tag nesting') ||
                    message.includes('browser extension installed which messes with the HTML')
                  );
                }
                
                console.error = function(...args) {
                  if (suppressHydration(args[0])) return;
                  originalError.apply(console, args);
                };
                
                console.warn = function(...args) {
                  if (suppressHydration(args[0])) return;
                  originalWarn.apply(console, args);
                };
                
                console.log = function(...args) {
                  if (suppressHydration(args[0])) return;
                  originalLog.apply(console, args);
                };
              })();
            `
          }}
        />
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Events",
              "url": "https://events.events.live",
              "logo": "https://events.events.live/logo.png",
              "description": "Discover unique events, book instantly, and create unforgettable experiences.",
              "sameAs": [
                "https://twitter.com/events",
                "https://facebook.com/events"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+91-XXXXXXXXXX",
                "contactType": "customer service",
                "email": "support@events.com"
              }
            })
          }}
        />
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://checkout.razorpay.com" />
        <link rel="dns-prefetch" href="https://checkout.razorpay.com" />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <ClientErrorHandler />
        <Navigation />
        {children}
        <Toaster position="top-right" />
        <SonnerToaster position="top-right" />
      </body>
    </html>
  );
}
