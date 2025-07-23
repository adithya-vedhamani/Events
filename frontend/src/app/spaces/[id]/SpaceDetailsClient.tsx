'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, MapPin, Users, Calendar as CalendarIcon, CreditCard, X, Star } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Calendar as ModernCalendar, DayValue } from 'react-modern-calendar-datepicker';
import 'react-modern-calendar-datepicker/lib/DatePicker.css';
import ImageGallery from '@/components/ImageGallery';

interface Space {
  _id: string;
  name: string;
  description: string;
  address: string;
  capacity: number;
  images: Array<{
    url: string;
    publicId?: string;
    isPrimary?: boolean;
    caption?: string;
  }>;
  pricing: {
    type: string;
    basePrice: number;
    currency: string;
    monthlyPrice?: number;
    peakMultiplier: number;
    offPeakMultiplier: number;
    peakHours?: Array<{
      day: string;
      startTime: string;
      endTime: string;
      multiplier: number;
    }>;
    timeBlocks?: Array<{
      hours: number;
      price: number;
      description?: string;
    }>;
    promoCodes?: Array<{
      code: string;
      discountPercentage: number;
      validFrom: string;
      validUntil: string;
      maxUses?: number;
      isActive?: boolean;
    }>;
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
    minimumBookingHours: number;
  };
  amenities: Array<string | { name: string; available: boolean }>;
  ownerId: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  price?: number;
  timeBlock?: {
    hours: number;
    price: number;
    description?: string;
  };
}

interface PriceBreakdown {
  originalPrice: number;
  totalPrice: number;
  discountAmount: number;
  promoCode?: string;
  bundle?: string;
  breakdown: Array<{
    type: string;
    description: string;
    amount: number;
  }>;
}

interface Reservation {
  _id: string;
  spaceId: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  bookingCode: string;
}

interface SpaceDetailsClientProps {
  space: Space;
}

export default function SpaceDetailsClient({ space }: SpaceDetailsClientProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [step, setStep] = useState<'calendar' | 'time' | 'checkout'>('calendar');
  const [availabilityData, setAvailabilityData] = useState<Record<string, unknown[]>>({});
  const [selectedDay, setSelectedDay] = useState<DayValue>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
  });
  const [selectedBundle, setSelectedBundle] = useState<string>('');
  const [availableBundles, setAvailableBundles] = useState<Array<any>>([]);
  const [isClient, setIsClient] = useState(false);
  const [timeBlocksLoading, setTimeBlocksLoading] = useState(false);
  const [currentSpace, setCurrentSpace] = useState<Space>(space);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [timeDisplay, setTimeDisplay] = useState<string>('--:--:--');

  useEffect(() => {
    setIsClient(true);
    const now = new Date();
    setLastUpdated(now);
    setTimeDisplay(now.toLocaleTimeString());
  }, []);

  // Update time display every second when on client
  useEffect(() => {
    if (!isClient) return;
    
    const interval = setInterval(() => {
      if (lastUpdated) {
        setTimeDisplay(lastUpdated.toLocaleTimeString());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isClient, lastUpdated]);

  // Real-time updates: Poll for fresh space data every 30 seconds
  useEffect(() => {
    if (!isClient) return;

    const fetchLatestSpace = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spaces/${space._id}?_t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        
        if (response.ok) {
          const latestSpace = await response.json();
          setCurrentSpace(latestSpace);
          const now = new Date();
          setLastUpdated(now);
          setTimeDisplay(now.toLocaleTimeString());
          console.log('🔄 Space data refreshed at:', now.toLocaleTimeString());
          
          // Recalculate price if we have a selected slot
          if (selectedSlot && priceBreakdown) {
            calculatePrice();
          }
        }
      } catch (error) {
        console.error('Error fetching latest space:', error);
      }
    };

    // Initial fetch
    fetchLatestSpace();

    // Set up polling every 30 seconds
    const interval = setInterval(fetchLatestSpace, 30000);

    return () => clearInterval(interval);
  }, [isClient, space._id, selectedSlot, priceBreakdown]);

  useEffect(() => {
    if (isClient && currentSpace.pricing.bundles) {
      const now = new Date();
      const filtered = currentSpace.pricing.bundles.filter(bundle => 
        bundle.isActive && 
        new Date(bundle.validFrom) <= now && 
        new Date(bundle.validUntil) >= now
      );
      setAvailableBundles(filtered);
    }
  }, [isClient, currentSpace.pricing.bundles]);

  const fetchAvailabilityForDate = async () => {
    if (!space || !selectedDay) return;
    
    const startDate = new Date(selectedDay.year, selectedDay.month - 1, selectedDay.day);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(selectedDay.year, selectedDay.month - 1, selectedDay.day);
    endDate.setHours(23, 59, 59, 999);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reservations/availability/${space._id}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      if (response.ok) {
        const existingBookings = await response.json();
        const availabilityMap: Record<string, unknown[]> = {};
        
        existingBookings.forEach((booking: { startTime: string }) => {
          const date = format(new Date(booking.startTime), 'yyyy-MM-dd');
          if (!availabilityMap[date]) {
            availabilityMap[date] = [];
          }
          availabilityMap[date].push(booking);
        });
        
        setAvailabilityData(availabilityMap);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const generateTimeSlots = (date: Date) => {
    const slots: TimeSlot[] = [];
    const startHour = 9; // 9 AM
    const endHour = 22; // 10 PM
    const slotDuration = currentSpace?.pricing?.minimumBookingHours || 1; // Use minimumBookingHours if set, else 1
    
    const dateKey = format(date, 'yyyy-MM-dd');
    const existingBookings = availabilityData[dateKey] || [];
    
    for (let hour = startHour; hour < endHour; hour += slotDuration) {
      const startTime = new Date(date);
      startTime.setHours(hour, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(hour + slotDuration, 0, 0, 0);
      
      const isAvailable = !existingBookings.some((booking: { startTime: string; endTime: string }) => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        return startTime < bookingEnd && endTime > bookingStart;
      });
      
      slots.push({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        available: isAvailable,
      });
    }
    
    return slots;
  };

  const calculatePrice = async () => {
    if (!selectedSlot || !currentSpace) return;

    setPriceLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations/calculate-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spaceId: currentSpace._id,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          promoCode: promoCode || undefined,
          bundleId: selectedBundle || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Validate the response data
        if (data && typeof data.totalPrice === 'number' && Array.isArray(data.breakdown)) {
          setPriceBreakdown(data);
        } else {
          console.error('Invalid price breakdown data:', data);
          // Set a default price breakdown if the response is invalid
          setPriceBreakdown({
            originalPrice: 0,
            totalPrice: 0,
            discountAmount: 0,
            breakdown: [{
              type: 'error',
              description: 'Unable to calculate price',
              amount: 0,
            }],
          });
        }
      } else {
        const error = await response.json();
        console.error('Price calculation error:', error);
        setPriceBreakdown({
          originalPrice: 0,
          totalPrice: 0,
          discountAmount: 0,
          breakdown: [{
            type: 'error',
            description: error.message || 'Failed to calculate price',
            amount: 0,
          }],
        });
      }
    } catch (error) {
      console.error('Error calculating price:', error);
      setPriceBreakdown({
        originalPrice: 0,
        totalPrice: 0,
        discountAmount: 0,
        breakdown: [{
          type: 'error',
          description: 'Network error while calculating price',
          amount: 0,
        }],
      });
    } finally {
      setPriceLoading(false);
    }
  };

  const handleDateSelect = (day: DayValue) => {
    setSelectedDay(day);
    setSelectedDate(new Date(day.year, day.month - 1, day.day));
  };

  const fetchTimeBlocks = async (date: Date) => {
    if (!currentSpace) return;
    
    setTimeBlocksLoading(true);
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/spaces/${currentSpace._id}/time-blocks?date=${dateString}`,
        {
          cache: 'no-store', // Always fetch fresh data
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        // Convert time blocks to time slots format
        const timeBlockSlots: TimeSlot[] = data.availableSlots.map((slot: any) => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          available: true,
          price: slot.timeBlock.price,
          timeBlock: slot.timeBlock,
        }));
        
        // Combine with regular hourly slots
        const regularSlots = generateTimeSlots(date);
        const allSlots = [...timeBlockSlots, ...regularSlots];
        
        // Remove duplicates and sort by start time
        const uniqueSlots = allSlots.filter((slot, index, self) => 
          index === self.findIndex(s => s.startTime === slot.startTime)
        ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        
        setTimeSlots(uniqueSlots);
      } else {
        console.error('Failed to fetch time blocks:', response.status);
        // Fallback to regular slots
        const regularSlots = generateTimeSlots(selectedDate);
        setTimeSlots(regularSlots);
      }
    } catch (error) {
      console.error('Error fetching time blocks:', error);
      // Fallback to regular slots
      const regularSlots = generateTimeSlots(selectedDate);
      setTimeSlots(regularSlots);
    } finally {
      setTimeBlocksLoading(false);
    }
  };

  const handleContinueToTime = () => {
    fetchTimeBlocks(selectedDate);
    setStep('time');
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep('checkout');
    // Calculate price immediately when slot is selected
    setTimeout(() => calculatePrice(), 100);
  };

  const handleBooking = async () => {
    if (!selectedSlot || !currentSpace || !priceBreakdown) return;

    setBookingLoading(true);
    try {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Calculate totalHours and basePrice
      const totalHours = Math.max(
        1,
        (new Date(selectedSlot.endTime).getTime() - new Date(selectedSlot.startTime).getTime()) / (1000 * 60 * 60)
      );
      const basePrice = currentSpace.pricing.basePrice || 0;

      // Create reservation
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          spaceId: currentSpace._id,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          totalAmount: priceBreakdown.totalPrice,
          promoCode: promoCode || undefined,
          bundleId: selectedBundle || undefined,
          totalHours,
          basePrice,
        }),
      });

      if (response.ok) {
        const reservation: Reservation = await response.json();
        // Redirect to payment page
        router.push(`/booking/${reservation._id}/payment`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create reservation');
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('Failed to create reservation');
    } finally {
      setBookingLoading(false);
    }
  };

  const fromModernDate = (d: DayValue): Date => {
    return new Date(d.year, d.month - 1, d.day);
  };

  useEffect(() => {
    if (space) {
      fetchAvailabilityForDate();
    }
  }, [space, selectedDay]);

  useEffect(() => {
    if (selectedSlot && space) {
      calculatePrice();
    }
  }, [selectedSlot, promoCode, selectedBundle]);

  // Fetch time blocks when date changes
  useEffect(() => {
    if (step === 'time' && selectedDate) {
      fetchTimeBlocks(selectedDate);
    }
  }, [selectedDate, step]);

  const getPricingDisplay = () => {
    switch (currentSpace.pricing.type) {
      case 'free':
        return 'Free';
      case 'hourly':
        return `₹${currentSpace.pricing.basePrice}/hour`;
      case 'daily':
        return `₹${currentSpace.pricing.basePrice}/day`;
      case 'monthly':
        return `₹${currentSpace.pricing.monthlyPrice || currentSpace.pricing.basePrice * 30}/month`;
      case 'package':
        return `From ₹${currentSpace.pricing.basePrice}`;
      default:
        return `₹${currentSpace.pricing.basePrice}`;
    }
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Blinker, sans-serif' }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Book Space</h1>
            {/* Real-time Update Indicator - Always render to prevent hydration issues */}
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              {isClient && lastUpdated ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live • {timeDisplay}</span>
                </>
              ) : (
                <span className="text-transparent">Live • --:--:--</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Space Details */}
            <Card className="mb-6 rounded-2xl shadow-md hover:shadow-[0_0_32px_8px_#8b55ff44] hover:scale-105 transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-black">{currentSpace.name}</CardTitle>
                    <p className="text-black mt-2">{currentSpace.description}</p>
                  </div>
                  <Badge variant="secondary" className="ml-4 rounded-full bg-[#ede9fe] text-[#8b55ff] font-bold px-4 py-2 text-base">
                    {getPricingDisplay()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{currentSpace.address}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-5 w-5 mr-2" />
                    <span>Capacity: {currentSpace.capacity} people</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Image Gallery */}
            {currentSpace.images && currentSpace.images.length > 0 && (
              <Card className="mb-6 rounded-2xl shadow-md overflow-hidden">
                <CardContent className="p-0">
                  <ImageGallery 
                    images={currentSpace.images}
                    className="w-full"
                    showThumbnails={true}
                    autoPlay={true}
                    autoPlayInterval={4000}
                  />
                </CardContent>
              </Card>
            )}

            {/* Amenities */}
            {currentSpace.amenities && currentSpace.amenities.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center text-black">
                    <Star className="h-5 w-5 mr-2" />
                    Amenities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {currentSpace.amenities.map((amenity, index) => {
                      // Handle both string and object formats
                      const amenityName = typeof amenity === 'string' ? amenity : amenity.name;
                      return (
                        <div key={index} className="flex items-center text-sm bg-[#f6f2ff] rounded-full px-3 py-1 mr-2 mb-2">
                          <span className="mr-2">✅</span>
                          <span className="text-black font-blinker font-semibold">{amenityName}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Booking Steps */}
            {step === 'calendar' && (
              <Card className="rounded-2xl shadow-md animate-fade-in-up">
                <CardHeader>
                  <CardTitle className="flex items-center text-black">
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    Select Date
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <div className="w-full max-w-md">
                      <Label htmlFor="booking-date" className="block text-sm font-medium text-black mb-2">
                        Select Date
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">📅</span>
                        <Input
                          id="booking-date"
                          type="date"
                          value={format(selectedDate, 'yyyy-MM-dd')}
                          onChange={(e) => {
                            const newDate = new Date(e.target.value);
                            setSelectedDate(newDate);
                            setSelectedDay({
                              year: newDate.getFullYear(),
                              month: newDate.getMonth() + 1,
                              day: newDate.getDate(),
                            });
                          }}
                          min={format(new Date(), 'yyyy-MM-dd')}
                          className="w-full pl-10 pr-4 py-2 rounded-full border border-[#ede9fe] focus:ring-2 focus:ring-[#8b55ff] focus:border-transparent font-blinker text-black bg-white"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <Button 
                      onClick={handleContinueToTime}
                      className="w-full bg-[#8b55ff] text-white rounded-full py-3 text-lg font-blinker font-bold shadow-md hover:shadow-[0_0_24px_4px_#8b55ff44] hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      ⏭️ Continue to Time Selection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 'time' && (
              <Card className="rounded-2xl shadow-md animate-fade-in-up">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-black">
                    <span className="flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Select Time
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep('calendar')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                  <p className="text-black">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                </CardHeader>
                <CardContent>
                  {timeBlocksLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading available times...</span>
                    </div>
                  ) : timeSlots.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No available time slots for this date.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {timeSlots.map((slot, index) => (
                        <Button
                          key={index}
                          variant={slot.available ? "outline" : "ghost"}
                          disabled={!slot.available}
                          onClick={() => slot.available && handleTimeSlotSelect(slot)}
                          className={`h-20 rounded-full font-blinker text-black bg-white border border-[#ede9fe] transition-all duration-200 shadow-sm hover:shadow-[0_0_16px_2px_#8b55ff44] hover:scale-105 focus:ring-2 focus:ring-[#8b55ff] focus:outline-none ${
                            slot.available 
                              ? 'hover:border-[#8b55ff] hover:text-[#8b55ff]' 
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <div className="text-center w-full">
                            <div className="font-medium text-lg">⏰ {format(new Date(slot.startTime), 'h:mm a')}</div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(slot.endTime), 'h:mm a')}
                            </div>
                            {/* Show time block pricing if available */}
                            {slot.timeBlock && (
                              <div className="mt-1">
                                <div className="text-xs font-medium text-[#8b55ff]">
                                  ₹{slot.timeBlock.price}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {slot.timeBlock.hours}h block
                                </div>
                                {slot.timeBlock.description && (
                                  <div className="text-xs text-gray-400 truncate">
                                    {slot.timeBlock.description}
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Show regular pricing if no time block */}
                            {!slot.timeBlock && slot.price && (
                              <div className="mt-1">
                                <div className="text-xs font-medium text-[#8b55ff]">
                                  ₹{slot.price}
                                </div>
                              </div>
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {step === 'checkout' && selectedSlot && (
              <Card className="rounded-2xl shadow-md animate-fade-in-up">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-black">
                    <span className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Complete Booking
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep('time')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Booking Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold mb-3 text-gray-900">Booking Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="text-gray-900">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="text-gray-900">
                          {format(new Date(selectedSlot.startTime), 'h:mm a')} - {format(new Date(selectedSlot.endTime), 'h:mm a')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="text-gray-900">
                          {Math.round((new Date(selectedSlot.endTime).getTime() - new Date(selectedSlot.startTime).getTime()) / (1000 * 60 * 60))} hours
                        </span>
                      </div>
                      {selectedSlot.timeBlock && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Time Block:</span>
                          <span className="text-gray-900 font-medium">
                            {selectedSlot.timeBlock.hours}h block - ₹{selectedSlot.timeBlock.price}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bundles */}
                  {isClient && availableBundles.length > 0 && (
                    <div className="mb-6">
                      <Label className="text-gray-900">Available Bundles</Label>
                      <div className="mt-2 space-y-2">
                        {availableBundles.map((bundle) => (
                          <div
                            key={bundle._id}
                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                              selectedBundle === bundle._id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => {
                              setSelectedBundle(selectedBundle === bundle._id ? '' : bundle._id);
                              setPromoCode(''); // Clear promo code when bundle is selected
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900">{bundle.name}</h4>
                                <p className="text-sm text-gray-600">{bundle.description}</p>
                                <p className="text-xs text-gray-500">
                                  {bundle.value} hours • Valid until {format(new Date(bundle.validUntil), 'MMM dd, yyyy')}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-blue-600">₹{bundle.price}</div>
                                {selectedBundle === bundle._id && (
                                  <div className="text-xs text-green-600">Selected</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Promo Code */}
                  {!selectedBundle && (
                    <div className="mb-6">
                      <Label htmlFor="promoCode" className="text-black font-medium">Promo Code (Optional)</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="promoCode"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder="Enter promo code"
                          className="text-black bg-white border border-gray-300 focus:border-[#8b55ff] focus:ring-2 focus:ring-[#8b55ff]"
                        />
                        <Button 
                          variant="outline"
                          onClick={calculatePrice}
                          disabled={!promoCode || priceLoading}
                          className="whitespace-nowrap text-black border-black hover:bg-black hover:text-white"
                        >
                          {priceLoading ? 'Applying...' : 'Apply'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedBundle && (
                    <div className="mb-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-800">
                              Bundle selected: {space.pricing.bundles?.find(b => b._id === selectedBundle)?.name}
                            </p>
                            <p className="text-xs text-blue-600">
                              Promo codes cannot be used with bundles
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedBundle('')}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Price Breakdown */}
                  {priceBreakdown && (
                    <div className="bg-white border rounded-lg p-4 mb-6">
                      <h3 className="font-semibold mb-3 text-gray-900">Price Breakdown</h3>
                      <div className="space-y-2">
                        {priceBreakdown.breakdown.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-600">{item.description}</span>
                            <span className={`font-medium ${item.amount < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                              {item.amount < 0 ? '-' : ''}₹{Math.abs(item.amount).toFixed(2)}
                            </span>
                          </div>
                        ))}
                        <Separator className="my-2" />
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total</span>
                          <span className="text-blue-600">₹{priceBreakdown.totalPrice.toFixed(2)}</span>
                        </div>
                        {priceBreakdown.discountAmount > 0 && (
                          <div className="text-sm text-green-600 text-center">
                            You saved ₹{priceBreakdown.discountAmount.toFixed(2)}!
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Book Button */}
                  <Button 
                    onClick={handleBooking}
                    disabled={bookingLoading || !priceBreakdown}
                    className="w-full bg-[#8b55ff] text-white rounded-full py-3 text-lg font-blinker font-bold shadow-md hover:shadow-[0_0_24px_4px_#8b55ff44] hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                    size="lg"
                  >
                    {bookingLoading ? '⏳ Creating Booking...' : '🚀 Book Now'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="rounded-2xl shadow-md">
                <CardHeader>
                  <CardTitle className="text-black">Quick Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-black font-medium">Starting Price</span>
                    <span className="font-semibold text-black">{getPricingDisplay()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-black font-medium">Capacity</span>
                    <span className="font-semibold text-black">{space.capacity} people</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-black font-medium">Minimum Booking</span>
                    <span className="font-semibold text-black">{space.pricing.minimumBookingHours || 1} hour</span>
                  </div>
                  
                  {space.pricing.peakHours && space.pricing.peakHours.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-black mb-2">Peak Hours</h4>
                      <div className="space-y-1">
                        {space.pricing.peakHours.map((peak, index) => (
                          <div key={index} className="text-sm text-black">
                            <span className="capitalize">{peak.day}</span>: {peak.startTime} - {peak.endTime}
                            <span className="text-blue-600 ml-1">({peak.multiplier}x)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sidebar Bundles */}
                  {isClient && availableBundles.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-black mb-2">Available Bundles</h4>
                      <div className="space-y-2">
                        {availableBundles
                          .slice(0, 3) // Show only first 3 bundles in sidebar
                          .map((bundle) => (
                            <div key={bundle._id} className="text-sm">
                              <div className="font-medium text-black">{bundle.name}</div>
                              <div className="text-black">{bundle.value} hours</div>
                              <div className="text-blue-600 font-medium">₹{bundle.price}</div>
                              <div className="text-xs text-black">Valid until {format(new Date(bundle.validUntil), 'MMM dd, yyyy')}</div>
                            </div>
                          ))}
                        {availableBundles.length > 3 && (
                          <div className="text-xs text-black">
                            +{availableBundles.length - 3} more bundles
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 