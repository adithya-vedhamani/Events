'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface PricingManagementProps {
  spaceId: string;
  initialPricing?: Pricing;
}

interface PromoCode {
  _id?: string;
  code: string;
  type: 'percentage' | 'fixed_amount' | 'free_hours';
  value: number;
  validFrom: string;
  validUntil: string;
  maxUses?: number;
  usedCount?: number;
  isActive: boolean;
  description?: string;
  minimumBookingAmount?: number;
  maximumDiscountAmount?: number;
  applicableDays?: string[];
  applicableTimeSlots?: string[];
  firstTimeUserOnly?: boolean;
  newUserOnly?: boolean;
}

interface Bundle {
  _id?: string;
  name: string;
  type: 'time_block' | 'package' | 'seasonal' | 'membership';
  description: string;
  price: number;
  value: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  maxPurchases?: number;
  currentPurchases?: number;
  includedAmenities?: string[];
  transferable?: boolean;
  validityDays?: number;
}

interface TimeBlock {
  _id?: string;
  hours: number;
  price: number;
  description?: string;
  isActive: boolean;
  maxBookings?: number;
  currentBookings?: number;
}

interface PeakHours {
  _id?: string;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  multiplier: number;
  isActive: boolean;
}

interface Pricing {
  type: 'hourly' | 'daily' | 'monthly' | 'package' | 'free';
  basePrice: number;
  currency: string;
  peakMultiplier: number;
  offPeakMultiplier: number;
  peakHours: PeakHours[];
  timeBlocks: TimeBlock[];
  promoCodes: PromoCode[];
  bundles: Bundle[];
  minimumBookingHours: number;
  maximumBookingHours: number;
  advanceBookingDays: number;
  cancellationHours: number;
  lateCancellationFee: number;
  allowPartialBookings: boolean;
  allowSameDayBookings: boolean;
  requireApproval: boolean;
}

export default function PricingManagement({ spaceId, initialPricing }: PricingManagementProps) {
  const defaultPricing: Pricing = {
    type: 'hourly',
    basePrice: 0,
    currency: 'INR',
    peakMultiplier: 1,
    offPeakMultiplier: 1,
    peakHours: [],
    timeBlocks: [],
    promoCodes: [],
    bundles: [],
    minimumBookingHours: 1,
    maximumBookingHours: 0,
    advanceBookingDays: 0,
    cancellationHours: 24,
    lateCancellationFee: 0,
    allowPartialBookings: false,
    allowSameDayBookings: true,
    requireApproval: false,
  };
  const [pricing, setPricing] = useState<Pricing>(initialPricing || defaultPricing);

  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(null);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [editingTimeBlock, setEditingTimeBlock] = useState<TimeBlock | null>(null);
  const [editingPeakHours, setEditingPeakHours] = useState<PeakHours | null>(null);

  const savePricing = async () => {
    setLoading(true);
    try {
      // Basic validation
      if (!pricing.basePrice || pricing.basePrice <= 0) {
        toast.error('Base price must be greater than 0');
        return;
      }

      // Debug: Check current user and space
      const token = localStorage.getItem('token');
      console.log('Current space ID:', spaceId);
      console.log('Token exists:', !!token);
      
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('JWT payload:', payload);
          console.log('User ID from token:', payload.userId);
        } catch {
          console.log('Could not decode JWT token');
        }
      }

      // Debug: Log raw promoCodes before filtering
      console.log('Raw promoCodes before filtering:', pricing.promoCodes);

      // Ensure all objects have required properties
      const sanitizedPricing: Pricing = {
        ...pricing,
        peakHours: pricing.peakHours?.map((peak: PeakHours) => ({
          ...peak,
          isActive: peak.isActive ?? true
        })) || [],
        timeBlocks: pricing.timeBlocks?.map((block: TimeBlock) => ({
          ...block,
          isActive: block.isActive ?? true,
          currentBookings: block.currentBookings ?? 0
        })) || [],
        promoCodes: (pricing.promoCodes || [])
          .filter((code: PromoCode) =>
            code &&
            Object.keys(code).length > 0 && // Remove empty objects
            typeof code.code === 'string' &&
            code.code.trim() !== '' &&
            ['percentage', 'fixed_amount', 'free_hours'].includes(code.type) &&
            typeof code.value === 'number' &&
            code.value >= 0 &&
            typeof code.validFrom === 'string' &&
            typeof code.validUntil === 'string'
          )
          .map((code: PromoCode) => ({
            ...code,
            isActive: code.isActive ?? true
          })),
        bundles: pricing.bundles?.map((bundle: Bundle) => ({
          ...bundle,
          isActive: bundle.isActive ?? true
        })) || []
      };

      console.log('Filtered promoCodes:', sanitizedPricing.promoCodes);
      console.log('Sending pricing data:', sanitizedPricing);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spaces/${spaceId}/pricing`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ pricing: sanitizedPricing }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        toast.success('Pricing updated successfully');
      } else {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error('Backend error data:', errorData);
          
          // Handle different error response formats
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.statusCode === 403) {
            errorMessage = 'You do not have permission to update this space';
          } else if (errorData.statusCode === 404) {
            errorMessage = 'Space not found';
          } else if (Array.isArray(errorData)) {
            errorMessage = errorData.join(', ');
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          const textResponse = await response.text();
          console.error('Raw response text:', textResponse);
          
          // Try to extract meaningful error from text response
          if (textResponse.includes('Forbidden') || textResponse.includes('403')) {
            errorMessage = 'You do not have permission to update this space';
          } else if (textResponse.includes('Not Found') || textResponse.includes('404')) {
            errorMessage = 'Space not found';
          } else if (textResponse.includes('Unauthorized') || textResponse.includes('401')) {
            errorMessage = 'Please log in again to continue';
          } else {
            errorMessage = `Server error: ${response.status}`;
          }
        }
        throw new Error(errorMessage);
      }
    } catch (error: unknown) {
      let errorMessage = 'An unexpected error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      // Only show the "Failed to update pricing" prefix if the error is not already a specific operation error
      if (errorMessage.includes('Failed to delete') || 
          errorMessage.includes('Failed to add') || 
          errorMessage.includes('Failed to update')) {
        toast.error(errorMessage);
      } else {
        toast.error(`Failed to update pricing: ${errorMessage}`);
      }
      console.error('Error updating pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPromoCode = async (promoCode: PromoCode) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spaces/${spaceId}/promo-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(promoCode),
      });

      if (response.ok) {
        const updatedSpace = await response.json();
        setPricing(updatedSpace.pricing);
        toast.success('Promo code added successfully');
        setEditingPromoCode(null);
      } else {
        let errorMessage = 'Failed to add promo code';
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add promo code';
      toast.error(errorMessage);
      console.error('Error adding promo code:', error);
    }
  };

  const updatePromoCode = async (promoCodeId: string, promoCode: PromoCode) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spaces/${spaceId}/promo-codes/${promoCodeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(promoCode),
      });

      if (response.ok) {
        const updatedSpace = await response.json();
        setPricing(updatedSpace.pricing);
        toast.success('Promo code updated successfully');
        setEditingPromoCode(null);
      } else {
        let errorMessage = 'Failed to update promo code';
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update promo code';
      toast.error(errorMessage);
      console.error('Error updating promo code:', error);
    }
  };

  const deletePromoCode = async (promoCodeId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spaces/${spaceId}/promo-codes/${promoCodeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const updatedSpace = await response.json();
        setPricing(updatedSpace.pricing);
        toast.success('Promo code deleted successfully');
      } else {
        let errorMessage = 'Failed to delete promo code';
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete promo code';
      toast.error(errorMessage);
      console.error('Error deleting promo code:', error);
    }
  };

  const addBundle = async (bundle: Bundle) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spaces/${spaceId}/bundles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(bundle),
      });

      if (response.ok) {
        const updatedSpace = await response.json();
        setPricing(updatedSpace.pricing);
        toast.success('Bundle added successfully');
        setEditingBundle(null);
      } else {
        let errorMessage = 'Failed to add bundle';
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add bundle';
      toast.error(errorMessage);
      console.error('Error adding bundle:', error);
    }
  };

  const updateBundle = async (bundleId: string, bundle: Bundle) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spaces/${spaceId}/bundles/${bundleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(bundle),
      });

      if (response.ok) {
        const updatedSpace = await response.json();
        setPricing(updatedSpace.pricing);
        toast.success('Bundle updated successfully');
        setEditingBundle(null);
      } else {
        let errorMessage = 'Failed to update bundle';
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update bundle';
      toast.error(errorMessage);
      console.error('Error updating bundle:', error);
    }
  };

  const deleteBundle = async (bundleId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spaces/${spaceId}/bundles/${bundleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const updatedSpace = await response.json();
        setPricing(updatedSpace.pricing);
        toast.success('Bundle deleted successfully');
      } else {
        let errorMessage = 'Failed to delete bundle';
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete bundle';
      toast.error(errorMessage);
      console.error('Error deleting bundle:', error);
    }
  };

  return (
    <div className="space-y-4 text-black" style={{ fontFamily: 'Blinker, sans-serif', color: '#111' }}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Pricing Management</h2>
        <Button style={{ background: '#8b55ff', color: '#fff' }} onClick={savePricing} disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex gap-2 w-full">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="promo-codes">Promo</TabsTrigger>
          <TabsTrigger value="bundles">Bundles</TabsTrigger>
          <TabsTrigger value="time-blocks">Blocks</TabsTrigger>
          <TabsTrigger value="peak-hours">Peak</TabsTrigger>
        </TabsList>
        <TabsContent value="basic">
          <div className="flex flex-col gap-2">
            <Label>Type</Label>
            <Select value={pricing.type} onValueChange={v => setPricing({ ...pricing, type: v as Pricing['type'] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="package">Package</SelectItem>
                <SelectItem value="free">Free</SelectItem>
              </SelectContent>
            </Select>
            <Label>Base Price (₹)</Label>
            <Input type="number" className="bg-white text-black" value={pricing.basePrice} onChange={e => setPricing({ ...pricing, basePrice: parseFloat(e.target.value) || 0 })} />
            <Label>Min Hours</Label>
            <Input type="number" className="bg-white text-black" value={pricing.minimumBookingHours} onChange={e => setPricing({ ...pricing, minimumBookingHours: parseInt(e.target.value) || 1 })} />
            <Label>Max Hours</Label>
            <Input type="number" className="bg-white text-black" value={pricing.maximumBookingHours} onChange={e => setPricing({ ...pricing, maximumBookingHours: parseInt(e.target.value) || 0 })} />
            <Label>Advance Days</Label>
            <Input type="number" className="bg-white text-black" value={pricing.advanceBookingDays} onChange={e => setPricing({ ...pricing, advanceBookingDays: parseInt(e.target.value) || 0 })} />
            <Label>Free Cancel (hrs)</Label>
            <Input type="number" className="bg-white text-black" value={pricing.cancellationHours} onChange={e => setPricing({ ...pricing, cancellationHours: parseInt(e.target.value) || 24 })} />
            <div className="flex items-center gap-2">
              <Switch checked={pricing.allowPartialBookings} onCheckedChange={checked => setPricing({ ...pricing, allowPartialBookings: checked })} />
              <Label>Partial Bookings</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={pricing.allowSameDayBookings} onCheckedChange={checked => setPricing({ ...pricing, allowSameDayBookings: checked })} />
              <Label>Same Day</Label>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="promo-codes">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span>Promo Codes</span>
            </div>
            {pricing.promoCodes?.length > 0 ? (
              <div className="flex flex-col gap-2">
                {pricing.promoCodes.map((promo: PromoCode) => (
                  <div key={promo._id} className="flex items-center justify-between border rounded p-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{promo.code}</span>
                      <span className="text-xs">{promo.type === 'percentage' ? `${promo.value}%` : promo.type === 'fixed_amount' ? `₹${promo.value}` : `${promo.value}h free`}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => setEditingPromoCode(promo)}>Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => deletePromoCode(promo._id!)}>Del</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <span className="text-xs text-gray-400">No promo codes</span>}
            <div className="flex justify-end mt-2">
              <Button style={{ background: '#8b55ff', color: '#fff' }} onClick={() => setEditingPromoCode({} as PromoCode)} size="sm">Add Promo</Button>
            </div>
            {editingPromoCode && (
              <div className="mt-4">
                <PromoCodeModal
                  promoCode={editingPromoCode}
                  onSave={(promoCode) => {
                    if (promoCode._id) { updatePromoCode(promoCode._id, promoCode); } else { addPromoCode(promoCode); }
                  }}
                  onCancel={() => setEditingPromoCode(null)}
                />
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="bundles">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span>Bundles</span>
            </div>
            {pricing.bundles?.length > 0 ? (
              <div className="flex flex-col gap-2">
                {pricing.bundles.map((bundle: Bundle) => (
                  <div key={bundle._id} className="flex items-center justify-between border rounded p-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{bundle.name}</span>
                      <span className="text-xs">₹{bundle.price} / {bundle.value}h</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => setEditingBundle(bundle)}>Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => deleteBundle(bundle._id!)}>Del</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <span className="text-xs text-gray-400">No bundles</span>}
            <div className="flex justify-end mt-2">
              <Button style={{ background: '#8b55ff', color: '#fff' }} onClick={() => setEditingBundle({} as Bundle)} size="sm">Add Bundle</Button>
            </div>
            {editingBundle && (
              <div className="mt-4">
                <BundleModal
                  bundle={editingBundle}
                  onSave={(bundle) => {
                    if (bundle._id) { updateBundle(bundle._id, bundle); } else { addBundle(bundle); }
                  }}
                  onCancel={() => setEditingBundle(null)}
                />
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="time-blocks">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span>Time Blocks</span>
            </div>
            {pricing.timeBlocks?.length > 0 ? (
              <div className="flex flex-col gap-2">
                {pricing.timeBlocks.map((block: TimeBlock) => (
                  <div key={block._id} className="flex items-center justify-between border rounded p-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{block.hours}h</span>
                      <span className="text-xs">₹{block.price}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => setEditingTimeBlock(block)}>Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => setPricing({ ...pricing, timeBlocks: pricing.timeBlocks.filter((b: TimeBlock) => b._id !== block._id) })}>Del</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <span className="text-xs text-gray-400">No time blocks</span>}
            <div className="flex justify-end mt-2">
              <Button style={{ background: '#8b55ff', color: '#fff' }} onClick={() => setEditingTimeBlock({} as TimeBlock)} size="sm">Add Block</Button>
            </div>
            {editingTimeBlock && (
              <div className="mt-4">
                <TimeBlockModal
                  timeBlock={editingTimeBlock}
                  onSave={(block) => {
                    if (block._id) {
                      setPricing({ ...pricing, timeBlocks: pricing.timeBlocks.map((b: TimeBlock) => b._id === block._id ? block : b) });
                    } else {
                      setPricing({ ...pricing, timeBlocks: [...pricing.timeBlocks, { ...block, _id: Date.now().toString() }] });
                    }
                    setEditingTimeBlock(null);
                  }}
                  onCancel={() => setEditingTimeBlock(null)}
                />
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="peak-hours">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span>Peak Hours</span>
            </div>
            {pricing.peakHours?.length > 0 ? (
              <div className="flex flex-col gap-2">
                {pricing.peakHours.map((peak: PeakHours) => (
                  <div key={peak._id} className="flex items-center justify-between border rounded p-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{peak.day}</span>
                      <span className="text-xs">{peak.startTime} - {peak.endTime} | {peak.multiplier}x</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => setEditingPeakHours(peak)}>Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => setPricing({ ...pricing, peakHours: pricing.peakHours.filter((p: PeakHours) => p._id !== peak._id) })}>Del</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <span className="text-xs text-gray-400">No peak hours</span>}
            <div className="flex justify-end mt-2">
              <Button style={{ background: '#8b55ff', color: '#fff' }} onClick={() => setEditingPeakHours({} as PeakHours)} size="sm">Add Peak</Button>
            </div>
            {editingPeakHours && (
              <div className="mt-4">
                <PeakHoursModal
                  peakHours={editingPeakHours}
                  onSave={(peak) => {
                    if (peak._id) {
                      setPricing({ ...pricing, peakHours: pricing.peakHours.map((p: PeakHours) => p._id === peak._id ? peak : p) });
                    } else {
                      setPricing({ ...pricing, peakHours: [...pricing.peakHours, { ...peak, _id: Date.now().toString() }] });
                    }
                    setEditingPeakHours(null);
                  }}
                  onCancel={() => setEditingPeakHours(null)}
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PromoCodeModal({ promoCode, onSave, onCancel }: { 
  promoCode: PromoCode; 
  onSave: (promoCode: PromoCode) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    code: promoCode.code || '',
    type: promoCode.type || 'percentage',
    value: promoCode.value || 0,
    validFrom: promoCode.validFrom || new Date().toISOString().split('T')[0],
    validUntil: promoCode.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxUses: promoCode.maxUses || 0,
    isActive: promoCode.isActive ?? true,
    description: promoCode.description || '',
    minimumBookingAmount: promoCode.minimumBookingAmount || 0,
    maximumDiscountAmount: promoCode.maximumDiscountAmount || 0,
    applicableDays: promoCode.applicableDays || [],
    applicableTimeSlots: promoCode.applicableTimeSlots || [],
    firstTimeUserOnly: promoCode.firstTimeUserOnly || false,
    newUserOnly: promoCode.newUserOnly || false,
  });

  const handleSave = () => {
    if (!formData.code.trim()) {
      toast.error('Promo code is required');
      return;
    }
    if (formData.value <= 0) {
      toast.error('Value must be greater than 0');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-lg p-6 w-full max-w-sm text-black" style={{ fontFamily: 'Blinker, sans-serif' }}>
      <h3 className="text-xl font-bold mb-4 text-black">{promoCode._id ? 'Edit' : 'Add'} Promo Code</h3>
      <div className="flex flex-col gap-3">
        <Label className="text-black">Code</Label>
        <Input className="bg-white text-black" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="SUMMER20" />
        <Label className="text-black">Type</Label>
        <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v as PromoCode['type'] })}>
          <SelectTrigger className="text-black"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
            <SelectItem value="free_hours">Free Hours</SelectItem>
          </SelectContent>
        </Select>
        <Label className="text-black">Value</Label>
        <Input className="bg-white text-black" type="number" value={formData.value} onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })} placeholder="20" />
        <div className="flex gap-2">
          <div className="flex flex-col flex-1">
            <Label className="text-black">Valid From</Label>
            <Input className="bg-white text-black" type="date" value={formData.validFrom} onChange={e => setFormData({ ...formData, validFrom: e.target.value })} />
          </div>
          <div className="flex flex-col flex-1">
            <Label className="text-black">Valid Until</Label>
            <Input className="bg-white text-black" type="date" value={formData.validUntil} onChange={e => setFormData({ ...formData, validUntil: e.target.value })} />
          </div>
        </div>
        <Label className="text-black">Description</Label>
        <Textarea className="bg-white text-black" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Optional description" />
        <div className="flex items-center gap-2 mt-2">
          <Switch checked={formData.isActive} onCheckedChange={checked => setFormData({ ...formData, isActive: checked })} />
          <Label className="text-black">Active</Label>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button style={{ background: '#eee', color: '#111', border: '1px solid #bbb' }} variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button style={{ background: '#8b55ff', color: '#fff' }} onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
}

function BundleModal({ bundle, onSave, onCancel }: { 
  bundle: Bundle; 
  onSave: (bundle: Bundle) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: bundle.name || '',
    type: bundle.type || 'time_block',
    description: bundle.description || '',
    price: bundle.price || 0,
    value: bundle.value || 0,
    validFrom: bundle.validFrom || new Date().toISOString().split('T')[0],
    validUntil: bundle.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: bundle.isActive ?? true,
    maxPurchases: bundle.maxPurchases || 0,
    currentPurchases: bundle.currentPurchases || 0,
    includedAmenities: bundle.includedAmenities || [],
    transferable: bundle.transferable || false,
    validityDays: bundle.validityDays || 0,
  });

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Bundle name is required');
      return;
    }
    if (formData.price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }
    if (formData.value <= 0) {
      toast.error('Value must be greater than 0');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-lg p-6 w-full max-w-sm text-black" style={{ fontFamily: 'Blinker, sans-serif' }}>
      <h3 className="text-xl font-bold mb-4 text-black">{bundle._id ? 'Edit' : 'Add'} Bundle</h3>
      <div className="flex flex-col gap-3">
        <Label className="text-black">Name</Label>
        <Input className="bg-white text-black" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Weekend Package" />
        <Label className="text-black">Type</Label>
        <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v as Bundle['type'] })}>
          <SelectTrigger className="text-black"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="time_block">Time Block</SelectItem>
            <SelectItem value="package">Package</SelectItem>
            <SelectItem value="seasonal">Seasonal</SelectItem>
            <SelectItem value="membership">Membership</SelectItem>
          </SelectContent>
        </Select>
        <Label className="text-black">Description</Label>
        <Textarea className="bg-white text-black" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Bundle description" />
        <div className="flex gap-2">
          <div className="flex flex-col flex-1">
            <Label className="text-black">Price (₹)</Label>
            <Input className="bg-white text-black" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} placeholder="1000" />
          </div>
          <div className="flex flex-col flex-1">
            <Label className="text-black">Value (hours)</Label>
            <Input className="bg-white text-black" type="number" value={formData.value} onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })} placeholder="10" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex flex-col flex-1">
            <Label className="text-black">Valid From</Label>
            <Input className="bg-white text-black" type="date" value={formData.validFrom} onChange={e => setFormData({ ...formData, validFrom: e.target.value })} />
          </div>
          <div className="flex flex-col flex-1">
            <Label className="text-black">Valid Until</Label>
            <Input className="bg-white text-black" type="date" value={formData.validUntil} onChange={e => setFormData({ ...formData, validUntil: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Switch checked={formData.isActive} onCheckedChange={checked => setFormData({ ...formData, isActive: checked })} />
          <Label className="text-black">Active</Label>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button style={{ background: '#eee', color: '#111', border: '1px solid #bbb' }} variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button style={{ background: '#8b55ff', color: '#fff' }} onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
}

function TimeBlockModal({ timeBlock, onSave, onCancel }: { 
  timeBlock: TimeBlock; 
  onSave: (block: TimeBlock) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    hours: timeBlock.hours || 0,
    price: timeBlock.price || 0,
    description: timeBlock.description || '',
    isActive: timeBlock.isActive ?? true,
    maxBookings: timeBlock.maxBookings || 0,
    currentBookings: timeBlock.currentBookings || 0,
  });

  const handleSave = () => {
    if (formData.hours <= 0) {
      toast.error('Hours must be greater than 0');
      return;
    }
    if (formData.price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-lg p-6 w-full max-w-md text-black">
      <h3 className="text-lg font-semibold mb-4">
        {timeBlock._id ? 'Edit' : 'Add'} Time Block
      </h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Hours</Label>
            <Input
              className="bg-white text-black"
              type="number"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: parseInt(e.target.value) || 0 })}
              placeholder="4"
            />
          </div>
          <div>
            <Label>Price (₹)</Label>
            <Input
              className="bg-white text-black"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              placeholder="500"
            />
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea
            className="bg-white text-black"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label>Active</Label>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
}

function PeakHoursModal({ peakHours, onSave, onCancel }: { 
  peakHours: PeakHours; 
  onSave: (peak: PeakHours) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    day: peakHours.day || 'monday',
    startTime: peakHours.startTime || '09:00',
    endTime: peakHours.endTime || '17:00',
    multiplier: peakHours.multiplier || 1,
    isActive: peakHours.isActive ?? true,
  });

  const handleSave = () => {
    if (formData.multiplier <= 0) {
      toast.error('Multiplier must be greater than 0');
      return;
    }
    if (formData.startTime >= formData.endTime) {
      toast.error('Start time must be before end time');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-lg p-6 w-full max-w-md text-black">
      <h3 className="text-lg font-semibold mb-4">
        {peakHours._id ? 'Edit' : 'Add'} Peak Hours
      </h3>
      <div className="space-y-4">
        <div>
          <Label>Day</Label>
          <Select 
            value={formData.day} 
            onValueChange={(value) => setFormData({ ...formData, day: value as PeakHours['day'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monday">Monday</SelectItem>
              <SelectItem value="tuesday">Tuesday</SelectItem>
              <SelectItem value="wednesday">Wednesday</SelectItem>
              <SelectItem value="thursday">Thursday</SelectItem>
              <SelectItem value="friday">Friday</SelectItem>
              <SelectItem value="saturday">Saturday</SelectItem>
              <SelectItem value="sunday">Sunday</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start Time</Label>
            <Input
              className="bg-white text-black"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
          </div>
          <div>
            <Label>End Time</Label>
            <Input
              className="bg-white text-black"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label>Multiplier</Label>
          <Input
            className="bg-white text-black"
            type="number"
            step="0.1"
            value={formData.multiplier}
            onChange={(e) => setFormData({ ...formData, multiplier: parseFloat(e.target.value) || 1 })}
            placeholder="1.5"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label>Active</Label>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
} 