'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, CreditCard, Shield, AlertCircle, Loader2, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Reservation {
  _id: string;
  spaceId: {
    _id: string;
    name: string;
    address: string;
    images: string[];
  };
  userId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  bookingCode: string;
  pricingBreakdown?: Array<{
    type: string;
    description: string;
    amount: number;
  }>;
}

interface PaymentData {
  orderId: string;
  amount: number;
  currency: string;
  key: string;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: (options: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    Razorpay: RazorpayInstance;
  }
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [initializingPayment, setInitializingPayment] = useState(false);

  const loadReservation = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Your session has expired. Please log in again to continue.');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setError('Your session has expired. Please log in again to continue.');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setReservation(data);
        
        // If reservation is already paid, redirect to confirmation
        if (data.paymentStatus === 'completed') {
          router.push(`/booking/${params.id}/confirmation`);
          return;
        }
        
        // If reservation is pending payment, initialize payment
        if (data.status === 'pending_payment' && data.totalAmount > 0) {
          console.log('Initializing payment for reservation:', data._id, 'Amount:', data.totalAmount);
          await initializePayment();
        } else {
          console.log('Reservation status:', data.status, 'Payment status:', data.paymentStatus, 'Amount:', data.totalAmount);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Reservation not found');
      }
    } catch (error) {
      console.error('Error loading reservation:', error);
      setError('Failed to load reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      loadReservation();
    }
  }, [params.id]);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      setRazorpayLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      setError('Failed to load payment gateway');
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup: remove the script we added
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const initializePayment = async () => {
    if (!reservation) {
      console.log('No reservation available for payment initialization');
      return;
    }

    setInitializingPayment(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Your session has expired. Please log in again to continue.');
        return;
      }

      console.log('Calling payment initialization API...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reservationId: reservation._id,
          amount: reservation.totalAmount,
        }),
      });

      console.log('Payment initialization response status:', response.status);

      if (response.status === 401) {
        setError('Your session has expired. Please log in again to continue.');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('Payment initialization successful:', data);
        setPaymentData(data);
      } else {
        const errorData = await response.json();
        console.error('Payment initialization failed:', errorData);
        setError(errorData.message || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Error initializing payment:', error);
      setError('Failed to initialize payment. Please try again.');
    } finally {
      setInitializingPayment(false);
    }
  };

  const handlePayment = () => {
    if (!paymentData || !reservation || !razorpayLoaded) {
      console.log('Payment conditions not met:', {
        paymentData: !!paymentData,
        reservation: !!reservation,
        razorpayLoaded
      });
      setError('Payment gateway not ready. Please try again.');
      return;
    }

    console.log('Opening Razorpay with options:', {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: paymentData.amount,
      currency: paymentData.currency,
      order_id: paymentData.orderId
    });

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: paymentData.amount,
      currency: paymentData.currency,
      name: 'Events',
      description: `Booking for ${reservation.spaceId.name}`,
      order_id: paymentData.orderId,
      handler: function (response: RazorpayResponse) {
        console.log('Payment success response:', response);
        handlePaymentSuccess(response);
      },
      prefill: {
        name: `${reservation.userId.firstName} ${reservation.userId.lastName}`,
        email: reservation.userId.email,
      },
      notes: {
        reservationId: reservation._id,
        bookingCode: reservation.bookingCode,
      },
      theme: {
        color: '#8b55ff',
      },
      modal: {
        ondismiss: function() {
          console.log('Payment modal dismissed');
          setError('Payment was cancelled. You can try again.');
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Error opening Razorpay:', error);
      setError('Failed to open payment gateway. Please try again.');
    }
  };

  const handlePaymentSuccess = async (response: RazorpayResponse) => {
    setPaymentLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Your session has expired. Please log in again to continue.');
        return;
      }

      console.log('Verifying payment with response:', response);

      // First, verify payment on frontend
      const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reservationId: reservation?._id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });

      if (verifyResponse.status === 401) {
        setError('Your session has expired. Please log in again to continue.');
        return;
      }

      if (verifyResponse.ok) {
        console.log('Payment verification successful, redirecting to confirmation');
        router.push(`/booking/${reservation?._id}/confirmation`);
      } else {
        // If frontend verification fails, start polling for webhook updates
        console.log('Frontend verification failed, starting webhook polling...');
        await pollForPaymentStatus();
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      // Start polling for webhook updates as fallback
      await pollForPaymentStatus();
    } finally {
      setPaymentLoading(false);
    }
  };

  const pollForPaymentStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token || !reservation) return;

    const maxAttempts = 10; // Poll for 50 seconds (5 seconds * 10 attempts)
    let attempts = 0;

    const poll = async (): Promise<boolean> => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations/${reservation._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const updatedReservation = await response.json();
          
          if (updatedReservation.paymentStatus === 'completed') {
            console.log('Payment confirmed via webhook polling');
            router.push(`/booking/${reservation._id}/confirmation`);
            return true;
          } else if (updatedReservation.paymentStatus === 'failed') {
            setError('Payment failed. Please try again with a different payment method.');
            return true;
          }
        }

        attempts++;
        if (attempts >= maxAttempts) {
          setError('Payment verification is taking longer than expected. Please check your dashboard for updates.');
          return true;
        }

        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
        return false;
      } catch (error) {
        console.error('Error polling payment status:', error);
        attempts++;
        if (attempts >= maxAttempts) {
          setError('Unable to verify payment status. Please check your dashboard.');
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
        return false;
      }
    };

    // Start polling
    while (!(await poll())) {
      // Continue polling until success or max attempts reached
    }
  };

  const handleRetry = () => {
    setError(null);
    initializePayment();
  };

  const handleManualPaymentInit = () => {
    if (reservation) {
      initializePayment();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center" style={{ fontFamily: 'Blinker, sans-serif' }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900">Loading your booking...</h2>
          <p className="text-gray-500 mt-2">Please wait while we fetch your reservation details.</p>
        </div>
      </div>
    );
  }

  if (error && error.includes('log in again')) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center" style={{ fontFamily: 'Blinker, sans-serif' }}>
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Session Expired</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/login')} className="w-full bg-purple-600 hover:bg-purple-700">
            Log In Again
          </Button>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center" style={{ fontFamily: 'Blinker, sans-serif' }}>
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">Reservation Not Found</h2>
          <p className="text-gray-600 mb-6">The reservation you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/dashboard')} className="w-full bg-purple-600 hover:bg-purple-700">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!loading && reservation && reservation.status !== 'pending_payment') {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center" style={{ fontFamily: 'Blinker, sans-serif' }}>
        <div className="text-center max-w-md mx-auto">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Payment Not Required</h2>
          <p className="text-gray-600 mb-6">This booking is not pending payment.</p>
          <Button onClick={() => router.push('/dashboard')} className="w-full bg-purple-600 hover:bg-purple-700">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const duration = Math.round(
    (new Date(reservation.endTime).getTime() - new Date(reservation.startTime).getTime()) / (1000 * 60 * 60)
  );

  return (
    <div className="min-h-screen bg-purple-50" style={{ fontFamily: 'Blinker, sans-serif' }}>
      {/* Header */}
      <header className="bg-white border-b border-purple-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-purple-600 transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-lg font-medium text-gray-900">Complete Payment</h1>
            <div></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-1">
            <Card className="border border-purple-200 shadow-sm">
              <CardHeader className="border-b border-purple-200 bg-purple-50">
                <CardTitle className="flex items-center text-lg text-purple-900">
                  <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-red-700 text-sm">{error}</span>
                    </div>
                    <div className="mt-3 space-x-2">
                      <Button 
                        onClick={handleRetry}
                        variant="outline"
                        size="sm"
                        className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        Try Again
                      </Button>
                      {!paymentData && (
                        <Button 
                          onClick={handleManualPaymentInit}
                          variant="outline"
                          size="sm"
                          className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          Initialize Payment
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Initialization Status */}
                {initializingPayment && (
                  <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin text-purple-600 mr-2" />
                      <span className="text-purple-700 text-sm">Initializing payment gateway...</span>
                    </div>
                  </div>
                )}

                {/* Payment Method Selection */}
                <div>
                  <h3 className="font-medium mb-3 text-gray-900">Payment Method</h3>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border border-purple-300 rounded-md cursor-pointer hover:bg-purple-50 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3 text-purple-600"
                      />
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-purple-600" />
                        <span className="font-medium text-sm">Credit/Debit Card</span>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-purple-300 rounded-md cursor-pointer hover:bg-purple-50 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="upi"
                        checked={paymentMethod === 'upi'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3 text-purple-600"
                      />
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-purple-600" />
                        <span className="font-medium text-sm">UPI</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Payment Button */}
                <Button
                  onClick={handlePayment}
                  disabled={paymentLoading || !paymentData || !!error || !razorpayLoaded || initializingPayment}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3"
                >
                  {paymentLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing Payment...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Pay ₹{reservation.totalAmount.toFixed(2)}
                    </div>
                  )}
                </Button>

                {/* Manual Payment Init Button (if payment data is missing) */}
                {!paymentData && !initializingPayment && !error && (
                  <Button
                    onClick={handleManualPaymentInit}
                    variant="outline"
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    Initialize Payment Gateway
                  </Button>
                )}

                {/* Security Notice */}
                <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                  <div className="flex items-start">
                    <Shield className="h-4 w-4 text-purple-600 mr-2 mt-0.5" />
                    <div className="text-xs text-purple-700">
                      <p className="font-medium mb-1">Secure Payment</p>
                      <p>Your payment is processed securely by Razorpay. We never store your card details.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="border border-purple-200 shadow-sm">
              <CardHeader className="border-b border-purple-200 bg-purple-50">
                <CardTitle className="text-lg text-purple-900">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                {/* Space Details */}
                <div className="flex items-start space-x-4">
                  {reservation.spaceId.images && reservation.spaceId.images.length > 0 && (
                    <img
                      src={reservation.spaceId.images[0]}
                      alt={reservation.spaceId.name}
                      className="w-20 h-20 object-cover rounded-md shadow-sm"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{reservation.spaceId.name}</h3>
                    <div className="flex items-center text-gray-500 text-sm mt-2">
                      <MapPin className="h-3 w-3 mr-1" />
                      {reservation.spaceId.address}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Booking Details */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 text-base">Booking Details</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500">Date:</span>
                      <span className="font-medium text-gray-900">{format(new Date(reservation.startTime), 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500">Time:</span>
                      <span className="font-medium text-gray-900">
                        {format(new Date(reservation.startTime), 'h:mm a')} - {format(new Date(reservation.endTime), 'h:mm a')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500">Duration:</span>
                      <span className="font-medium text-gray-900">{duration} hours</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-500">Booking Code:</span>
                      <span className="font-mono font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded text-xs">{reservation.bookingCode}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Price Breakdown */}
                {reservation.pricingBreakdown && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 text-base">Price Breakdown</h4>
                    <div className="space-y-3">
                      {reservation.pricingBreakdown.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600">{item.description}</span>
                          <span className={`font-medium ${item.amount < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                            ₹{item.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <Separator className="my-3" />
                      <div className="flex justify-between items-center py-3 bg-purple-50 rounded-md px-3">
                        <span className="font-bold text-lg text-gray-900">Total Amount</span>
                        <span className="font-bold text-lg text-purple-900">₹{reservation.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-800">Payment Status:</span>
                    <Badge variant={reservation.paymentStatus === 'pending' ? 'secondary' : 'default'} className="text-xs bg-purple-200 text-purple-900 font-semibold">
                      {reservation.paymentStatus === 'pending' ? 'Pending Payment' : 'Confirmed'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 