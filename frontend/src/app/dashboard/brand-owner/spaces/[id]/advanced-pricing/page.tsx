'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Trash2, Edit, Save, X, Clock, Calendar, Tag, Star } from 'lucide-react';

interface PeakHour {
  day: string;
  startTime: string;
  endTime: string;
  multiplier: number;
}

interface TimeBlock {
  hours: number;
  price: number;
  description?: string;
}

interface PromoCode {
  code: string;
  discountPercentage: number;
  validFrom: string;
  validUntil: string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
}

interface SpecialEvent {
  eventName: string;
  startDate: string;
  endDate: string;
  price: number;
  description?: string;
}

interface Space {
  _id: string;
  name: string;
  pricing: {
    type: string;
    basePrice: number;
    currency: string;
    peakMultiplier: number;
    offPeakMultiplier: number;
    peakHours: PeakHour[];
    timeBlocks: TimeBlock[];
    promoCodes: PromoCode[];
    specialEvents: SpecialEvent[];
    minimumBookingHours: number;
  };
}

export default function AdvancedPricingPage() {
  const params = useParams();
  const router = useRouter();
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'peak-hours' | 'time-blocks' | 'promo-codes' | 'special-events'>('peak-hours');
  
  // Peak Hours
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
  const [editingPeakHour, setEditingPeakHour] = useState<PeakHour | null>(null);
  
  // Time Blocks
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [editingTimeBlock, setEditingTimeBlock] = useState<TimeBlock | null>(null);
  
  // Promo Codes
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(null);
  
  // Special Events
  const [specialEvents, setSpecialEvents] = useState<SpecialEvent[]>([]);
  const [editingSpecialEvent, setEditingSpecialEvent] = useState<SpecialEvent | null>(null);

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    fetchSpace();
  }, []);

  const fetchSpace = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spaces/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSpace(data);
        setPeakHours(data.pricing.peakHours || []);
        setTimeBlocks(data.pricing.timeBlocks || []);
        setPromoCodes(data.pricing.promoCodes || []);
        setSpecialEvents(data.pricing.specialEvents || []);
      }
    } catch (error) {
      console.error('Error fetching space:', error);
    } finally {
      setLoading(false);
    }
  };

  // Peak Hours Management
  const addPeakHour = () => {
    const newPeakHour: PeakHour = {
      day: 'monday',
      startTime: '09:00',
      endTime: '17:00',
      multiplier: 1.5,
    };
    setPeakHours([...peakHours, newPeakHour]);
  };

  const updatePeakHour = (index: number, updated: PeakHour) => {
    const updatedPeakHours = [...peakHours];
    updatedPeakHours[index] = updated;
    setPeakHours(updatedPeakHours);
  };

  const removePeakHour = (index: number) => {
    setPeakHours(peakHours.filter((_, i) => i !== index));
  };

  // Time Blocks Management
  const addTimeBlock = () => {
    const newTimeBlock: TimeBlock = {
      hours: 4,
      price: 0,
      description: '',
    };
    setTimeBlocks([...timeBlocks, newTimeBlock]);
  };

  const updateTimeBlock = (index: number, updated: TimeBlock) => {
    const updatedTimeBlocks = [...timeBlocks];
    updatedTimeBlocks[index] = updated;
    setTimeBlocks(updatedTimeBlocks);
  };

  const removeTimeBlock = (index: number) => {
    setTimeBlocks(timeBlocks.filter((_, i) => i !== index));
  };

  // Promo Codes Management
  const addPromoCode = () => {
    const newPromoCode: PromoCode = {
      code: '',
      discountPercentage: 10,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      maxUses: 100,
      usedCount: 0,
      isActive: true,
    };
    setPromoCodes([...promoCodes, newPromoCode]);
  };

  const updatePromoCode = (index: number, updated: PromoCode) => {
    const updatedPromoCodes = [...promoCodes];
    updatedPromoCodes[index] = updated;
    setPromoCodes(updatedPromoCodes);
  };

  const removePromoCode = (index: number) => {
    setPromoCodes(promoCodes.filter((_, i) => i !== index));
  };

  // Special Events Management
  const addSpecialEvent = () => {
    const newSpecialEvent: SpecialEvent = {
      eventName: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: 0,
      description: '',
    };
    setSpecialEvents([...specialEvents, newSpecialEvent]);
  };

  const updateSpecialEvent = (index: number, updated: SpecialEvent) => {
    const updatedSpecialEvents = [...specialEvents];
    updatedSpecialEvents[index] = updated;
    setSpecialEvents(updatedSpecialEvents);
  };

  const removeSpecialEvent = (index: number) => {
    setSpecialEvents(specialEvents.filter((_, i) => i !== index));
  };

  // Save all changes
  const saveChanges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spaces/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pricing: {
            ...space?.pricing,
            peakHours,
            timeBlocks,
            promoCodes,
            specialEvents,
          },
        }),
      });

      if (response.ok) {
        alert('Advanced pricing settings saved successfully!');
        fetchSpace();
      } else {
        alert('Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Error saving changes');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Space not found</h2>
          <p className="text-gray-600">The space you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Advanced Pricing</h1>
            <p className="text-gray-600 mt-2">{space.name}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => router.push(`/dashboard/brand-owner/spaces/${params.id}`)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to Space
            </button>
            <button
              onClick={saveChanges}
              className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'peak-hours', name: 'Peak Hours', icon: Clock },
                { id: 'time-blocks', name: 'Time Blocks', icon: Calendar },
                { id: 'promo-codes', name: 'Promo Codes', icon: Tag },
                { id: 'special-events', name: 'Special Events', icon: Star },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Peak Hours Tab */}
            {activeTab === 'peak-hours' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Peak Hours Configuration</h3>
                  <button
                    onClick={addPeakHour}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Peak Hour</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {peakHours.map((peakHour, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                          <select
                            value={peakHour.day}
                            onChange={(e) => updatePeakHour(index, { ...peakHour, day: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {daysOfWeek.map((day) => (
                              <option key={day} value={day}>
                                {day.charAt(0).toUpperCase() + day.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                          <input
                            type="time"
                            value={peakHour.startTime}
                            onChange={(e) => updatePeakHour(index, { ...peakHour, startTime: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                          <input
                            type="time"
                            value={peakHour.endTime}
                            onChange={(e) => updatePeakHour(index, { ...peakHour, endTime: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-end space-x-2">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Multiplier</label>
                            <input
                              type="number"
                              min="1"
                              step="0.1"
                              value={peakHour.multiplier}
                              onChange={(e) => updatePeakHour(index, { ...peakHour, multiplier: parseFloat(e.target.value) })}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <button
                            onClick={() => removePeakHour(index)}
                            className="p-2 text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Time Blocks Tab */}
            {activeTab === 'time-blocks' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Time Block Bundles</h3>
                  <button
                    onClick={addTimeBlock}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Time Block</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {timeBlocks.map((timeBlock, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                          <input
                            type="number"
                            min="1"
                            value={timeBlock.hours}
                            onChange={(e) => updateTimeBlock(index, { ...timeBlock, hours: parseInt(e.target.value) })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={timeBlock.price}
                            onChange={(e) => updateTimeBlock(index, { ...timeBlock, price: parseFloat(e.target.value) })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="md:col-span-2 flex items-end space-x-2">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                              type="text"
                              value={timeBlock.description || ''}
                              onChange={(e) => updateTimeBlock(index, { ...timeBlock, description: e.target.value })}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., 4-hour package discount"
                            />
                          </div>
                          <button
                            onClick={() => removeTimeBlock(index)}
                            className="p-2 text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Promo Codes Tab */}
            {activeTab === 'promo-codes' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Promo Codes</h3>
                  <button
                    onClick={addPromoCode}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Promo Code</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {promoCodes.map((promoCode, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                          <input
                            type="text"
                            value={promoCode.code}
                            onChange={(e) => updatePromoCode(index, { ...promoCode, code: e.target.value.toUpperCase() })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="SUMMER20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={promoCode.discountPercentage}
                            onChange={(e) => updatePromoCode(index, { ...promoCode, discountPercentage: parseInt(e.target.value) })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
                          <input
                            type="number"
                            min="0"
                            value={promoCode.maxUses}
                            onChange={(e) => updatePromoCode(index, { ...promoCode, maxUses: parseInt(e.target.value) })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                          <input
                            type="date"
                            value={promoCode.validFrom}
                            onChange={(e) => updatePromoCode(index, { ...promoCode, validFrom: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                          <input
                            type="date"
                            value={promoCode.validUntil}
                            onChange={(e) => updatePromoCode(index, { ...promoCode, validUntil: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-end space-x-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={promoCode.isActive}
                              onChange={(e) => updatePromoCode(index, { ...promoCode, isActive: e.target.checked })}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Active</span>
                          </label>
                          <button
                            onClick={() => removePromoCode(index)}
                            className="p-2 text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special Events Tab */}
            {activeTab === 'special-events' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Special Event Pricing</h3>
                  <button
                    onClick={addSpecialEvent}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Special Event</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {specialEvents.map((specialEvent, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                          <input
                            type="text"
                            value={specialEvent.eventName}
                            onChange={(e) => updateSpecialEvent(index, { ...specialEvent, eventName: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., New Year's Eve"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={specialEvent.price}
                            onChange={(e) => updateSpecialEvent(index, { ...specialEvent, price: parseFloat(e.target.value) })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={specialEvent.startDate}
                            onChange={(e) => updateSpecialEvent(index, { ...specialEvent, startDate: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                          <input
                            type="date"
                            value={specialEvent.endDate}
                            onChange={(e) => updateSpecialEvent(index, { ...specialEvent, endDate: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="md:col-span-2 flex items-end space-x-2">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                              type="text"
                              value={specialEvent.description || ''}
                              onChange={(e) => updateSpecialEvent(index, { ...specialEvent, description: e.target.value })}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., Special pricing for New Year's celebrations"
                            />
                          </div>
                          <button
                            onClick={() => removeSpecialEvent(index)}
                            className="p-2 text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 